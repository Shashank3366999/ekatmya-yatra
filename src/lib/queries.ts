/**
 * Read-side data access.
 *
 * Every scoped list goes through `scopeFilter` so visibility rules are applied
 * in one place rather than re-derived per page.
 */
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  activities,
  announcementLikes,
  announcements,
  automations,
  checklistItems,
  districts,
  events,
  journeyPlaces,
  organizerProfiles,
  places,
  states,
  surveySubmissions,
  users,
} from "@/db/schema";

import { scopeFilter } from "./permissions";
import type { SessionUser } from "./types";

/* -------------------------------------------------------------------------- */
/* Geography                                                                  */
/* -------------------------------------------------------------------------- */

export async function listStates() {
  const db = await getDb();
  return db
    .select({ id: states.id, name: states.name, code: states.code })
    .from(states)
    .orderBy(asc(states.name));
}

/** All districts, grouped by state id — small enough to send to the client once. */
export async function listDistrictsByState() {
  const db = await getDb();
  const rows = await db
    .select({ id: districts.id, name: districts.name, stateId: districts.stateId })
    .from(districts)
    .orderBy(asc(districts.name));

  const grouped: Record<string, { id: string; name: string }[]> = {};
  for (const r of rows) {
    (grouped[r.stateId] ??= []).push({ id: r.id, name: r.name });
  }
  return grouped;
}

/* -------------------------------------------------------------------------- */
/* Yatra route & places                                                       */
/* -------------------------------------------------------------------------- */

export async function listRoutePlaces() {
  const db = await getDb();
  return db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      routeOrder: places.routeOrder,
      category: places.category,
      significance: places.significance,
      expectedArrival: places.expectedArrival,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(places)
    .leftJoin(states, eq(states.id, places.stateId))
    .leftJoin(districts, eq(districts.id, places.districtId))
    .where(eq(places.isOnRoute, true))
    .orderBy(asc(places.routeOrder));
}

/**
 * Sites Adi Shankaracharya sanctified across Bharat, for the journey map.
 *
 * Includes places the 2027 Yatra does not halt at — Sharada Peeth in PoK among
 * them — because the Digvijaya Yatra's full reach is the point.
 */
export async function listHeritagePlaces() {
  const db = await getDb();
  return db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      heritageTypes: places.heritageTypes,
      isBeyondReach: places.isBeyondReach,
      isOnRoute: places.isOnRoute,
      significance: places.significance,
      stateName: states.name,
    })
    .from(places)
    .leftJoin(states, eq(states.id, places.stateId))
    .where(eq(places.isHeritageSite, true))
    .orderBy(asc(places.name));
}

