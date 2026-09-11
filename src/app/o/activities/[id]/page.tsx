import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chip } from "@heroui/react";

import { toggleChecklistItem } from "@/actions/activity";
import { AccentRule } from "@/components/brand";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate, humanise } from "@/lib/format";
import { FUNCTION_LABELS, LEVEL_LABELS } from "@/lib/permissions";
import { getActivity } from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOrganizer();

  const data = await getActivity(id);
  if (!data) notFound();

  const { activity, checklist } = data;
  const done = checklist.filter((c) => c.isDone).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageTitle title="Activity" backHref="/o/activities" />

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft" color="accent">
            {FUNCTION_LABELS[activity.functionArea]}
          </Chip>
          <Chip size="sm" variant="soft">
            {LEVEL_LABELS[activity.level]}
          </Chip>
          <Chip
            size="sm"
            variant="soft"
            color={
              activity.status === "completed"
                ? "success"
                : activity.status === "blocked"
                  ? "danger"
                  : "default"
            }
          >
            {humanise(activity.status)}
          </Chip>
        </div>

        <h1 className="mt-3 font-display text-xl leading-tight text-ink-900">
          {activity.title}
        </h1>

        {activity.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {activity.description}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-ink-500">
          {activity.districtName ?? activity.stateName ?? "All India"}
          {activity.dueDate ? ` · due ${formatDate(activity.dueDate)}` : ""}
        </p>
      </section>

      <AccentRule />

      {/* Checklist */}
      <section>
        <div className="mb-2.5 flex items-end justify-between">
          <h2 className="font-display text-lg text-ink-900">Checklist</h2>
          {checklist.length ? (
            <span className="text-xs text-ink-500">
              {done} of {checklist.length} · {pct}%
            </span>
          ) : null}
        </div>

        {checklist.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-500">
            No checklist items on this activity.
          </p>
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
            {checklist.map((item) => (
              <li key={item.id}>
                {/*
                  A plain form per item: it works without JavaScript and needs no
                  client component, which suits patchy field connectivity.
                */}
                <form action={toggleChecklistItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="isDone" value={String(!item.isDone)} />
                  <button
                    type="submit"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-50"
                    aria-pressed={item.isDone}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                        item.isDone
                          ? "border-pumpkin-500 bg-pumpkin-500 text-ink-900"
                          : "border-ink-300 bg-surface"
                      }`}
                      aria-hidden="true"
                    >
                      {item.isDone ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6.5 4.5 9 10 3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        item.isDone ? "text-ink-500 line-through" : "text-ink-900"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Progress report */}
      <section>
        <h2 className="mb-2.5 font-display text-lg text-ink-900">Post an update</h2>
        <ReportForm activityId={activity.id} currentStatus={activity.status} />
      </section>
    </div>
  );
}
