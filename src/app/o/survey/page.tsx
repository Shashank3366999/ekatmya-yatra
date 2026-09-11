import type { Metadata } from "next";
import { Tabs } from "@heroui/react";
import { MapPinned, Plus } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { PageTitle } from "@/components/ui/page-title";
import { RecommendationChip, SurveyStatusChip } from "@/components/ui/status-chip";
import { formatRelative, humanise } from "@/lib/format";
import { canSubmitSurvey, resolveScope, scopeLabel } from "@/lib/permissions";
import { listOwnSurveys, listSurveys } from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = { title: "Survey" };

/**
 * Two views: what I filed, and everything in my scope. A district surveyor sees
 * their district; a state lead sees the whole state — driven by scopeFilter.
 */
export default async function SurveyListPage() {
  const user = await requireOrganizer();

  const [mine, inScope] = await Promise.all([
    listOwnSurveys(user.id, 100),
    listSurveys(user, {}, 100),
  ]);

  const area = scopeLabel(resolveScope(user), {
    state: user.organizer?.stateName ?? undefined,
    district: user.organizer?.districtName ?? undefined,
  });

  return (
    <div className="space-y-5">
      <PageTitle
        title="Survey"
        description="Places recorded for the Yatra route."
        action={
          canSubmitSurvey(user) ? (
            <LinkButton href="/o/survey/new" size="sm">
              <Plus size={15} aria-hidden="true" />
              Add
            </LinkButton>
          ) : undefined
        }
      />

      <Tabs defaultSelectedKey="mine">
        <Tabs.List>
          <Tabs.Tab id="mine">Mine ({mine.length})</Tabs.Tab>
          <Tabs.Tab id="scope">{area} ({inScope.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="mine" className="pt-4">
          {mine.length === 0 ? (
            <Empty
              icon={MapPinned}
              title="You have not filed a survey yet"
              description="Record a place the Yatra should consider, and it goes straight to the administration team."
              action={
                canSubmitSurvey(user) ? (
                  <LinkButton href="/o/survey/new" size="sm">
                    Add a survey entry
                  </LinkButton>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {mine.map((s) => (
                <li key={s.id}>
                  <a
                    href={`/o/survey/${s.id}`}
                    className="lift block rounded-xl border border-ink-200 bg-surface p-3.5 active:bg-ink-50"
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
                      <span className="text-[11px] text-ink-400">
                        {humanise(s.category)} · {formatRelative(s.submittedAt)}
                      </span>
                    </div>
                    {s.adminNote ? (
                      <p className="mt-2.5 rounded-lg bg-ink-50 px-2.5 py-2 text-xs leading-relaxed text-ink-600">
                        <span className="font-medium">Note from the team:</span>{" "}
                        {s.adminNote}
                      </p>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="scope" className="pt-4">
          {inScope.length === 0 ? (
            <Empty
              icon={MapPinned}
              title={`No surveys in ${area} yet`}
              description="Entries filed by anyone in your area will appear here."
            />
          ) : (
            <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
              {inScope.map((s) => (
                <li key={s.id}>
                  <a
                    href={`/o/survey/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 active:bg-ink-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {s.placeName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {[s.districtName, s.stateName].filter(Boolean).join(", ")} ·{" "}
                        {s.submittedByName ?? "Unknown"}
                      </p>
                    </div>
                    <SurveyStatusChip status={s.status} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