/** Counts per heritage grouping, for the "sacred geography" summary. */
export async function heritageCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ types: places.heritageTypes })
    .from(places)
    .where(eq(places.isHeritageSite, true));

  const out: Record<string, number> = {};
  for (const r of rows) {
    for (const t of r.types ?? []) out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

export async function getPlace(placeId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      routeOrder: places.routeOrder,
      category: places.category,
      significance: places.significance,
      expectedArrival: places.expectedArrival,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(places)
    .leftJoin(states, eq(states.id, places.stateId))
    .leftJoin(districts, eq(districts.id, places.districtId))
    .where(eq(places.id, placeId))
    .limit(1);
  return row ?? null;
}

/* -------------------------------------------------------------------------- */
/* Surveys                                                                    */
/* -------------------------------------------------------------------------- */

export type SurveyFilters = {
  status?: string;
  stateId?: string;
  category?: string;
  proposedFor?: string;
  /** Free-text match on place name. */
  q?: string;
};

/** Surveys visible to `user`, newest first. */
export async function listSurveys(
  user: SessionUser,
  filters: SurveyFilters = {},
  limit = 100,
) {
  const db = await getDb();

  const conditions = [
    scopeFilter(user, {
      stateId: surveySubmissions.stateId,
      districtId: surveySubmissions.districtId,
      ownerId: surveySubmissions.submittedById,
    }),
  ];

  if (filters.status) {
    conditions.push(eq(surveySubmissions.status, filters.status as never));
  }
  if (filters.stateId) {
    conditions.push(eq(surveySubmissions.stateId, filters.stateId));
  }
  if (filters.category) {
    conditions.push(eq(surveySubmissions.category, filters.category as never));
  }
  if (filters.proposedFor) {
    conditions.push(eq(surveySubmissions.proposedFor, filters.proposedFor as never));
  }
  if (filters.q) {
    conditions.push(sql`${surveySubmissions.placeName} ilike ${"%" + filters.q + "%"}`);
  }

  return db
    .select({
      id: surveySubmissions.id,
      reference: surveySubmissions.reference,
      placeName: surveySubmissions.placeName,
      category: surveySubmissions.category,
      proposedFor: surveySubmissions.proposedFor,
      recommendation: surveySubmissions.recommendation,
      status: surveySubmissions.status,
      expectedGathering: surveySubmissions.expectedGathering,
      submittedAt: surveySubmissions.submittedAt,
      latitude: surveySubmissions.latitude,
      longitude: surveySubmissions.longitude,
      stateName: states.name,
      districtName: districts.name,
      submittedByName: users.fullName,
    })
    .from(surveySubmissions)
    .leftJoin(states, eq(states.id, surveySubmissions.stateId))
    .leftJoin(districts, eq(districts.id, surveySubmissions.districtId))
    .leftJoin(users, eq(users.id, surveySubmissions.submittedById))
    .where(and(...conditions.filter(Boolean)))
    .orderBy(desc(surveySubmissions.submittedAt))
    .limit(limit);
}

/** Only the surveys this person submitted — the organiser's own list. */
export async function listOwnSurveys(userId: string, limit = 50) {
  const db = await getDb();
  return db
    .select({
      id: surveySubmissions.id,
      reference: surveySubmissions.reference,
      placeName: surveySubmissions.placeName,
      category: surveySubmissions.category,
      status: surveySubmissions.status,
      recommendation: surveySubmissions.recommendation,
      submittedAt: surveySubmissions.submittedAt,
      adminNote: surveySubmissions.adminNote,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(surveySubmissions)
    .leftJoin(states, eq(states.id, surveySubmissions.stateId))
    .leftJoin(districts, eq(districts.id, surveySubmissions.districtId))
    .where(eq(surveySubmissions.submittedById, userId))
    .orderBy(desc(surveySubmissions.submittedAt))
    .limit(limit);
}

/** One survey with everything needed for the detail/review screen. */
export async function getSurvey(surveyId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      survey: surveySubmissions,
      stateName: states.name,
      districtName: districts.name,
      submittedByName: users.fullName,
      submittedByEmail: users.email,
    })
    .from(surveySubmissions)
    .leftJoin(states, eq(states.id, surveySubmissions.stateId))
    .leftJoin(districts, eq(districts.id, surveySubmissions.districtId))
    .leftJoin(users, eq(users.id, surveySubmissions.submittedById))
    .where(eq(surveySubmissions.id, surveyId))
    .limit(1);
  return row ?? null;
}

/** Counts per status, for the dashboards. */
export async function surveyStatusCounts(user: SessionUser) {
  const db = await getDb();
  const filter = scopeFilter(user, {
    stateId: surveySubmissions.stateId,
    districtId: surveySubmissions.districtId,
    ownerId: surveySubmissions.submittedById,
  });

  const rows = await db
    .select({ status: surveySubmissions.status, n: count() })
    .from(surveySubmissions)
    .where(filter)
    .groupBy(surveySubmissions.status);

  const out: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    out[r.status] = Number(r.n);
    total += Number(r.n);
  }
  return { byStatus: out, total };
}

/** Submissions per state, for the admin reports screen. */
export async function surveysByState(user: SessionUser, limit = 12) {
  const db = await getDb();
  const filter = scopeFilter(user, {
    stateId: surveySubmissions.stateId,
    districtId: surveySubmissions.districtId,
    ownerId: surveySubmissions.submittedById,
  });

  return db
    .select({ stateName: states.name, n: count() })
    .from(surveySubmissions)
    .leftJoin(states, eq(states.id, surveySubmissions.stateId))
    .where(filter)
    .groupBy(states.name)
    .orderBy(desc(count()))
    .limit(limit);
}

/** Surveyed places that have coordinates, for the map overlay. */
export async function listSurveyedPlacesForMap(user: SessionUser, limit = 300) {
  const db = await getDb();
  const filter = scopeFilter(user, {
    stateId: surveySubmissions.stateId,
    districtId: surveySubmissions.districtId,
    ownerId: surveySubmissions.submittedById,
  });

  return db
    .select({
      id: surveySubmissions.id,
      name: surveySubmissions.placeName,
      latitude: surveySubmissions.latitude,
      longitude: surveySubmissions.longitude,
      stateName: states.name,
    })
    .from(surveySubmissions)
    .leftJoin(states, eq(states.id, surveySubmissions.stateId))
    .where(
      and(
        filter,
        isNotNull(surveySubmissions.latitude),
        isNotNull(surveySubmissions.longitude),
      ),
    )
    .limit(limit);
}

