/**
 * Dev helper: print a session cookie value for a seeded user.
 * Used to smoke-test role-scoped pages without driving a browser.
 * Run: pnpm exec tsx src/db/mint-session.ts <email> [...]
 */
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";

import { loadEnv } from "../lib/env";

loadEnv();

async function main() {
  const { getDb } = await import("./index");
  const s = await import("./schema");
  const db = await getDb();

  for (const email of process.argv.slice(2)) {
    const [u] = await db
      .select({ id: s.users.id, type: s.users.accountType })
      .from(s.users)
      .where(eq(s.users.email, email.toLowerCase()))
      .limit(1);

    if (!u) {
      console.log(`${email}\tNOT_FOUND\t-`);
      continue;
    }

    const token = await new SignJWT({ sub: u.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));

    console.log(`${email}\t${u.type}\t${token}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
