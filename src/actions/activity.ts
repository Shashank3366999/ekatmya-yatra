"use server";

/** Activity tracking: checklist completion and progress reports. */
import { revalidatePath } from "next/cache";
import { and, count, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { activities, activityReports, checklistItems } from "@/db/schema";
import { resolveScope } from "@/lib/permissions";
import { requireOrganizer } from "@/lib/session";
import type { ActionResult, SessionUser } from "@/lib/types";
import {
  activityReportSchema,
  checklistToggleSchema,
  fieldErrors,
  firstError,
} from "@/lib/validation";

/** Whether the organiser may act on this activity. */
async function mayEditActivity(user: SessionUser, activityId: string): Promise<boolean> {
  const db = await getDb();
  const [activity] = await db
    .select({
      assignedToId: activities.assignedToId,
      stateId: activities.stateId,
      districtId: activities.districtId,
    })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) return false;
  if (activity.assignedToId === user.id) return true;

  const scope = resolveScope(user);
  if (scope.kind === "all") return true;
  if (scope.kind === "state") return activity.stateId === scope.stateId;
  if (scope.kind === "district") {
    return (
      activity.stateId === scope.stateId &&
      (activity.districtId === null || activity.districtId === scope.districtId)
    );
  }
  return false;
}

/**
 * Recompute an activity's status from its checklist, so progress reflects the
 * work rather than needing a separate manual status change.
 */
async function syncActivityStatus(activityId: string): Promise<void> {
  const db = await getDb();

  const [{ total, done }] = await db
    .select({
      total: count(),
      done: sql<number>`count(*) filter (where ${checklistItems.isDone})`,
    })
    .from(checklistItems)
    .where(eq(checklistItems.activityId, activityId));

  const totalN = Number(total);
  const doneN = Number(done);
  if (totalN === 0) return;

  const status = doneN === 0 ? "not_started" : doneN === totalN ? "completed" : "in_progress";

  await db.update(activities).set({ status }).where(eq(activities.id, activityId));
}

export async function toggleChecklistItem(formData: FormData): Promise<void> {
  const user = await requireOrganizer();

  const parsed = checklistToggleSchema.safeParse({
    itemId: formData.get("itemId"),
    isDone: formData.get("isDone") === "true",
  });
  if (!parsed.success) return;

  const db = await getDb();

  const [item] = await db
    .select({ activityId: checklistItems.activityId })
    .from(checklistItems)
    .where(eq(checklistItems.id, parsed.data.itemId))
    .limit(1);
  if (!item) return;

  if (!(await mayEditActivity(user, item.activityId))) return;

  await db
    .update(checklistItems)
    .set({
      isDone: parsed.data.isDone,
      doneById: parsed.data.isDone ? user.id : null,
      doneAt: parsed.data.isDone ? new Date() : null,
    })
    .where(eq(checklistItems.id, parsed.data.itemId));

  await syncActivityStatus(item.activityId);

  revalidatePath(`/o/activities/${item.activityId}`);
  revalidatePath("/o/activities");
  revalidatePath("/o");
}

export async function addActivityReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOrganizer();

  const parsed = activityReportSchema.safeParse({
    activityId: formData.get("activityId"),
    body: formData.get("body"),
    peopleMet: formData.get("peopleMet") ?? "",
    statusAtReport: formData.get("statusAtReport"),
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  if (!(await mayEditActivity(user, parsed.data.activityId))) {
    return { ok: false, error: "You cannot post updates on this activity." };
  }

  const db = await getDb();

  await db.insert(activityReports).values({
    activityId: parsed.data.activityId,
    authorId: user.id,
    body: parsed.data.body,
    peopleMet: parsed.data.peopleMet,
    statusAtReport: parsed.data.statusAtReport,
  });

  // An explicit report overrides the checklist-derived status.
  await db
    .update(activities)
    .set({ status: parsed.data.statusAtReport })
    .where(eq(activities.id, parsed.data.activityId));

  revalidatePath(`/o/activities/${parsed.data.activityId}`);
  revalidatePath("/o/activities");
  revalidatePath("/admin");

  return { ok: true, message: "Update posted." };
}
