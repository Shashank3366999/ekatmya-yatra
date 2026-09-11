"use server";

/**
 * Survey Server Actions — the core of the first release.
 *
 * Flow: an approved organiser in the survey/route-planning stream files a place
 * proposal; it lands in the admin inbox; the admin triages it and, on approval,
 * can promote it straight onto the Yatra route.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLog, places, surveySubmissions } from "@/db/schema";
import {
  canReviewSurvey,
  canSubmitSurvey,
  isAdmin,
  resolveScope,
} from "@/lib/permissions";
import { getSessionUser, requireOrganizer } from "@/lib/session";
import type { ActionResult, SessionUser } from "@/lib/types";
import {
  fieldErrors,
  firstError,
  surveyReviewSchema,
  surveySchema,
} from "@/lib/validation";

/**
 * Human-readable reference like SUR-0042.
 *
 * Derived from the row count, so it stays short and readable for phone and
 * WhatsApp coordination. Two submissions in the same millisecond could collide;
 * the unique index would reject the second, so we retry with a suffix.
 */
async function nextReference(): Promise<string> {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(surveySubmissions);
  return `SUR-${String(Number(n) + 1).padStart(4, "0")}`;
}

/** Whether `user` is allowed to file a survey inside `stateId`. */
function withinScope(user: SessionUser, stateId: string, districtId: string | null): boolean {
  const scope = resolveScope(user);

  switch (scope.kind) {
    case "all":
      return true;
    case "state":
      return scope.stateId === stateId;
    case "district":
      // A district surveyor files within their district (or leaves it blank).
      return scope.stateId === stateId && (districtId === null || districtId === scope.districtId);
    default:
      return false;
  }
}

export async function submitSurvey(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOrganizer();

  if (!canSubmitSurvey(user)) {
    return {
      ok: false,
      error:
        "Your approved role does not include survey work. Ask the Yatra team to add the Survey responsibility.",
    };
  }

  const parsed = surveySchema.safeParse({
    placeName: formData.get("placeName"),
    stateId: formData.get("stateId") ?? "",
    districtId: formData.get("districtId") ?? "",
    addressNotes: formData.get("addressNotes") ?? "",
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
    category: formData.get("category"),
    proposedFor: formData.get("proposedFor"),
    significance: formData.get("significance") ?? "",
    expectedGathering: formData.get("expectedGathering") ?? "",
    hasParking: formData.get("hasParking") ?? "",
    hasAccommodation: formData.get("hasAccommodation") ?? "",
    hasStageOrHall: formData.get("hasStageOrHall") ?? "",
    isVehicleAccessible: formData.get("isVehicleAccessible") ?? "",
    accessNotes: formData.get("accessNotes") ?? "",
    contactName: formData.get("contactName") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
    contactRole: formData.get("contactRole") ?? "",
    organizationsMet: formData.get("organizationsMet") ?? "",
    recommendation: formData.get("recommendation"),
    observations: formData.get("observations") ?? "",
    intent: formData.get("intent") ?? "submitted",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;

  if (!withinScope(user, data.stateId, data.districtId)) {
    return {
      ok: false,
      error: "You can only file surveys for the area you are approved for.",
    };
  }

  const db = await getDb();

  const [created] = await db
    .insert(surveySubmissions)
    .values({
      reference: await nextReference(),
      submittedById: user.id,
      placeName: data.placeName,
      stateId: data.stateId,
      districtId: data.districtId,
      addressNotes: data.addressNotes,
      latitude: data.latitude,
      longitude: data.longitude,
      category: data.category,
      proposedFor: data.proposedFor,
      significance: data.significance,
      expectedGathering: data.expectedGathering,
      hasParking: data.hasParking,
      hasAccommodation: data.hasAccommodation,
      hasStageOrHall: data.hasStageOrHall,
      isVehicleAccessible: data.isVehicleAccessible,
      accessNotes: data.accessNotes,
      contactName: data.contactName,
      contactPhone: data.contactPhone || null,
      contactRole: data.contactRole,
      organizationsMet: data.organizationsMet,
      recommendation: data.recommendation,
      observations: data.observations,
      status: data.intent,
    })
    .returning({ id: surveySubmissions.id, reference: surveySubmissions.reference });

  await db.insert(auditLog).values({
    actorId: user.id,
    action: data.intent === "draft" ? "survey.draft" : "survey.submit",
    entityType: "survey_submission",
    entityId: created.id,
    detail: { reference: created.reference, placeName: data.placeName },
  });

  revalidatePath("/o/survey");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin");

  redirect(`/o/survey/${created.id}?created=1`);
}

/**
 * Admin triage. On approval with `addToRoute`, the surveyed place is promoted
 * into `places` and linked back — so the map and the survey stay one record.
 */
export async function reviewSurvey(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSessionUser();

  if (!canReviewSurvey(user)) {
    return { ok: false, error: "You do not have permission to review surveys." };
  }

  const parsed = surveyReviewSchema.safeParse({
    surveyId: formData.get("surveyId"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") ?? "",
    addToRoute: formData.get("addToRoute") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const { surveyId, status, adminNote, addToRoute } = parsed.data;
  const db = await getDb();

  const [survey] = await db
    .select()
    .from(surveySubmissions)
    .where(eq(surveySubmissions.id, surveyId))
    .limit(1);

  if (!survey) return { ok: false, error: "That survey no longer exists." };

  let linkedPlaceId = survey.linkedPlaceId;

  if (status === "approved" && addToRoute && !linkedPlaceId) {
    /*
      The new place joins the route UNSEQUENCED (routeOrder stays null).
      Appending it as max+1 would silently make it the Yatra's final stop —
      displacing Kedarnath as the culmination everywhere the itinerary is shown.
      Where it actually belongs in the journey is a human decision, so it waits
      for sequencing in the admin route screen.
    */
    const [place] = await db
      .insert(places)
      .values({
        name: survey.placeName,
        stateId: survey.stateId,
        districtId: survey.districtId,
        category: survey.category,
        latitude: survey.latitude,
        longitude: survey.longitude,
        significance: survey.significance,
        isOnRoute: true,
        routeOrder: null,
      })
      .returning({ id: places.id });

    linkedPlaceId = place.id;
  }

  await db
    .update(surveySubmissions)
    .set({
      status,
      adminNote,
      reviewedById: user!.id,
      reviewedAt: new Date(),
      linkedPlaceId,
      updatedAt: new Date(),
    })
    .where(eq(surveySubmissions.id, surveyId));

  await db.insert(auditLog).values({
    actorId: user!.id,
    action: "survey.review",
    entityType: "survey_submission",
    entityId: surveyId,
    detail: { status, addedToRoute: Boolean(linkedPlaceId && addToRoute) },
  });

  revalidatePath("/admin/surveys");
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath("/admin");
  revalidatePath("/yatra");

  return {
    ok: true,
    message:
      status === "approved" && addToRoute
        ? "Approved and added to the Yatra route. It now awaits sequencing."
        : "Survey updated.",
  };
}

/** Guard used by the survey detail pages. */
export async function canViewSurvey(
  user: SessionUser,
  survey: { submittedById: string; stateId: string; districtId: string | null },
): Promise<boolean> {
  if (isAdmin(user)) return true;
  if (survey.submittedById === user.id) return true;

  const scope = resolveScope(user);
  if (scope.kind === "all") return true;
  if (scope.kind === "state") return scope.stateId === survey.stateId;
  if (scope.kind === "district") {
    return scope.stateId === survey.stateId &&
      (survey.districtId === null || survey.districtId === scope.districtId);
  }
  return false;
}
