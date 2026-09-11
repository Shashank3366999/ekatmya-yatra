/**
 * Resets only the demo fixtures the end-to-end suite consumes, leaving real
 * accounts and real data alone.
 *
 * `pnpm db:reset` wipes everything — including anyone who has registered — so it
 * is the wrong tool once a database has real users in it. The e2e suite needs
 * the demo organiser back in "pending" so the approval flow has something to
 * approve; this puts it back and nothing else.
 *
 *   pnpm db:reset-demo
 *
 * Stop the dev server first: the local PGlite database is single-process.
 */
import { eq } from "drizzle-orm";

import { loadEnv } from "../lib/env";

loadEnv();

const DEMO_PENDING_ORGANIZER = "media.mp@ekatmadham.com";

async function main() {
  const { getDb } = await import("./index");
  const s = await import("./schema");
  const db = await getDb();

  const [user] = await db
    .select({ id: s.users.id, name: s.users.fullName })
    .from(s.users)
    .where(eq(s.users.email, DEMO_PENDING_ORGANIZER))
    .limit(1);

  if (!user) {
    console.log(`• ${DEMO_PENDING_ORGANIZER} not found — run pnpm db:seed first.`);
    process.exit(0);
  }

  const result = await db
    .update(s.organizerProfiles)
    .set({ status: "pending", reviewNote: null, reviewedById: null, reviewedAt: null })
    .where(eq(s.organizerProfiles.userId, user.id))
    .returning({ id: s.organizerProfiles.id });

  console.log(
    result.length
      ? `✔ ${user.name} reset to pending — the approval flow has something to approve again.`
      : `• ${user.name} has no organiser posting to reset.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ reset-demo failed");
  console.error(err);
  process.exit(1);
});
