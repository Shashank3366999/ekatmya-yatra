import type { LucideIcon } from "lucide-react";

import { formatNumber } from "@/lib/format";

/** Compact metric tile used on the dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "warning" | "success";
}) {
  const tones = {
    default: "text-ink-600 bg-ink-100",
    accent: "text-pumpkin-500 bg-pumpkin-50",
    warning: "text-pumpkin-700 bg-pumpkin-50",
    success: "text-pumpkin-600 bg-pumpkin-50",
  } as const;

  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] leading-tight font-medium tracking-wide text-ink-500 uppercase">
          {label}
        </p>
        {Icon ? (
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon size={14} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {/* Sans + tabular figures, so columns of numbers line up rather than
          shifting as the digits change. */}
      <p className="mt-2 text-2xl font-semibold tabular-nums leading-none text-ink-900">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] text-ink-500">{hint}</p> : null}
    </div>
  );
}
