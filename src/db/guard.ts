/**
 * Stops two processes writing the local PGlite database at once.
 *
 * PGlite is single-process. Running `db:seed`, `db:promote` or `db:reset-demo`
 * while `next dev`/`next start` is up does not fail cleanly — it corrupts the
 * data directory, and the next open aborts inside the WASM runtime with
 * "RuntimeError: Aborted()", which says nothing about the cause. That cost a
 * database during development, so the two sides now coordinate through a lock.
 *
 * Why a lock file rather than inspecting open file handles: PGlite buffers and
 * syncs, so it keeps no persistent descriptor into the data directory. Scanning
 * /proc finds nothing even while the app is very much using it — which is the
 * same reason concurrent writes corrupt it.
 *
 * A lock left behind by a killed process is detected as stale (its PID is no
 * longer alive) and ignored, so a hard kill never wedges the project.
 *
 * Only applies to PGlite: with DATABASE_URL set, Postgres handles concurrency.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const LOCK_NAME = ".holder";

function lockPath(): string {
  return join(process.env.PGLITE_DIR ?? "./.pglite", LOCK_NAME);
}

function usingPglite(): boolean {
  return !process.env.DATABASE_URL;
}

function alive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0); // signal 0 only tests for existence
    return true;
  } catch (err) {
    // EPERM means it exists but belongs to someone else — still alive.
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

type Lock = { pid: number; what: string; since: string };

function readLock(): Lock | null {
  try {
    const raw = JSON.parse(readFileSync(lockPath(), "utf8")) as Lock;
    return typeof raw?.pid === "number" ? raw : null;
  } catch {
    return null; // absent or unreadable — treat as free
  }
}

/**
 * Claim the database for this process. Called when the app opens PGlite.
 * Best-effort: a failure to write the lock must never stop the app booting.
 */
export function claimDatabase(what: string): void {
  if (!usingPglite()) return;

  /*
    Refuse to open a data directory another live process already holds.
    
    Writing the claim was never enough: two servers could each write it and
    both open PGlite, and that is what corrupts the directory beyond its own
    recovery — it aborts on open afterwards, with every row gone. It has cost
    this project its local database twice, once through `db:reset-demo` racing
    the dev server (which is why `assertDatabaseFree` exists) and once through a
    second `next start` while the first was still up, which the claim alone did
    nothing to stop.

    So the claim now blocks. PGLITE_ALLOW_CONCURRENT=1 still overrides it for
    anyone who means it.
  */
  if (process.env.PGLITE_ALLOW_CONCURRENT !== "1") {
    const held = readLock();
    if (held && held.pid !== process.pid && alive(held.pid)) {
      const message =
        `The local PGlite database at ./.pglite is already open by PID ${held.pid} ` +
        `(${held.what}, since ${held.since}). Opening it twice corrupts it. ` +
        `Stop that process first, or set PGLITE_ALLOW_CONCURRENT=1 if you are sure.`;
      console.error(`✖ ${what}: ${message}`);
      throw new Error(message);
    }
  }

  try {
    mkdirSync(dirname(lockPath()), { recursive: true });
    writeFileSync(
      lockPath(),
      JSON.stringify({ pid: process.pid, what, since: new Date().toISOString() }),
    );

    const release = () => {
      try {
        const held = readLock();
        // Only clear our own claim, never someone else's.
        if (held?.pid === process.pid) rmSync(lockPath(), { force: true });
      } catch {
        /* nothing useful to do while exiting */
      }
    };

    process.once("exit", release);
    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
      process.once(sig, () => {
        release();
        process.exit(0);
      });
    }
  } catch {
    /* a missing lock is a smaller problem than refusing to start */
  }
}

/**
 * Exits with a clear message if another live process holds the database.
 * Call at the start of any script that writes to it.
 */
export function assertDatabaseFree(scriptName: string): void {
  if (!usingPglite()) return;
  if (process.env.PGLITE_ALLOW_CONCURRENT === "1") return; // deliberate override

  const held = readLock();
  if (!held || held.pid === process.pid || !alive(held.pid)) return;

  console.error(`✖ ${scriptName}: the local database is in use.`);
  console.error("");
  console.error(`  held by PID ${held.pid} (${held.what}), since ${held.since}`);
  console.error("");
  console.error("  PGlite is single-process. Writing to it while the app is");
  console.error("  running corrupts the data directory. The next open then");
  console.error('  aborts with "RuntimeError: Aborted()" and the data is lost.');
  console.error("");
  console.error("  Stop the dev/prod server, then run this again.");
  process.exit(1);
}
