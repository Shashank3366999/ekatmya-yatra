"use server";

/**
 * Lets an already-signed-in user request an organiser posting on their existing
 * account, rather than registering a second time.
 *
 * This matters for data quality: the same person holding two accounts breaks
 * "who filed this survey" and every report built on it.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLog, organizerProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import type { ActionResult, FunctionArea } from "@/lib/types";
import {
  fieldErrors,
  firstError,
  organizerPostingRequestSchema,
} from "@/lib/validation";

export async function requestOrganizerPosting(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  if (user.organizer) {
    return { ok: false, error: "You already have an organiser posting." };
  }

  const parsed = organizerPostingRequestSchema.safeParse({
    stateId: formData.get("stateId") ?? "",
    districtId: formData.get("districtId") ?? "",
    postingKind: formData.get("postingKind") ?? "committee",
    roleTemplateId: formData.get("roleTemplateId") ?? "",
    level: formData.get("level"),
    primaryFunction: formData.get("primaryFunction"),
    additionalFunctions: formData.getAll("additionalFunctions") as string[],
    designation: formData.get("designation") ?? "",
    isSpiritualRepresentative: formData.get("isSpiritualRepresentative") === "on",
    availability: formData.get("availability"),
    availabilityNote: formData.get("availabilityNote") ?? "",
    motivation: formData.get("motivation") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;

  const stateId = data.level === "national" ? null : data.stateId;
  const districtId = data.level === "district" ? data.districtId : null;

  const db = await getDb();

  const additional = (data.additionalFunctions as FunctionArea[]).filter(
    (f) => f !== data.primaryFunction,
  );

  await db.insert(organizerProfiles).values({
    postingKind: data.postingKind,
    roleTemplateId: data.roleTemplateId,
    userId: user.id,
    level: data.level,
    stateId,
    districtId,
    primaryFunction: data.primaryFunction,
    additionalFunctions: additional,
    designation: data.designation,
    isSpiritualRepresentative: data.isSpiritualRepresentative,
    availability: data.availability,
    availabilityNote: data.availabilityNote,
    intake: data.motivation ? { motivation: data.motivation } : null,
    status: "pending",
  });

  // Promote the account type, but access still waits on approval.
  await db
    .update(users)
    .set({ accountType: "organizer", stateId: stateId ?? user.stateId, districtId })
    .where(eq(users.id, user.id));

  await db.insert(auditLog).values({
    actorId: user.id,
    action: "organizer.request",
    entityType: "user",
    entityId: user.id,
    detail: { level: data.level, primaryFunction: data.primaryFunction },
  });

  revalidatePath("/admin/organizers");
  redirect("/pending");
}
