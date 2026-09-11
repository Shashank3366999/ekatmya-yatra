"use server";

/**
 * Likes on announcements.
 *
 * The Yatra team wants the announcement feed to behave like a social handle —
 * a post arrives and people can like it — so this is a plain toggle any
 * signed-in user can call.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { announcementLikes } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { announcementLikeSchema } from "@/lib/validation";

export async function toggleAnnouncementLike(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = announcementLikeSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });
  if (!parsed.success) return;

  const db = await getDb();
  const { announcementId } = parsed.data;

  const [existing] = await db
    .select({ id: announcementLikes.id })
    .from(announcementLikes)
    .where(
      and(
        eq(announcementLikes.announcementId, announcementId),
        eq(announcementLikes.userId, user.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(announcementLikes).where(eq(announcementLikes.id, existing.id));
  } else {
    // The unique index makes a double-submit harmless.
    await db
      .insert(announcementLikes)
      .values({ announcementId, userId: user.id })
      .onConflictDoNothing();
  }

  revalidatePath("/announcements");
  revalidatePath("/home");
  revalidatePath("/o");
}
