import type { Metadata } from "next";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { formatRelative } from "@/lib/format";
import { ACTIVITY_STATUS_LABELS } from "@/lib/labels";
import { FUNCTION_LABELS, TEAM_LABELS } from "@/lib/permissions";
import { listFieldReports } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "Field Reports" };

/** Status colour, matching the chips used elsewhere in the panel. */
const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-ink-100 text-ink-600",
  in_progress: "bg-gold/15 text-gold-ink",
  done: "bg-pumpkin-50 text-pumpkin-700",
  blocked: "bg-danger/10 text-danger",
};

/**
 * What organisers have reported doing, newest first.
 *
 * The Yatra team asked to be able to track activity and not only approvals:
 * people report what they are doing during the survey and the journey, and
 * those reports are records the panel can read. Scoped, so a state admin sees
 * their own state.
 */
export default async function AdminFieldReportsPage() {
  const admin = await requireAdmin();
  const reports = await listFieldReports(admin);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Field Reports"
        description="What the organising team has reported doing, newest first. Each one is filed against the task it belongs to."
      />

      {reports.length === 0 ? (
        <Empty
          icon={FileText}
          title="No reports yet"
          description="When an organiser files an update against one of their tasks, it appears here with its status."
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const where = [r.districtName, r.stateName].filter(Boolean).join(", ");

            return (
              <li
                key={r.id}
                className="rounded-xl border border-ink-200 bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{r.activityTitle}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {r.authorName ?? "Unknown"} · {TEAM_LABELS[r.level]}
                      {where ? ` · ${where}` : ""} ·{" "}
                      {FUNCTION_LABELS[r.functionArea]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_STYLE[r.status] ?? "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {ACTIVITY_STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs whitespace-nowrap text-ink-500">
                      {formatRelative(r.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-ink-700">
                  {r.body}
                </p>

                {r.peopleMet ? (
                  <p className="mt-2 text-xs text-ink-500">
                    <span className="font-medium text-ink-600">Met:</span>{" "}
                    {r.peopleMet}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
