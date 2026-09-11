/**
 * Grant or change an account's access level from the command line.
 *
 * This exists because the first admin cannot be made through the UI: only a
 * super admin may grant admin access, so a fresh deployment has no way to
 * bootstrap one beyond the seeded account. It is also the safe way to hand
 * someone admin rights without sharing the seeded credentials.
 *
 *   pnpm db:promote <email> [user|organizer|admin|super_admin]
 *
 * Defaults to `admin`. Stop the dev server first — the local PGlite database
 * is single-process.
 */
import { eq } from "drizzle-orm";

import { loadEnv } from "../lib/env";

loadEnv();

const ROLES = ["user", "organizer", "admin", "super_admin"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [emailArg, roleArg = "admin"] = process.argv.slice(2);

  if (!emailArg) {
    console.error("Usage: pnpm db:promote <email> [user|organizer|admin|super_admin]");
    process.exit(1);
  }

  if (!ROLES.includes(roleArg as Role)) {
    console.error(`✖ "${roleArg}" is not a role. Choose one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const role = roleArg as Role;

  const { getDb } = await import("./index");
  const s = await import("./schema");
  const db = await getDb();

  const [account] = await db
    .select({
      id: s.users.id,
      email: s.users.email,
      fullName: s.users.fullName,
      accountType: s.users.accountType,
      isActive: s.users.isActive,
    })
    .from(s.users)
    .where(eq(s.users.email, email))
    .limit(1);

  if (!account) {
    console.error(`✖ No account found for ${email}`);
    const all = await db.select({ email: s.users.email }).from(s.users);
    console.error(`  Registered accounts:\n${all.map((a) => `    ${a.email}`).join("\n")}`);
    process.exit(1);
  }

  if (account.accountType === role) {
    console.log(`• ${account.email} is already ${role}. Nothing to change.`);
    process.exit(0);
  }

  await db.update(s.users).set({ accountType: role }).where(eq(s.users.id, account.id));

  // Same trail the admin UI writes, so the change is not invisible later.
  await db.insert(s.auditLog).values({
    actorId: account.id,
    action: "user.access_update",
    entityType: "user",
    entityId: account.id,
    detail: { from: account.accountType, to: role, via: "db:promote" },
  });

  console.log(`✔ ${account.fullName} <${account.email}>`);
  console.log(`  ${account.accountType} → ${role}`);

  if (!account.isActive) {
    console.log("  ⚠ this account is deactivated — it cannot sign in until reactivated");
  }
  if (role === "admin") {
    console.log("  Signs in to /admin. Only a super_admin can grant admin access to others.");
  }
  if (role === "super_admin") {
    console.log("  Signs in to /admin with full access, including granting admin rights.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("✖ promote failed");
  console.error(err);
  process.exit(1);
});