/* -------------------------------------------------------------------------- */
/* Organisers & users (admin)                                                 */
/* -------------------------------------------------------------------------- */

export async function listOrganizerProfiles(status?: string, limit = 200) {
  const db = await getDb();

  return db
    .select({
      profileId: organizerProfiles.id,
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      level: organizerProfiles.level,
      primaryFunction: organizerProfiles.primaryFunction,
      additionalFunctions: organizerProfiles.additionalFunctions,
      designation: organizerProfiles.designation,
      isSpiritualRepresentative: organizerProfiles.isSpiritualRepresentative,
      availability: organizerProfiles.availability,
      availabilityNote: organizerProfiles.availabilityNote,
      status: organizerProfiles.status,
      reviewNote: organizerProfiles.reviewNote,
      intake: organizerProfiles.intake,
      createdAt: organizerProfiles.createdAt,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(organizerProfiles)
    .innerJoin(users, eq(users.id, organizerProfiles.userId))
    .leftJoin(states, eq(states.id, organizerProfiles.stateId))
    .leftJoin(districts, eq(districts.id, organizerProfiles.districtId))
    .where(status ? eq(organizerProfiles.status, status as never) : undefined)
    .orderBy(desc(organizerProfiles.createdAt))
    .limit(limit);
}

export async function listUsers(limit = 200) {
  const db = await getDb();
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      accountType: users.accountType,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(users)
    .leftJoin(states, eq(states.id, users.stateId))
    .leftJoin(districts, eq(districts.id, users.districtId))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

/** Headline numbers for the admin dashboard. */
export async function adminOverview() {
  const db = await getDb();

  const [
    [userCount],
    [organizerCount],
    [pendingCount],
    [surveyCount],
    [routeCount],
    [unsequencedCount],
    [eventCount],
  ] = await Promise.all([
      // Everyone who has signed up. Counting only accountType='user' made the
      // tile read 0 as soon as people were promoted to organisers.
      db.select({ n: count() }).from(users),
      db
        .select({ n: count() })
        .from(organizerProfiles)
        .where(eq(organizerProfiles.status, "approved")),
      db
        .select({ n: count() })
        .from(organizerProfiles)
        .where(eq(organizerProfiles.status, "pending")),
      db.select({ n: count() }).from(surveySubmissions),
      // Confirmed itinerary: on the route AND placed in order.
      db
        .select({ n: count() })
        .from(places)
        .where(and(eq(places.isOnRoute, true), isNotNull(places.routeOrder))),
      // On the route but not yet placed — counted separately so no screen can
      // show two different "stops" figures for the same journey.
      db
        .select({ n: count() })
        .from(places)
        .where(and(eq(places.isOnRoute, true), isNull(places.routeOrder))),
      db
        .select({ n: count() })
        .from(events)
        .where(gte(events.startsAt, new Date())),
    ]);

  return {
    users: Number(userCount?.n ?? 0),
    organizers: Number(organizerCount?.n ?? 0),
    pendingOrganizers: Number(pendingCount?.n ?? 0),
    surveys: Number(surveyCount?.n ?? 0),
    routeStops: Number(routeCount?.n ?? 0),
    routeUnsequenced: Number(unsequencedCount?.n ?? 0),
    upcomingEvents: Number(eventCount?.n ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                 */
/* -------------------------------------------------------------------------- */

/** Activities relevant to this organiser: assigned to them, or in their scope. */
export async function listActivitiesForUser(user: SessionUser, limit = 50) {
  const db = await getDb();

  const scoped = scopeFilter(user, {
    stateId: activities.stateId,
    districtId: activities.districtId,
    ownerId: activities.assignedToId,
  });

  const mine = eq(activities.assignedToId, user.id);
  const where = scoped ? or(mine, scoped) : undefined;

  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      description: activities.description,
      functionArea: activities.functionArea,
      level: activities.level,
      status: activities.status,
      dueDate: activities.dueDate,
      assignedToId: activities.assignedToId,
      stateName: states.name,
      districtName: districts.name,
      total: sql<number>`count(${checklistItems.id})`,
      done: sql<number>`count(${checklistItems.id}) filter (where ${checklistItems.isDone})`,
    })
    .from(activities)
    .leftJoin(states, eq(states.id, activities.stateId))
    .leftJoin(districts, eq(districts.id, activities.districtId))
    .leftJoin(checklistItems, eq(checklistItems.activityId, activities.id))
    .where(where)
    .groupBy(
      activities.id,
      activities.title,
      activities.description,
      activities.functionArea,
      activities.level,
      activities.status,
      activities.dueDate,
      activities.assignedToId,
      states.name,
      districts.name,
    )
    .orderBy(asc(activities.dueDate))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    total: Number(r.total),
    done: Number(r.done),
  }));
}

export async function getActivity(activityId: string) {
  const db = await getDb();

  const [activity] = await db
    .select({
      id: activities.id,
      title: activities.title,
      description: activities.description,
      functionArea: activities.functionArea,
      level: activities.level,
      status: activities.status,
      dueDate: activities.dueDate,
      stateId: activities.stateId,
      districtId: activities.districtId,
      assignedToId: activities.assignedToId,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(activities)
    .leftJoin(states, eq(states.id, activities.stateId))
    .leftJoin(districts, eq(districts.id, activities.districtId))
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) return null;

  const checklist = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.activityId, activityId))
    .orderBy(asc(checklistItems.position));

  return { activity, checklist };
}

