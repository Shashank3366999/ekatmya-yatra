/**
 * Applies the generated SQL migrations to whichever database is configured.
 * Run with `pnpm db:migrate`.
 */
import { loadEnv } from "../lib/env";
import { assertDatabaseFree } from "./guard";

loadEnv();
assertDatabaseFree("db:migrate");

const MIGRATIONS_FOLDER = "./src/db/migrations";

async function main() {
  const { getDb, usingPglite } = await import("./index");
  const db = await getDb();

  if (usingPglite) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  } else {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  }

  console.log(
    `✔ migrations applied (${usingPglite ? "PGlite — ./.pglite" : "Postgres via DATABASE_URL"})`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ migration failed");
  console.error(err);
  process.exit(1);
});
