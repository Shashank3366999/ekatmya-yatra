"use server";

/**
 * Admin Server Actions: organiser approval, user access, announcements and
 * automation switches. Every mutation writes an audit_log row — approvals and
 * access changes are exactly the decisions a committee later asks about.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { announcements, auditLog, automations, organizerProfiles, users } from "@/db/schema";
import { canApproveOrganizers, isAdmin, isSuperAdmin } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import {
  announcementSchema,
  automationToggleSchema,
  fieldErrors,
  firstError,
  organizerReviewSchema,
  userAccessSchema,
} from "@/lib/validation";

export async function reviewOrganizer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!canApproveOrganizers(admin)) {
    return { ok: false, error: "You do not have permission to approve organisers." };
  }

  const parsed = organizerReviewSchema.safeParse({
    profileId: formData.get("profileId"),
    status: formData.get("status"),
    reviewNote: formData.get("reviewNote") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const db = await getDb();

  await db
    .update(organizerProfiles)
    .set({
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
      reviewedById: admin!.id,
      reviewedAt: new Date(),
    })
    .where(eq(organizerProfiles.id, parsed.data.profileId));

  await db.insert(auditLog).values({
    actorId: admin!.id,
    action: `organizer.${parsed.data.status}`,
    entityType: "organizer_profile",
    entityId: parsed.data.profileId,
    detail: { note: parsed.data.reviewNote },
  });

  revalidatePath("/admin/organizers");
  revalidatePath("/admin");

  return {
    ok: true,
    message:
      parsed.data.status === "approved"
        ? "Organiser approved — their dashboard is now active."
        : "Organiser request updated.",
  };
}

export async function updateUserAccess(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!isAdmin(admin)) {
    return { ok: false, error: "You do not have permission to change access." };
  }

  const rawActive = formData.get("isActive");
  const rawType = formData.get("accountType");

  const parsed = userAccessSchema.safeParse({
    userId: formData.get("userId"),
    accountType: rawType ? String(rawType) : undefined,
    isActive: rawActive !== null ? rawActive === "true" : undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const { userId, accountType, isActive } = parsed.data;

  // An admin must not lock themselves out or demote themselves by accident.
  if (userId === admin!.id) {
    return { ok: false, error: "You cannot change your own access here." };
  }

  // Only a super admin may mint or remove other admins.
  if (
    accountType &&
    (accountType === "admin" || accountType === "super_admin") &&
    !isSuperAdmin(admin)
  ) {
    return { ok: false, error: "Only a super admin can grant admin access." };
  }

  const db = await getDb();

  const [target] = await db
    .select({ accountType: users.accountType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) return { ok: false, error: "That account no longer exists." };

  if (
    (target.accountType === "admin" || target.accountType === "super_admin") &&
    !isSuperAdmin(admin)
  ) {
    return { ok: false, error: "Only a super admin can modify an admin account." };
  }

  await db
    .update(users)
    .set({
      ...(accountType ? { accountType } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    })
    .where(eq(users.id, userId));

  await db.insert(auditLog).values({
    actorId: admin!.id,
    action: "user.access_update",
    entityType: "user",
    entityId: userId,
    detail: { accountType, isActive },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return { ok: true, message: "Access updated." };
}

export async function createAnnouncement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!isAdmin(admin)) {
    return { ok: false, error: "You do not have permission to post announcements." };
  }

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    stateId: formData.get("stateId") ?? "",
    districtId: formData.get("districtId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const db = await getDb();

  const [created] = await db
    .insert(announcements)
    .values({ ...parsed.data, createdById: admin!.id })
    .returning({ id: announcements.id });

  await db.insert(auditLog).values({
    actorId: admin!.id,
    action: "announcement.create",
    entityType: "announcement",
    entityId: created.id,
    detail: { audience: parsed.data.audience },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/home");

  return { ok: true, message: "Announcement published." };
}

/**
 * Enable/disable an automation.
 *
 * The MVP ships the registry and the switches. Nothing dispatches yet — the
 * sending provider is still to be chosen (docs/TEAM-QUESTIONS.md Q8), so the
 * admin UI is explicit that these are not live.
 */
export async function toggleAutomation(formData: FormData): Promise<void> {
  const admin = await getSessionUser();
  if (!isAdmin(admin)) return;

  const parsed = automationToggleSchema.safeParse({
    automationId: formData.get("automationId"),
    isEnabled: formData.get("isEnabled") === "true",
  });
  if (!parsed.success) return;

  const db = await getDb();

  await db
    .update(automations)
    .set({ isEnabled: parsed.data.isEnabled, updatedAt: new Date() })
    .where(eq(automations.id, parsed.data.automationId));

  await db.insert(auditLog).values({
    actorId: admin!.id,
    action: parsed.data.isEnabled ? "automation.enable" : "automation.disable",
    entityType: "automation",
    entityId: parsed.data.automationId,
  });

  revalidatePath("/admin/automations");
}