/* -------------------------------------------------------------------------- */
/* Events, journey, announcements, automations                                */
/* -------------------------------------------------------------------------- */

export async function listUpcomingEvents(limit = 20) {
  const db = await getDb();
  return db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startsAt: events.startsAt,
      placeName: places.name,
      stateName: states.name,
    })
    .from(events)
    .leftJoin(places, eq(places.id, events.placeId))
    .leftJoin(states, eq(states.id, places.stateId))
    .where(and(eq(events.isPublished, true), gte(events.startsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function listJourneyPlaceIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ placeId: journeyPlaces.placeId })
    .from(journeyPlaces)
    .where(eq(journeyPlaces.userId, userId));
  return rows.map((r) => r.placeId);
}

export async function listJourneyPlaces(userId: string) {
  const db = await getDb();
  const ids = await listJourneyPlaceIds(userId);
  if (!ids.length) return [];

  return db
    .select({
      id: places.id,
      name: places.name,
      routeOrder: places.routeOrder,
      expectedArrival: places.expectedArrival,
      latitude: places.latitude,
      longitude: places.longitude,
      stateName: states.name,
    })
    .from(places)
    .leftJoin(states, eq(states.id, places.stateId))
    .where(inArray(places.id, ids))
    .orderBy(asc(places.routeOrder));
}

/** Announcements this user should see, honouring the audience targeting. */
export async function listAnnouncementsFor(user: SessionUser | null, limit = 20) {
  const db = await getDb();

  const audiences: string[] = ["everyone"];
  if (user?.accountType === "user") audiences.push("users_only");
  if (user?.organizer?.status === "approved") {
    audiences.push("organizers_only");
    audiences.push(`${user.organizer.level}_organizers`);
  }
  if (user?.accountType === "admin" || user?.accountType === "super_admin") {
    audiences.push(
      "users_only",
      "organizers_only",
      "national_organizers",
      "state_organizers",
      "district_organizers",
    );
  }

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      createdAt: announcements.createdAt,
      stateName: states.name,
      likeCount: sql<number>`count(${announcementLikes.id})`,
      // Whether this viewer has already liked it, for the button state.
      likedByMe: sql<boolean>`bool_or(${announcementLikes.userId} = ${user?.id ?? null})`,
    })
    .from(announcements)
    .leftJoin(states, eq(states.id, announcements.stateId))
    .leftJoin(announcementLikes, eq(announcementLikes.announcementId, announcements.id))
    .where(
      and(
        eq(announcements.isPublished, true),
        inArray(announcements.audience, audiences as never[]),
      ),
    )
    .groupBy(
      announcements.id,
      announcements.title,
      announcements.body,
      announcements.audience,
      announcements.createdAt,
      states.name,
    )
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function listAllAnnouncements(limit = 50) {
  const db = await getDb();
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      isPublished: announcements.isPublished,
      createdAt: announcements.createdAt,
      stateName: states.name,
    })
    .from(announcements)
    .leftJoin(states, eq(states.id, announcements.stateId))
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function listAutomations() {
  const db = await getDb();
  return db.select().from(automations).orderBy(asc(automations.name));
}
