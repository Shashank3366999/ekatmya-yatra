/**
 * The access model.
 *
 * Per docs/ARCHITECTURE.md §2, access is NOT `role === "organizer"`. It is the
 * resolved tuple of:
 *
 *     account type  +  organisational level  +  geographic scope  +  function
 *
 * Every list query in the app funnels through `scopeFilter()`, so adding a new
 * module automatically inherits correct visibility instead of re-implementing it.
 */
import { and, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import type { FunctionArea, OrgLevel, SessionUser } from "./types";

/* -------------------------------------------------------------------------- */
/* Coarse capability checks                                                   */
/* -------------------------------------------------------------------------- */

export function isAdmin(user: SessionUser | null): boolean {
  return user?.accountType === "admin" || user?.accountType === "super_admin";
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.accountType === "super_admin";
}

/** An organiser only becomes operational once an admin approves their posting. */
export function isApprovedOrganizer(user: SessionUser | null): boolean {
  return user?.accountType === "organizer" && user.organizer?.status === "approved";
}

/** Admins see everything; approved organisers see their scope. */
export function canAccessOrganizerArea(user: SessionUser | null): boolean {
  return isAdmin(user) || isApprovedOrganizer(user);
}

/**
 * Whether the user works in a given functional stream. Admins implicitly do.
 * An organiser's streams are their primary plus any additional ones approved.
 */
export function hasFunction(user: SessionUser | null, area: FunctionArea): boolean {
  if (isAdmin(user)) return true;
  if (!isApprovedOrganizer(user) || !user?.organizer) return false;

  const { primaryFunction, additionalFunctions } = user.organizer;
  return primaryFunction === area || additionalFunctions.includes(area);
}

/** Who may submit survey entries: survey/route-planning streams, or an admin. */
export function canSubmitSurvey(user: SessionUser | null): boolean {
  return hasFunction(user, "survey") || hasFunction(user, "route_planning");
}

/** Who may change a survey's review status. Admin-only for now (Q6). */
export function canReviewSurvey(user: SessionUser | null): boolean {
  return isAdmin(user);
}

export function canApproveOrganizers(user: SessionUser | null): boolean {
  return isAdmin(user);
}

/* -------------------------------------------------------------------------- */
/* Geographic scope                                                           */
/* -------------------------------------------------------------------------- */

export type Scope =
  | { kind: "all" }
  | { kind: "state"; stateId: string }
  | { kind: "district"; stateId: string; districtId: string }
  | { kind: "own" }
  | { kind: "none" };

/**
 * Resolve how wide a user's view is.
 *
 * - admins and national organisers  -> everything
 * - state organisers                -> their state
 * - district organisers             -> their district
 * - approved organiser with no geo  -> only their own records
 * - everyone else                   -> nothing
 */
export function resolveScope(user: SessionUser | null): Scope {
  if (!user) return { kind: "none" };
  if (isAdmin(user)) return { kind: "all" };

  if (!isApprovedOrganizer(user) || !user.organizer) return { kind: "none" };

  const { level, stateId, districtId } = user.organizer;

  if (level === "national") return { kind: "all" };
  if (level === "state" && stateId) return { kind: "state", stateId };
  if (level === "district" && stateId && districtId) {
    return { kind: "district", stateId, districtId };
  }

  // Approved but incompletely scoped: fail closed to their own submissions.
  return { kind: "own" };
}

/** Human label for the scope, shown in dashboard headers. */
export function scopeLabel(scope: Scope, names: { state?: string; district?: string }): string {
  switch (scope.kind) {
    case "all":
      return "All India";
    case "state":
      return names.state ?? "State";
    case "district":
      return names.district ? `${names.district}, ${names.state ?? ""}`.replace(/, $/, "") : "District";
    case "own":
      return "My submissions";
    case "none":
      return "No access";
  }
}

/** The scoped columns of whatever table is being queried. */
export type ScopedColumns = {
  stateId: PgColumn;
  districtId?: PgColumn;
  /** Column holding the record's author, used by the "own records only" scope. */
  ownerId?: PgColumn;
};

/** A predicate that can never be true — a deny that still composes as a filter. */
const DENY_ALL = sql`1 = 0`;

/**
 * Build the WHERE clause that restricts a scoped table to what `user` may see.
 *
 * `columns` names the relevant columns on the table being queried, so this works
 * for surveys, activities, announcements and anything added later.
 *
 * Returns `undefined` for unrestricted access (no filter needed).
 */
export function scopeFilter(
  user: SessionUser | null,
  columns: ScopedColumns,
): SQL | undefined {
  const scope = resolveScope(user);

  switch (scope.kind) {
    case "all":
      return undefined;

    case "state":
      return eq(columns.stateId, scope.stateId);

    case "district": {
      const inState = eq(columns.stateId, scope.stateId);
      if (!columns.districtId) return inState;
      // District organisers also need state-wide rows that carry no district.
      return and(
        inState,
        or(eq(columns.districtId, scope.districtId), isNull(columns.districtId)),
      )!;
    }

    case "own":
      return columns.ownerId && user ? eq(columns.ownerId, user.id) : DENY_ALL;

    case "none":
      return DENY_ALL;
  }
}

/* -------------------------------------------------------------------------- */
/* Display metadata                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The Yatra team describes joining as two choices: *which team* you want to
 * join, and *which role* within it — "national team में survey choose किया या
 * event planning या digital media". So `OrgLevel` is presented as the team and
 * `FunctionArea` as the role. These are the labels for that choice.
 */
export const FUNCTION_LABELS: Record<FunctionArea, string> = {
  survey: "Survey & Research",
  route_planning: "Route Planning",
  media_pr: "Media & PR",
  logistics: "Logistics",
  fleet: "Fleet Management",
  medical: "Medical & Health",
  boarding_lodging: "Boarding & Lodging",
  concept_design: "Concept Design",
  print_media: "Print Media",
  social_media: "Digital & Social Media",
  invite_outreach: "Invite & Outreach",
  event_planning: "Event Planning",
  finance: "Finance",
  general: "General",
};

/** Compact form, for dense display next to a state or district name. */
export const LEVEL_LABELS: Record<OrgLevel, string> = {
  national: "National",
  state: "State",
  district: "District / Zilla",
};

/** The team you join, as it is phrased when choosing. */
export const TEAM_LABELS: Record<OrgLevel, string> = {
  national: "National team",
  state: "State team",
  district: "District / Zilla team",
};

/** What each team covers, shown under the choice. */
export const TEAM_DESCRIPTIONS: Record<OrgLevel, string> = {
  national: "Works across all of Bharat, alongside the national organising team.",
  state: "Your state's chapter — everything happening in that state.",
  district: "Your district's team, including its local Sub-Yatra.",
};
