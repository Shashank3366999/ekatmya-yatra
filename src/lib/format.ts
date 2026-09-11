/** Presentation helpers. All dates render in IST — the Yatra's own timezone. */

const IST = "Asia/Kolkata";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
}

export function formatDateShort(value: Date | string | null | undefined): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: IST,
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST,
  });
}

/** "2 hours ago" — used in activity feeds. */
export function formatRelative(value: Date | string | null | undefined): string {
  if (!value) return "Not set";
  const then = new Date(value).getTime();
  const diff = Date.now() - then;

  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

/** Indian digit grouping: 1,24,800. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not set";
  return value.toLocaleString("en-IN");
}

/** Turn an enum value into a readable label: "advaita_heritage" -> "Advaita Heritage". */
export function humanise(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}
