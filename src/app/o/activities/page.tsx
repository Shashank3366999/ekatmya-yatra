import type { Metadata } from "next";
import { Chip } from "@heroui/react";
import { ListChecks } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate, humanise } from "@/lib/format";
import { FUNCTION_LABELS } from "@/lib/permissions";
import { listActivitiesForUser } from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = { title: "Checklists" };

export default async function ActivitiesPage() {
  const user = await requireOrganizer();
  const activities = await listActivitiesForUser(user, 100);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Checklists"
        description="Work assigned to you and to your team's area."
      />

      {activities.length === 0 ? (
        <Empty
          icon={ListChecks}
          title="No checklists yet"
          description="The Yatra team assigns activities and checklists from the admin panel. Anything for your role and area will appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {activities.map((a) => {
            const pct = a.total ? Math.round((a.done / a.total) * 100) : 0;
            return (
              <li key={a.id}>
                <a
                  href={`/o/activities/${a.id}`}
                  className="lift block h-full rounded-xl border border-ink-200 bg-surface p-4 active:bg-ink-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {FUNCTION_LABELS[a.functionArea]}
                        {a.stateName ? ` · ${a.districtName ?? a.stateName}` : " · All India"}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={
                        a.status === "completed"
                          ? "success"
                          : a.status === "blocked"
                            ? "danger"
                            : a.status === "in_progress"
                              ? "accent"
                              : "default"
                      }
                    >
                      {humanise(a.status)}
                    </Chip>
                  </div>

                  {a.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">
                      {a.description}
                    </p>
                  ) : null}

                  {a.total ? (
                    <>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200">
                        <div
                          className="h-full rounded-full bg-pumpkin-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-ink-500">
                        {a.done} of {a.total} complete
                        {a.dueDate ? ` · due ${formatDate(a.dueDate)}` : ""}
                      </p>
                    </>
                  ) : a.dueDate ? (
                    <p className="mt-2 text-[11px] text-ink-500">
                      Due {formatDate(a.dueDate)}
                    </p>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
