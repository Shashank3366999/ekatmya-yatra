import type { Metadata } from "next";
import { Chip } from "@heroui/react";
import { Download, MapPinned } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { RecommendationChip, SurveyStatusChip } from "@/components/ui/status-chip";
import { formatNumber, formatRelative, humanise } from "@/lib/format";
import { listStates, listSurveys, surveyStatusCounts } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import type { SurveyStatus } from "@/lib/types";

import { SurveyFilters } from "./filters";

export const metadata: Metadata = { title: "Survey inbox" };

const STATUS_ORDER: SurveyStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "rejected",
  "draft",
];

/**
 * The admin's survey inbox — the screen the whole first release is for.
 * Filters live in the URL so a filtered view can be shared or bookmarked.
 */
export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    stateId?: string;
    category?: string;
    proposedFor?: string;
    q?: string;
  }>;
}) {
  const admin = await requireAdmin();
  const filters = await searchParams;

  const [surveys, states, counts] = await Promise.all([
    listSurveys(admin, filters, 300),
    listStates(),
    surveyStatusCounts(admin),
  ]);

  // Preserve the active filters on the export link.
  const exportQuery = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();

  return (
    <div className="space-y-5">
      <PageTitle
        title="Survey inbox"
        description="Places recorded by survey teams across Bharat, for route planning."
        action={
          <a
            href={`/api/surveys/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <Download size={15} aria-hidden="true" />
            Export CSV
          </a>
        }
      />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.filter((s) => counts.byStatus[s]).map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-surface px-2.5 py-1.5"
          >
            <SurveyStatusChip status={s} />
            <span className="text-sm font-semibold text-ink-900">
              {counts.byStatus[s]}
            </span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-surface px-2.5 py-1.5">
          <span className="text-xs text-ink-500">Total</span>
          <span className="text-sm font-semibold text-ink-900">{counts.total}</span>
        </span>
      </div>

      <SurveyFilters states={states} current={filters} />

      {surveys.length === 0 ? (
        <Empty
          icon={MapPinned}
          title="No survey entries match"
          description={
            counts.total === 0
              ? "Once survey teams start filing places, they land here immediately."
              : "Try clearing the filters above."
          }
        />
      ) : (
        <>
          {/* Table on wide screens */}
          <div className="hidden overflow-x-auto rounded-xl border border-ink-200 bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <Th>Reference</Th>
                  <Th>Place</Th>
                  <Th>Area</Th>
                  <Th>Type</Th>
                  <Th>For</Th>
                  <Th className="text-right">Gathering</Th>
                  <Th>Recommendation</Th>
                  <Th>Status</Th>
                  <Th>Filed</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {surveys.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50">
                    <Td>
                      <a
                        href={`/admin/surveys/${s.id}`}
                        className="font-medium text-pumpkin-700 underline"
                      >
                        {s.reference}
                      </a>
                    </Td>
                    <Td className="font-medium text-ink-900">{s.placeName}</Td>
                    <Td className="text-ink-500">
                      {[s.districtName, s.stateName].filter(Boolean).join(", ")}
                    </Td>
                    <Td className="text-ink-500">{humanise(s.category)}</Td>
                    <Td>
                      <Chip size="sm" variant="soft">
                        {s.proposedFor === "main" ? "Main" : "Sub"}
                      </Chip>
                    </Td>
                    <Td className="text-right text-ink-600">
                      {s.expectedGathering !== null
                        ? formatNumber(s.expectedGathering)
                        : "Not set"}
                    </Td>
                    <Td>
                      <RecommendationChip recommendation={s.recommendation} />
                    </Td>
                    <Td>
                      <SurveyStatusChip status={s.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-ink-500">
                      {formatRelative(s.submittedAt)}
                      <span className="block">{s.submittedByName ?? "Unknown"}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on narrow screens */}
          <ul className="space-y-2.5 lg:hidden">
            {surveys.map((s) => (
              <li key={s.id}>
                <a
                  href={`/admin/surveys/${s.id}`}
                  className="lift block rounded-xl border border-ink-200 bg-surface p-4 active:bg-ink-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {s.placeName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {s.reference} ·{" "}
                        {[s.districtName, s.stateName].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <SurveyStatusChip status={s.status} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <RecommendationChip recommendation={s.recommendation} />
                    <span className="text-[11px] text-ink-500">
                      {humanise(s.category)} · {formatRelative(s.submittedAt)}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-ink-500">
            Showing {surveys.length} of {counts.total} entries.
            {surveys.length === 300 ? " Refine the filters to see older entries." : ""}
          </p>
        </>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-3 align-middle ${className}`}>{children}</td>;
}
