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
import { assertDatabaseFree } from "./guard";

loadEnv();
assertDatabaseFree("db:reset-demo");

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
    console.log(`• ${DEMO_PENDING_ORGANIZER} not found. Run pnpm db:seed first.`);
    process.exit(0);
  }

  /*
    Restore the whole posting, not just the status. The admin can now move a
    person's team and role, so a test run leaves the fixture in a different
    chapter on a different role — resetting only the status would hand the next
    run a subtly different starting point.
  */
  const [mp] = await db
    .select({ id: s.states.id })
    .from(s.states)
    .where(eq(s.states.code, "MP"))
    .limit(1);

  const result = await db
    .update(s.organizerProfiles)
    .set({
      status: "pending",
      reviewNote: null,
      reviewedById: null,
      reviewedAt: null,
      level: "state",
      stateId: mp?.id ?? null,
      districtId: null,
      primaryFunction: "media_pr",
      additionalFunctions: ["social_media"],
      designation: "State Media Coordinator",
      isSpiritualRepresentative: false,
    })
    .where(eq(s.organizerProfiles.userId, user.id))
    .returning({ id: s.organizerProfiles.id });

  console.log(
    result.length
      ? `✔ ${user.name} reset: pending, State team (Madhya Pradesh), Media & PR.`
      : `• ${user.name} has no organiser posting to reset.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ reset-demo failed");
  console.error(err);
  process.exit(1);
});
