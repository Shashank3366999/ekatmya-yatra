"use server";

/**
 * Admin Server Actions: organiser approval, user access, announcements and
 * automation switches. Every mutation writes an audit_log row — approvals and
 * access changes are exactly the decisions a committee later asks about.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  activities,
  announcements,
  auditLog,
  automations,
  checklistItems,
  organizerProfiles,
  users,
} from "@/db/schema";
import { canApproveOrganizers, isAdmin, isSuperAdmin } from "@/lib/permissions";
import { getRoleTemplate } from "@/lib/queries";
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

  // `has` distinguishes "left blank" from "not part of this submission", so a
  // plain approve does not wipe the team and role.
  const has = (k: string) => formData.has(k);

  const parsed = organizerReviewSchema.safeParse({
    profileId: formData.get("profileId"),
    status: formData.get("status"),
    reviewNote: formData.get("reviewNote") ?? "",
    ...(has("level") ? { level: formData.get("level") } : {}),
    ...(has("stateId") ? { stateId: formData.get("stateId") ?? "" } : {}),
    ...(has("districtId") ? { districtId: formData.get("districtId") ?? "" } : {}),
    ...(has("primaryFunction")
      ? { primaryFunction: formData.get("primaryFunction") }
      : {}),
    ...(has("additionalFunctions")
      ? { additionalFunctions: formData.getAll("additionalFunctions") as string[] }
      : {}),
    ...(has("designation") ? { designation: formData.get("designation") ?? "" } : {}),
    ...(has("reviewTeamRole")
      ? { isSpiritualRepresentative: formData.get("isSpiritualRepresentative") === "on" }
      : {}),
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = await getDb();

  const [before] = await db
    .select()
    .from(organizerProfiles)
    .where(eq(organizerProfiles.id, data.profileId))
    .limit(1);

  if (!before) return { ok: false, error: "That posting no longer exists." };

  /*
    Scope has to agree with the team, or the permission tuple is meaningless —
    a "state team" posting with no state can see nothing. Normalise rather than
    reject, since the admin is deliberately moving someone between teams.
  */
  const level = data.level ?? before.level;
  const stateId =
    level === "national" ? null : (data.stateId ?? before.stateId ?? null);
  const districtId =
    level === "district" ? (data.districtId ?? before.districtId ?? null) : null;

  if (level !== "national" && !stateId) {
    return {
      ok: false,
      error: "A state or district team needs a state. Choose one before saving.",
      fieldErrors: { stateId: ["Choose a state"] },
    };
  }
  if (level === "district" && !districtId) {
    return {
      ok: false,
      error: "A district team needs a district. Choose one before saving.",
      fieldErrors: { districtId: ["Choose a district"] },
    };
  }

  const primaryFunction = data.primaryFunction ?? before.primaryFunction;
  // A role listed as primary should not also appear as an extra.
  const additionalFunctions = (
    data.additionalFunctions ?? before.additionalFunctions ?? []
  ).filter((f) => f !== primaryFunction);

  await db
    .update(organizerProfiles)
    .set({
      status: data.status,
      reviewNote: data.reviewNote,
      reviewedById: admin!.id,
      reviewedAt: new Date(),
      level,
      stateId,
      districtId,
      primaryFunction,
      additionalFunctions,
      designation: data.designation ?? before.designation,
      isSpiritualRepresentative:
        data.isSpiritualRepresentative ?? before.isSpiritualRepresentative,
    })
    .where(eq(organizerProfiles.id, data.profileId));

  /* Record what actually changed — this is the trail a committee asks about. */
  const changes: Record<string, unknown> = {};
  if (before.status !== data.status) {
    changes.status = { from: before.status, to: data.status };
  }
  if (before.level !== level) changes.team = { from: before.level, to: level };
  if (before.primaryFunction !== primaryFunction) {
    changes.role = { from: before.primaryFunction, to: primaryFunction };
  }
  if (before.stateId !== stateId) changes.stateId = { from: before.stateId, to: stateId };
  if (before.districtId !== districtId) {
    changes.districtId = { from: before.districtId, to: districtId };
  }

  await db.insert(auditLog).values({
    actorId: admin!.id,
    action: `organizer.${data.status}`,
    entityType: "organizer_profile",
    entityId: data.profileId,
    detail: { note: data.reviewNote, changes },
  });

  /*
    Approving somebody turns the role they picked into actual work.

    The Yatra team's flow is: the panel holds a role with its checklist, a
    joiner picks one, an admin approves, and then that person has something to
    do and to report against. The checklist is COPIED here rather than read
    from the template forever, so an admin editing the template later does not
    silently rewrite the tasks of people already working.

    Guarded on the transition into `approved` and on the activity not already
    existing, because re-approving or editing an approved posting must not hand
    someone a second copy of the same checklist.
  */
  let checklistCreated = 0;
  if (
    data.status === "approved" &&
    before.status !== "approved" &&
    before.roleTemplateId
  ) {
    const template = await getRoleTemplate(before.roleTemplateId);

    if (template) {
      const [already] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.assignedToId, before.userId),
            eq(activities.title, template.name),
          ),
        )
        .limit(1);

      if (!already) {
        const [activity] = await db
          .insert(activities)
          .values({
            title: template.name,
            description: template.description,
            functionArea: primaryFunction,
            level,
            stateId,
            districtId,
            assignedToId: before.userId,
            createdById: admin!.id,
            status: "not_started",
          })
          .returning({ id: activities.id });

        if (template.items.length > 0) {
          await db.insert(checklistItems).values(
            template.items.map((item, i) => ({
              activityId: activity.id,
              label: item.label,
              position: i,
            })),
          );
        }
        checklistCreated = template.items.length;

        await db.insert(auditLog).values({
          actorId: admin!.id,
          action: "organizer.checklist_assigned",
          entityType: "activity",
          entityId: activity.id,
          detail: { template: template.name, items: template.items.length },
        });
      }
    }
  }

  revalidatePath("/admin/organizers");
  revalidatePath("/admin");
  revalidatePath("/o");
  revalidatePath("/o/activities");

  const movedTeamOrRole = Boolean(changes.team || changes.role);

  return {
    ok: true,
    message:
      data.status === "approved"
        ? checklistCreated > 0
          ? `Approved. Their dashboard is active and the ${checklistCreated}-point checklist for this role is now assigned to them.`
          : movedTeamOrRole
            ? "Approved, with the team and role you set. Their dashboard is now active."
            : "Organiser approved. Their dashboard is now active."
        : movedTeamOrRole
          ? "Team and role updated."
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
