/**
 * Minimal .env.local loader for standalone scripts (migrate/seed).
 *
 * Next.js loads .env.local automatically for the app itself; these scripts run
 * under plain tsx, which does not. A ~20 line reader beats adding a dependency
 * for a lightweight project.
 */
import { existsSync, readFileSync } from "node:fs";

export function loadEnv(file = ".env.local"): void {
  if (!existsSync(file)) return;

  for (const rawLine of readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (key in process.env) continue; // real env always wins

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
