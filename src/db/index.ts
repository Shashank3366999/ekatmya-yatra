/**
 * Database connection.
 *
 * One schema, two drivers, chosen by whether DATABASE_URL is set:
 *
 *   DATABASE_URL empty  -> PGlite: real Postgres compiled to WASM, persisted to
 *                          ./.pglite. No server, no credentials, no Docker. This
 *                          is what makes `pnpm dev` work on a fresh clone.
 *   DATABASE_URL set    -> node-postgres against managed Postgres (staging/prod).
 *
 * Both are the postgresql dialect, so the Drizzle schema and the generated SQL
 * migrations are identical across environments. Moving to a hosted DB is a
 * one-line env change, not a rewrite.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

/**
 * Both drivers expose the same Drizzle query API, so we surface one type.
 * Typing this as a union instead would collapse Drizzle's method overloads
 * (`.returning({...})` and friends stop type-checking at every call site).
 */
export type Database = NodePgDatabase<typeof schema>;

/** Where PGlite keeps its data directory, relative to the project root. */
export const PGLITE_DIR = process.env.PGLITE_DIR ?? "./.pglite";

export const usingPglite = !process.env.DATABASE_URL;

/*
  On a deployed instance, PGlite is not a fallback, it is data loss.

  It writes to a directory inside the working tree: a deploy that replaces that
  directory, or an instance that is replaced, takes every registered account
  with it, silently, with the app still serving happily.

  Keyed on APP_ENV rather than NODE_ENV, which was the first attempt and was
  wrong: `next build` and `next start` both set NODE_ENV=production, so the
  check fired on a developer's own machine and broke the build. APP_ENV is set
  by the systemd unit and by nothing else, so it means "this is the real
  deployment" — see docs/DEPLOYMENT.md.
*/
if (usingPglite && process.env.APP_ENV === "production") {
  throw new Error(
    "DATABASE_URL is not set. In production the app must point at a real " +
      "Postgres: PGlite writes to ./.pglite on the instance and would lose " +
      "every account on the next deploy. Set DATABASE_URL and restart.",
  );
}

/**
 * Cached across hot reloads. Next.js re-evaluates modules on every edit in dev;
 * without this, each reload would open another PGlite instance on the same
 * directory and fail on the lock.
 */
const globalForDb = globalThis as unknown as {
  __yatraDb?: Promise<Database>;
};

async function createDb(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Managed Postgres providers terminate idle connections; keep the pool honest.
      idleTimeoutMillis: 30_000,
    });
    return drizzle(pool, { schema, casing: "snake_case" });
  }

  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const { claimDatabase } = await import("./guard");

  /*
    Announce that this process holds the database, so the CLI scripts refuse to
    write to it concurrently — PGlite is single-process and concurrent writes
    corrupt the data directory rather than failing cleanly.
  */
  claimDatabase(`${process.env.NODE_ENV ?? "node"} server`);

  const client = await PGlite.create({ dataDir: PGLITE_DIR });
  // Structurally identical query API; see the Database type note above.
  return drizzle(client, { schema, casing: "snake_case" }) as unknown as Database;
}

/** Get the shared database handle. Safe to call from any server context. */
export function getDb(): Promise<Database> {
  globalForDb.__yatraDb ??= createDb();
  return globalForDb.__yatraDb;
}

export { schema };
