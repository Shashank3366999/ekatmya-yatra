import type { Metadata } from "next";
import { Card, Chip } from "@heroui/react";
import { ClipboardList, FileText, ListChecks, MapPinned, Plus } from "lucide-react";

import { AccentRule } from "@/components/brand";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { StatCard } from "@/components/ui/stat-card";
import { SurveyStatusChip } from "@/components/ui/status-chip";
import { formatRelative } from "@/lib/format";
import { FUNCTION_LABELS, canSubmitSurvey, scopeLabel, resolveScope } from "@/lib/permissions";
import {
  listActivitiesForUser,
  listAnnouncementsFor,
  listOwnSurveys,
  surveyStatusCounts,
} from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = { title: "Organiser dashboard" };

export default async function OrganizerDashboard() {
  const user = await requireOrganizer();

  const [counts, ownSurveys, activities, announcements] = await Promise.all([
    surveyStatusCounts(user),
    listOwnSurveys(user.id, 5),
    listActivitiesForUser(user, 5),
    listAnnouncementsFor(user, 3),
  ]);

  const scope = resolveScope(user);
  const area = scopeLabel(scope, {
    state: user.organizer?.stateName ?? undefined,
    district: user.organizer?.districtName ?? undefined,
  });

  const checklistTotal = activities.reduce((sum, a) => sum + a.total, 0);
  const checklistDone = activities.reduce((sum, a) => sum + a.done, 0);
  const maySurvey = canSubmitSurvey(user);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Greeting */}
      <section>
        <p className="text-sm text-ink-500">Namaste,</p>
        <h1 className="font-display text-2xl text-ink-900">{user.fullName}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {user.organizer ? (
            <>
              <Chip size="sm" variant="soft" color="accent">
                {FUNCTION_LABELS[user.organizer.primaryFunction]}
              </Chip>
              {user.organizer.additionalFunctions.map((f) => (
                <Chip key={f} size="sm" variant="soft">
                  {FUNCTION_LABELS[f]}
                </Chip>
              ))}
            </>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-ink-500">Working area: {area}</p>
      </section>

      <AccentRule />

      {/* Numbers */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          label="Surveys in view"
          value={counts.total}
          hint={`${counts.byStatus.submitted ?? 0} awaiting review`}
          icon={MapPinned}
          tone="accent"
        />
        <StatCard
          label="Checklist progress"
          value={checklistTotal ? `${checklistDone}/${checklistTotal}` : "None yet"}
          hint={`${activities.length} active ${activities.length === 1 ? "task" : "tasks"}`}
          icon={ListChecks}
          tone="success"
        />
      </section>

      {/* Primary action */}
      {maySurvey ? (
        <Card variant="secondary">
          {/* Card.Content is flex-column by default, so the row direction is explicit. */}
          <Card.Content className="flex flex-row items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pumpkin-500 text-ink-0">
              <Plus size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">Add a survey entry</p>
              <p className="text-xs leading-relaxed text-ink-500">
                Record a place the Yatra should consider visiting.
              </p>
            </div>
            <LinkButton href="/o/survey/new" size="sm">
              Start
            </LinkButton>
          </Card.Content>
        </Card>
      ) : null}

      <div className="space-y-6">
      {/* Recent surveys */}
      <section>
        <div className="mb-2.5 flex items-end justify-between">
          <h2 className="font-display text-lg text-ink-900">My recent surveys</h2>
          <LinkButton href="/o/survey" variant="ghost" size="sm">
            View all
          </LinkButton>
        </div>

        {ownSurveys.length === 0 ? (
          <Empty
            icon={MapPinned}
            title="No survey entries yet"
            description={
              maySurvey
                ? "Your first entry will appear here and go straight to the Yatra administration."
                : "Your approved role does not include survey work."
            }
            action={maySurvey ? <LinkButton href="/o/survey/new" size="sm">Add the first one</LinkButton> : undefined}
          />
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
            {ownSurveys.map((s) => (
              <li key={s.id}>
                <a href={`/o/survey/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 active:bg-ink-100">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{s.placeName}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {[s.districtName, s.stateName].filter(Boolean).join(", ")} ·{" "}
                      {formatRelative(s.submittedAt)}
                    </p>
                  </div>
                  <SurveyStatusChip status={s.status} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Checklists */}
      <section>
        <div className="mb-2.5 flex items-end justify-between">
          <h2 className="font-display text-lg text-ink-900">My checklists</h2>
          <LinkButton href="/o/activities" variant="ghost" size="sm">
            View all
          </LinkButton>
        </div>

        {activities.length === 0 ? (
          <Empty
            icon={ListChecks}
            title="Nothing assigned yet"
            description="Tasks and checklists assigned by the Yatra team will appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {activities.map((a) => {
              const pct = a.total ? Math.round((a.done / a.total) * 100) : 0;
              return (
                <li key={a.id}>
                  <a
                    href={`/o/activities/${a.id}`}
                    className="lift block rounded-xl border border-ink-200 bg-surface p-3.5 active:bg-ink-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{a.title}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {FUNCTION_LABELS[a.functionArea]}
                          {a.total ? ` · ${a.done}/${a.total} done` : ""}
                        </p>
                      </div>
                      <Chip size="sm" variant="soft">
                        {pct}%
                      </Chip>
                    </div>
                    {a.total ? (
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-200">
                        <div
                          className="h-full rounded-full bg-pumpkin-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      </div>

      {/* Announcements */}
      {announcements.length > 0 ? (
        <section>
          <h2 className="mb-2.5 font-display text-lg text-ink-900">Latest updates</h2>
          <ul className="space-y-2.5">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-xl border border-ink-200 bg-surface p-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-pumpkin-50 text-pumpkin-700">
                    <FileText size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                      {a.body}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-400">
                      {formatRelative(a.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Profile shortcut */}
      <LinkButton href="/o/profile" variant="secondary" fullWidth className="lg:hidden">
        <ClipboardList size={16} aria-hidden="true" />
        My role & permissions
      </LinkButton>
    </div>
  );
}
