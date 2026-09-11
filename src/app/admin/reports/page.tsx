import type { Metadata } from "next";

import { AccentRule } from "@/components/brand";
import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { formatNumber } from "@/lib/format";
import { SURVEY_STATUS_COLOR, SURVEY_STATUS_LABELS } from "@/lib/labels";
import { adminOverview, surveyStatusCounts, surveysByState } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import type { SurveyStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Reports" };

const STATUS_ORDER: SurveyStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "rejected",
  "draft",
];

/** Chip colour -> CSS variable, so the bars match the status chips. */
const BAR_COLOR: Record<string, string> = {
  default: "var(--color-ink-300)",
  accent: "var(--color-pumpkin-600)",
  success: "var(--color-pumpkin-500)",
  warning: "var(--color-pumpkin-500)",
  danger: "var(--danger)",
};

export default async function AdminReportsPage() {
  const admin = await requireAdmin();

  const [counts, byState, overview] = await Promise.all([
    surveyStatusCounts(admin),
    surveysByState(admin, 15),
    adminOverview(),
  ]);

  const maxState = Math.max(1, ...byState.map((s) => Number(s.n)));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Reports"
        description="Survey progress across Bharat. More reports arrive with the activity and event modules."
      />

      {counts.total === 0 ? (
        <Empty
          title="No data to report yet"
          description="Reports populate as survey teams file entries and organisers complete checklists."
        />
      ) : (
        <>
          {/* Survey pipeline */}
          <section>
            <h2 className="mb-3 font-display text-lg text-ink-900">
              Survey pipeline
            </h2>
            <div className="rounded-xl border border-ink-200 bg-surface p-4">
              {/* Single stacked bar of the whole pipeline */}
              <div
                className="flex h-3 overflow-hidden rounded-full bg-ink-100"
                role="img"
                aria-label={`Survey pipeline across ${counts.total} entries`}
              >
                {STATUS_ORDER.filter((s) => counts.byStatus[s]).map((s) => (
                  <div
                    key={s}
                    style={{
                      width: `${((counts.byStatus[s] ?? 0) / counts.total) * 100}%`,
                      backgroundColor: BAR_COLOR[SURVEY_STATUS_COLOR[s]],
                    }}
                    title={`${SURVEY_STATUS_LABELS[s]}: ${counts.byStatus[s]}`}
                  />
                ))}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                {STATUS_ORDER.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BAR_COLOR[SURVEY_STATUS_COLOR[s]] }}
                      aria-hidden="true"
                    />
                    <dt className="min-w-0 flex-1 truncate text-xs text-ink-500">
                      {SURVEY_STATUS_LABELS[s]}
                    </dt>
                    <dd className="text-sm font-semibold text-ink-900">
                      {counts.byStatus[s] ?? 0}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* By state */}
          <section>
            <h2 className="mb-3 font-display text-lg text-ink-900">
              Submissions by state
            </h2>
            <div className="rounded-xl border border-ink-200 bg-surface p-4">
              <ul className="space-y-2.5">
                {byState.map((row) => {
                  const n = Number(row.n);
                  return (
                    <li key={row.stateName ?? "unknown"} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs text-ink-600 sm:w-44">
                        {row.stateName ?? "Unspecified"}
                      </span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-ink-100">
                        <div
                          className="h-full rounded bg-pumpkin-600"
                          style={{ width: `${(n / maxState) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm font-semibold text-ink-900">
                        {n}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </>
      )}

      <AccentRule />

      {/* Platform totals */}
      <section>
        <h2 className="mb-3 font-display text-lg text-ink-900">Platform</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Registered users", overview.users],
            ["Approved organisers", overview.organizers],
            ["Awaiting approval", overview.pendingOrganizers],
            ["Survey entries", overview.surveys],
            ["Route stops", overview.routeStops],
            ["Awaiting sequencing", overview.routeUnsequenced],
            ["Upcoming events", overview.upcomingEvents],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-ink-200 bg-surface p-3.5"
            >
              <dt className="text-[11px] tracking-wide text-ink-500 uppercase">
                {label}
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums leading-none text-ink-900">
                {formatNumber(Number(value))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
