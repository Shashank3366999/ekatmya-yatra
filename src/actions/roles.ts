"use server";

/**
 * Server Actions for the predefined roles an admin offers to joiners.
 *
 * These are the "1-2 pre-made checklists/roles" the Yatra team wants the panel
 * to hold before anyone signs up. Editing one never touches people already
 * approved under it: their checklist was copied onto their own activity at
 * approval time.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { auditLog, roleTemplateItems, roleTemplates } from "@/db/schema";
import { functionEnum, orgLevelEnum, postingKindEnum } from "@/db/schema";
import { isAdmin } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

const roleSchema = z.object({
  name: z.string().trim().min(3, "Give the role a name").max(120),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  postingKind: z.enum(postingKindEnum.enumValues),
  level: z.enum(orgLevelEnum.enumValues),
  functionArea: z.enum(functionEnum.enumValues),
  /** One checklist item per line, which is how an admin thinks about it. */
  checklist: z.string().max(4000).optional().or(z.literal("")),
});

function lines(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export async function saveRoleTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !isAdmin(admin)) return { ok: false, error: "Not allowed." };

  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    postingKind: formData.get("postingKind"),
    level: formData.get("level"),
    functionArea: formData.get("functionArea"),
    checklist: formData.get("checklist"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const data = parsed.data;
  const db = await getDb();
  const items = lines(data.checklist);
  const templateId = (formData.get("templateId") as string | null) || null;

  if (templateId) {
    await db
      .update(roleTemplates)
      .set({
        name: data.name,
        description: data.description || null,
        postingKind: data.postingKind,
        level: data.level,
        functionArea: data.functionArea,
      })
      .where(eq(roleTemplates.id, templateId));

    /*
      Replace the checklist wholesale. It is a template, not live work: the
      people already approved under it hold their own copy, so nothing anyone
      is part-way through is affected.
    */
    await db.delete(roleTemplateItems).where(eq(roleTemplateItems.templateId, templateId));
    if (items.length > 0) {
      await db.insert(roleTemplateItems).values(
        items.map((label, i) => ({ templateId, label, position: i })),
      );
    }
  } else {
    const [created] = await db
      .insert(roleTemplates)
      .values({
        name: data.name,
        description: data.description || null,
        postingKind: data.postingKind,
        level: data.level,
        functionArea: data.functionArea,
        createdById: admin.id,
        position: 50,
      })
      .returning({ id: roleTemplates.id });

    if (items.length > 0) {
      await db.insert(roleTemplateItems).values(
        items.map((label, i) => ({ templateId: created.id, label, position: i })),
      );
    }
  }

  await db.insert(auditLog).values({
    actorId: admin.id,
    action: templateId ? "role_template.update" : "role_template.create",
    entityType: "role_template",
    entityId: templateId ?? undefined,
    detail: { name: data.name, items: items.length },
  });

  revalidatePath("/admin/roles");
  revalidatePath("/register/organizer");

  return {
    ok: true,
    message: templateId
      ? `Saved. "${data.name}" now carries ${items.length} checklist ${items.length === 1 ? "point" : "points"}.`
      : `Added. "${data.name}" is now offered on the signup form.`,
  };
}

/** Hide a role from the signup form without losing it or anyone's history. */
export async function toggleRoleTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !isAdmin(admin)) return { ok: false, error: "Not allowed." };

  const templateId = formData.get("templateId") as string | null;
  if (!templateId) return { ok: false, error: "Which role?" };

  const [row] = await db_isActive(templateId);
  if (!row) return { ok: false, error: "That role no longer exists." };

  const db = await getDb();
  await db
    .update(roleTemplates)
    .set({ isActive: !row.isActive })
    .where(eq(roleTemplates.id, templateId));

  await db.insert(auditLog).values({
    actorId: admin.id,
    action: row.isActive ? "role_template.hide" : "role_template.show",
    entityType: "role_template",
    entityId: templateId,
    detail: {},
  });

  revalidatePath("/admin/roles");
  revalidatePath("/register/organizer");

  return {
    ok: true,
    message: row.isActive
      ? "Hidden. It no longer appears on the signup form."
      : "Showing again on the signup form.",
  };
}

async function db_isActive(templateId: string) {
  const db = await getDb();
  return db
    .select({ isActive: roleTemplates.isActive })
    .from(roleTemplates)
    .where(eq(roleTemplates.id, templateId))
    .limit(1);
}
