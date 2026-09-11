/**
 * Seeds reference data and a demo dataset.
 *
 * Idempotent: safe to re-run. Reference rows (states, districts, route places,
 * automations) are upserted; demo accounts are only created if absent.
 */
import { eq, sql } from "drizzle-orm";

import { loadEnv } from "../lib/env";
import { assertDatabaseFree } from "./guard";
import {
  DISTRICTS,
  MAIN_YATRA_ROUTE,
  STATES,
} from "../lib/geo-data";
import { HERITAGE_SITES } from "../lib/heritage-data";
import { hashPassword } from "../lib/password";

loadEnv();
assertDatabaseFree("db:seed");

/**
 * The Yatra window, as confirmed by the Yatra team's official announcement:
 * 16 January to 10 May 2027, Kalady (Kerala) to Kedarnath (Uttarakhand).
 */
const YATRA_START = new Date(Date.UTC(2027, 0, 16));
const YATRA_END = new Date(Date.UTC(2027, 4, 10));
/** Days available for the itinerary, used to spread the seeded stops. */
const YATRA_DAYS = Math.round(
  (YATRA_END.getTime() - YATRA_START.getTime()) / 86_400_000,
);

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

const AUTOMATIONS = [
  {
    key: "organizer_welcome",
    name: "Organiser welcome email",
    description: "Sent once an admin approves an organiser's posting.",
    channel: "email",
  },
  {
    key: "checklist_reminder",
    name: "Checklist reminder",
    description: "Daily nudge to organisers with pending checklist items.",
    channel: "reminder",
  },
  {
    key: "survey_followup",
    name: "Survey follow-up",
    description: "Reminds survey teams whose district has no submission this week.",
    channel: "reminder",
  },
  {
    key: "pending_approval_digest",
    name: "Pending approvals digest",
    description: "Daily summary to admins of organisers awaiting approval.",
    channel: "email",
  },
  {
    key: "event_reminder",
    name: "Event reminder",
    description: "Notifies users about upcoming events near their district.",
    channel: "notification",
  },
  {
    key: "yatra_progress",
    name: "Yatra progress update",
    description: "Weekly journey progress summary to all registered users.",
    channel: "email",
  },
];

