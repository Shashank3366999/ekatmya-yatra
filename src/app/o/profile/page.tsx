import type { Metadata } from "next";
import { Chip } from "@heroui/react";

import { logout } from "@/actions/auth";
import { AccentRule } from "@/components/brand";
import { PageTitle } from "@/components/ui/page-title";
import { AVAILABILITY_LABELS } from "@/lib/labels";
import { ApprovalStatusChip } from "@/components/ui/status-chip";
import {
  FUNCTION_LABELS,
  LEVEL_LABELS,
  canSubmitSurvey,
  resolveScope,
  scopeLabel,
} from "@/lib/permissions";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = { title: "My role" };

/**
 * Shows the organiser exactly what their posting grants them. Being explicit
 * here saves a great deal of "why can't I see X" traffic to the admin team.
 */
export default async function OrganizerProfilePage() {
  const user = await requireOrganizer();
  const posting = user.organizer;

  const area = scopeLabel(resolveScope(user), {
    state: posting?.stateName ?? undefined,
    district: posting?.districtName ?? undefined,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageTitle title="My role & permissions" backHref="/o" />

      <section className="rounded-xl border border-ink-200 bg-surface p-4">
        <p className="font-display text-lg text-ink-900">{user.fullName}</p>
        <p className="text-sm text-ink-500">{user.email}</p>
      </section>

      <AccentRule />

      {posting ? (
        <>
          <dl className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-surface">
            <Row label="Approval">
              <ApprovalStatusChip status={posting.status} />
            </Row>
            <Row label="Level">{LEVEL_LABELS[posting.level]}</Row>
            <Row label="Area you cover">{area}</Row>
            {posting.designation ? (
              <Row label="Designation">{posting.designation}</Row>
            ) : null}
            {posting.isSpiritualRepresentative ? (
              <Row label="Spiritual representative">Yes</Row>
            ) : null}
            {posting.availability ? (
              <Row label="Time offered">
                {AVAILABILITY_LABELS[posting.availability]}
                {posting.availabilityNote ? ` · ${posting.availabilityNote}` : ""}
              </Row>
            ) : null}
            <Row label="Primary responsibility">
              {FUNCTION_LABELS[posting.primaryFunction]}
            </Row>
            {posting.additionalFunctions.length > 0 ? (
              <Row label="Also helping with">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {posting.additionalFunctions.map((f) => (
                    <Chip key={f} size="sm" variant="soft">
                      {FUNCTION_LABELS[f]}
                    </Chip>
                  ))}
                </div>
              </Row>
            ) : null}
          </dl>

          <section>
            <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
              What you can do
            </h2>
            <ul className="space-y-1.5 rounded-xl border border-ink-200 bg-surface p-4 text-sm text-ink-700">
              <li>
                • See survey entries for <strong>{area}</strong>
              </li>
              <li>
                •{" "}
                {canSubmitSurvey(user)
                  ? "File new survey entries"
                  : "Survey filing is not part of your role"}
              </li>
              <li>• Complete checklists assigned to you and post updates</li>
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              To change your level, area or responsibilities, ask the Yatra
              administration team.
            </p>
          </section>
        </>
      ) : null}

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}
