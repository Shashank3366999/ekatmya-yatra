/**
 * Rewrites em dashes out of the seeded reference data already in a database.
 *
 * The sources in `src/lib` and `src/db/seed.ts` no longer contain em dashes, so
 * a fresh `db:reset && db:seed` produces clean text. An existing database does
 * not fix itself:
 *
 *   - route places are matched on coordinates and their names updated, but the
 *     heritage pass deliberately keeps "the fuller description of the two", and
 *     the old em-dash wording was the longer one;
 *   - demo activities are only created when absent, so their names were never
 *     revisited.
 *
 * This touches reference data only. Anything a person typed — survey
 * submissions, activity reports, announcements — is left exactly as written.
 * Their words are theirs.
 *
 *   pnpm db:rewrite-dashes            report what would change
 *   pnpm db:rewrite-dashes --apply    write it
 *
 * Stop the dev server first: the local PGlite database is single-process.
 */
import { eq, sql } from "drizzle-orm";

import { loadEnv } from "../lib/env";
import { assertDatabaseFree } from "./guard";
import { MAIN_YATRA_ROUTE } from "../lib/geo-data";
import { HERITAGE_SITES } from "../lib/heritage-data";

loadEnv();

const APPLY = process.argv.includes("--apply");
if (APPLY) assertDatabaseFree("db:rewrite-dashes");

/** The compound stop names, as they were and as they now read. */
const RENAMED: Record<string, string> = {
  "Thrissur — Vadakkunnathan": "Thrissur (Vadakkunnathan)",
  "Kollur — Mookambika": "Kollur (Mookambika)",
  "Nashik — Trimbakeshwar": "Nashik (Trimbakeshwar)",
  "Omkareshwar — Ekatma Dham": "Omkareshwar (Ekatma Dham)",
  "Ujjain — Mahakaleshwar": "Ujjain (Mahakaleshwar)",
  "Varanasi — Kashi": "Varanasi (Kashi)",
  "Prayagraj — Triveni Sangam": "Prayagraj (Triveni Sangam)",
  "Ekatma Yatra 2027 — Main Yatra": "Ekatma Yatra 2027: Main Yatra",
};

/** Apply the renames, then turn the remaining "A — B" into "A at B". */
function clean(value: string): string {
  let out = value;
  for (const [was, now] of Object.entries(RENAMED)) out = out.split(was).join(now);
  // The seeded activity names were "Inauguration Ceremony — <place>".
  out = out.replace(/ — /g, " at ");
  return out;
}

async function main() {
  const { getDb } = await import("./index");
  const s = await import("./schema");
  const db = await getDb();

  let changed = 0;
  const show = (what: string, from: string, to: string) => {
    changed += 1;
    console.log(`  ${what}`);
    console.log(`    was: ${from}`);
    console.log(`    now: ${to}`);
  };

  /* ---------------------------------------------------------------- places */
  const places = await db
    .select({
      id: s.places.id,
      name: s.places.name,
      significance: s.places.significance,
      latitude: s.places.latitude,
      longitude: s.places.longitude,
    })
    .from(s.places);

  for (const p of places) {
    const name = clean(p.name);

    /*
      Take the significance from the sources rather than editing the stored
      string, so the row ends up with exactly the text a fresh seed would give
      it. Same "fuller of the two" rule the seed uses, applied to the new text.
    */
    const near = (lat: number | null, lng: number | null) =>
      lat !== null &&
      lng !== null &&
      p.latitude !== null &&
      p.longitude !== null &&
      Math.abs(p.latitude - lat) < 0.05 &&
      Math.abs(p.longitude - lng) < 0.05;

    const fromRoute = MAIN_YATRA_ROUTE.find((r) => near(r.lat, r.lng))?.significance;
    const fromHeritage = HERITAGE_SITES.find((h) => near(h.lat, h.lng))?.significance;
    const candidates = [fromRoute, fromHeritage].filter(Boolean) as string[];
    const fresh = candidates.sort((a, b) => b.length - a.length)[0];

    const significance =
      p.significance?.includes("—") && fresh ? fresh : (p.significance ?? null);

    if (name !== p.name || significance !== p.significance) {
      show(`place ${p.name}`, `${p.name} | ${p.significance ?? ""}`, `${name} | ${significance ?? ""}`);
      if (APPLY) {
        await db.update(s.places).set({ name, significance }).where(eq(s.places.id, p.id));
      }
    }
  }

  /* ------------------------------------------- yatras, activities, events */
  /*
    Written out rather than looped over a list of tables: a union of Drizzle
    table types collapses their columns, and these three do not agree anyway —
    a yatra has a `name`, an activity and an event have a `title`.
  */
  const yatras = await db
    .select({ id: s.yatras.id, name: s.yatras.name })
    .from(s.yatras)
    .where(sql`${s.yatras.name} like '%—%'`);
  for (const r of yatras) {
    const name = clean(r.name);
    show("yatra name", r.name, name);
    if (APPLY) await db.update(s.yatras).set({ name }).where(eq(s.yatras.id, r.id));
  }

  const activities = await db
    .select({ id: s.activities.id, title: s.activities.title })
    .from(s.activities)
    .where(sql`${s.activities.title} like '%—%'`);
  for (const r of activities) {
    const title = clean(r.title);
    show("activity title", r.title, title);
    if (APPLY) await db.update(s.activities).set({ title }).where(eq(s.activities.id, r.id));
  }

  const events = await db
    .select({ id: s.events.id, title: s.events.title })
    .from(s.events)
    .where(sql`${s.events.title} like '%—%'`);
  for (const r of events) {
    const title = clean(r.title);
    show("event title", r.title, title);
    if (APPLY) await db.update(s.events).set({ title }).where(eq(s.events.id, r.id));
  }

  if (changed === 0) {
    console.log("Nothing to rewrite: no em dashes in the seeded reference data.");
  } else if (APPLY) {
    console.log(`\n✔ rewrote ${changed} row${changed === 1 ? "" : "s"}`);
  } else {
    console.log(`\n${changed} row${changed === 1 ? "" : "s"} would change. Re-run with --apply.`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