async function main() {
  const { getDb, usingPglite } = await import("./index");
  const s = await import("./schema");
  const db = await getDb();

  console.log(`→ seeding (${usingPglite ? "PGlite" : "Postgres"})`);

  /* ---------------------------------------------------------------- states */
  await db
    .insert(s.states)
    .values(
      STATES.map((st) => ({
        code: st.code,
        name: st.name,
        isUnionTerritory: st.ut ?? false,
      })),
    )
    .onConflictDoNothing({ target: s.states.code });

  const stateRows = await db.select({ id: s.states.id, code: s.states.code }).from(s.states);
  const stateByCode = new Map(stateRows.map((r) => [r.code, r.id]));
  console.log(`  states: ${stateRows.length}`);

  /* ------------------------------------------------------------- districts */
  const districtValues = Object.entries(DISTRICTS).flatMap(([code, names]) => {
    const stateId = stateByCode.get(code);
    if (!stateId) return [];
    return names.map((name) => ({ stateId, name }));
  });

  if (districtValues.length) {
    await db
      .insert(s.districts)
      .values(districtValues)
      .onConflictDoNothing({ target: [s.districts.stateId, s.districts.name] });
  }

  const districtRows = await db
    .select({ id: s.districts.id, name: s.districts.name, stateId: s.districts.stateId })
    .from(s.districts);
  const districtKey = (stateId: string, name: string) => `${stateId}::${name}`;
  const districtByKey = new Map(
    districtRows.map((r) => [districtKey(r.stateId, r.name), r.id]),
  );
  console.log(`  districts: ${districtRows.length}`);

  /* ----------------------------------------------------------- main yatra */
  let [mainYatra] = await db
    .select()
    .from(s.yatras)
    .where(eq(s.yatras.kind, "main"))
    .limit(1);

  if (!mainYatra) {
    [mainYatra] = await db
      .insert(s.yatras)
      .values({
        kind: "main",
        name: "Ekatma Yatra 2027: Main Yatra",
        startDate: YATRA_START,
        endDate: YATRA_END,
        description:
          "16 January to 10 May 2027. Kalady (Kerala) to Kedarnath (Uttarakhand), tracing Adi Shankaracharya's Digvijaya Yatra and weaving the nation into a thread of oneness.",
      })
      .returning();
    console.log("  main yatra: created");
  }

  /* --------------------------------------------------------- route places */
  for (const [index, stop] of MAIN_YATRA_ROUTE.entries()) {
    const stateId = stateByCode.get(stop.stateCode);
    if (!stateId) continue;

    const districtId = stop.district
      ? (districtByKey.get(districtKey(stateId, stop.district)) ?? null)
      : null;

    /*
      Match on coordinates, not on the name.

      Matching by name meant that renaming a stop inserted a second row rather
      than updating the first, leaving the old name on the route and inflating
      the stop count — which is exactly what happened when the compound names
      were rewritten from "Varanasi — Kashi" to "Varanasi (Kashi)". Coordinates
      are the stable identity: the closest two stops on the route, Haridwar and
      Rishikesh, are 0.141 degrees apart, so a 0.05 degree window cannot
      confuse them. Scoped to route places so it never claims a
      heritage-only place that shares a city.
    */
    const existing = await db
      .select({ id: s.places.id })
      .from(s.places)
      .where(
        sql`abs(${s.places.latitude} - ${stop.lat}) < 0.05
            and abs(${s.places.longitude} - ${stop.lng}) < 0.05
            and ${s.places.isOnRoute} = true`,
      )
      .limit(1);

    const values = {
      name: stop.name,
      stateId,
      districtId,
      category: stop.category,
      latitude: stop.lat,
      longitude: stop.lng,
      significance: stop.significance,
      imageUrl: stop.image,
      isOnRoute: true,
      yatraId: mainYatra.id,
      routeOrder: index + 1,
      // Spread the seeded stops proportionally across the confirmed window.
      expectedArrival: addDays(
        YATRA_START,
        Math.round((stop.dayOffset / 121) * YATRA_DAYS),
      ),
    };

    if (existing.length) {
      await db.update(s.places).set(values).where(eq(s.places.id, existing[0].id));
    } else {
      await db.insert(s.places).values(values);
    }
  }
  console.log(`  route places: ${MAIN_YATRA_ROUTE.length}`);

  /* ------------------------------------------------- sacred geography */
  /*
    Sites Adi Shankaracharya sanctified across Bharat. Drawn on the journey map
    alongside the route so the product conveys the whole Digvijaya Yatra, not
    only the 2027 itinerary. Where a heritage site IS a route stop, we enrich
    the existing row rather than inserting a duplicate.
  */
  let heritageEnriched = 0;
  let heritageAdded = 0;

  for (const site of HERITAGE_SITES) {
    const stateId = stateByCode.get(site.stateCode);
    if (!stateId) continue;

    const districtId = site.district
      ? (districtByKey.get(districtKey(stateId, site.district)) ?? null)
      : null;

    /*
      Match an existing place by coordinates — names differ between the
      itinerary ("Sringeri") and the heritage list ("Sringeri Sharada Peetham"),
      and several sites share a city (the Kanchi Peetham and the Kamakshi
      Shakti Peetha are both in Kanchipuram).
    */
    const [existing] = await db
      .select({
        id: s.places.id,
        heritageTypes: s.places.heritageTypes,
        isBeyondReach: s.places.isBeyondReach,
        significance: s.places.significance,
      })
      .from(s.places)
      .where(
        sql`abs(${s.places.latitude} - ${site.lat}) < 0.05
            and abs(${s.places.longitude} - ${site.lng}) < 0.05`,
      )
      .limit(1);

    if (existing) {
      /*
        MERGE, do not replace. Two heritage entries can resolve to one place,
        and a plain overwrite dropped the earlier one's types — Kanchipuram
        ended up a Shakti Peetha having lost its Amnaya Peetham standing.
      */
      await db
        .update(s.places)
        .set({
          isHeritageSite: true,
          heritageTypes: [...new Set([...(existing.heritageTypes ?? []), ...site.types])],
          isBeyondReach: existing.isBeyondReach || (site.beyondReach ?? false),
          // Keep the fuller description of the two.
          significance:
            (existing.significance?.length ?? 0) >= site.significance.length
              ? existing.significance
              : site.significance,
        })
        .where(eq(s.places.id, existing.id));
      heritageEnriched += 1;
    } else {
      await db.insert(s.places).values({
        name: site.name,
        stateId,
        districtId,
        category: "advaita_heritage",
        latitude: site.lat,
        longitude: site.lng,
        isOnRoute: false,
        routeOrder: null,
        isHeritageSite: true,
        heritageTypes: site.types,
        isBeyondReach: site.beyondReach ?? false,
        significance: site.significance,
      });
      heritageAdded += 1;
    }
  }
  console.log(
    `  heritage sites: ${HERITAGE_SITES.length} (${heritageEnriched} on the route, ${heritageAdded} added)`,
  );

  /* ---------------------------------------------------------- automations */
  await db
    .insert(s.automations)
    .values(AUTOMATIONS)
    .onConflictDoNothing({ target: s.automations.key });
  console.log(`  automations: ${AUTOMATIONS.length}`);

  /* --------------------------------------------------------------- admin */
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@ekatmadham.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Yatra@2026";

  const [existingAdmin] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(s.users).values({
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      fullName: "Yatra Administrator",
      accountType: "super_admin",
    });
    console.log(`  admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  admin: ${adminEmail} (already present)`);
  }

  /* ------------------------------------------------- demo organiser + data */
  const demoEmail = "survey.kerala@ekatmadham.com";
  const [existingDemo] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, demoEmail))
    .limit(1);

  if (!existingDemo) {
    const keralaId = stateByCode.get("KL")!;
    const ernakulamId = districtByKey.get(districtKey(keralaId, "Ernakulam"))!;

    const [demoUser] = await db
      .insert(s.users)
      .values({
        email: demoEmail,
        passwordHash: await hashPassword("Yatra@2026"),
        fullName: "Priya Menon",
        phone: "+91 98470 00000",
        accountType: "organizer",
        stateId: keralaId,
        districtId: ernakulamId,
      })
      .returning();

    await db.insert(s.organizerProfiles).values({
      userId: demoUser.id,
      level: "state",
      stateId: keralaId,
      primaryFunction: "survey",
      additionalFunctions: ["route_planning"],
      designation: "State Survey Coordinator",
      status: "approved",
      reviewedAt: new Date(),
    });

    // A pending organiser so the approval queue is not empty on first login.
    const [pendingUser] = await db
      .insert(s.users)
      .values({
        email: "media.mp@ekatmadham.com",
        passwordHash: await hashPassword("Yatra@2026"),
        fullName: "Amit Verma",
        phone: "+91 94250 00000",
        accountType: "organizer",
        stateId: stateByCode.get("MP")!,
      })
      .returning();

    await db.insert(s.organizerProfiles).values({
      userId: pendingUser.id,
      level: "state",
      stateId: stateByCode.get("MP")!,
      primaryFunction: "media_pr",
      additionalFunctions: ["social_media"],
      designation: "State Media Coordinator",
      status: "pending",
    });

    // One demo survey submission so the admin inbox demonstrates the flow.
    await db.insert(s.surveySubmissions).values({
      reference: "SUR-0001",
      submittedById: demoUser.id,
      placeName: "Sree Krishna Temple, Perumbavoor",
      stateId: keralaId,
      districtId: ernakulamId,
      addressNotes: "Near the Perumbavoor bus stand, 12 km from Kalady.",
      latitude: 10.1069,
      longitude: 76.4776,
      category: "religious",
      proposedFor: "sub",
      significance:
        "Long-standing local temple with an active Advaita study circle; the trustees have offered to host a reception.",
      expectedGathering: 2500,
      hasParking: true,
      hasAccommodation: false,
      hasStageOrHall: true,
      isVehicleAccessible: true,
      accessNotes: "Wide approach road, buses can reach the entrance.",
      contactName: "Sri Ramesh Nair",
      contactPhone: "+91 98460 11111",
      contactRole: "Temple Trust Secretary",
      organizationsMet: ["Perumbavoor Temple Trust", "Advaita Vedanta Study Circle"],
      recommendation: "strongly_recommended",
      observations:
        "Trust is willing to arrange volunteers and prasadam. Suggest a morning slot to avoid the market crowd.",
      status: "submitted",
    });

    console.log("  demo organiser + 1 pending organiser + 1 survey created");
  } else {
    console.log("  demo data: already present");
  }

  /* -------------------------------------------------------------- events */
  const eventCount = await db.select({ id: s.events.id }).from(s.events).limit(1);
  if (!eventCount.length) {
    const routePlaces = await db
      .select({ id: s.places.id, name: s.places.name, arrival: s.places.expectedArrival })
      .from(s.places)
      .where(eq(s.places.isOnRoute, true))
      .orderBy(s.places.routeOrder)
      .limit(4);

    if (routePlaces.length) {
      await db.insert(s.events).values(
        routePlaces.map((p, i) => ({
          title:
            i === 0
              ? `Inauguration Ceremony at ${p.name}`
              : `Cultural Programme & Satsang at ${p.name}`,
          description:
            "Public gathering with discourse on Advaita, cultural performances and community participation.",
          placeId: p.id,
          yatraId: mainYatra.id,
          startsAt: p.arrival ?? addDays(YATRA_START, i * 5),
        })),
      );
      console.log(`  events: ${routePlaces.length}`);
    }
  }

  console.log("✔ seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ seed failed");
  console.error(err);
  process.exit(1);
});
