"use server";

/** "My Journey" — the places a user intends to join the Yatra at. */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { journeyPlaces } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { journeyToggleSchema } from "@/lib/validation";

/** Add the place if absent, remove it if present. */
export async function toggleJourneyPlace(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = journeyToggleSchema.safeParse({ placeId: formData.get("placeId") });
  if (!parsed.success) return;

  const db = await getDb();
  const { placeId } = parsed.data;

  const [existing] = await db
    .select({ id: journeyPlaces.id })
    .from(journeyPlaces)
    .where(and(eq(journeyPlaces.userId, user.id), eq(journeyPlaces.placeId, placeId)))
    .limit(1);

  if (existing) {
    await db.delete(journeyPlaces).where(eq(journeyPlaces.id, existing.id));
  } else {
    await db.insert(journeyPlaces).values({ userId: user.id, placeId });
  }

  revalidatePath("/journey");
  revalidatePath("/yatra");
  revalidatePath("/home");
}
