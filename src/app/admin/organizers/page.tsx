import type { Metadata } from "next";
import { Chip, Tabs } from "@heroui/react";
import { Mail, Phone, UserCheck } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { ApprovalStatusChip } from "@/components/ui/status-chip";
import { formatRelative } from "@/lib/format";
import { AVAILABILITY_LABELS } from "@/lib/labels";
import { FUNCTION_LABELS, LEVEL_LABELS } from "@/lib/permissions";
import { listOrganizerProfiles } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import type {
  ApprovalStatus,
  Availability,
  FunctionArea,
  OrgLevel,
} from "@/lib/types";

import { OrganizerReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Organisers" };

type Row = {
  profileId: string;
  fullName: string;
  email: string;
  phone: string | null;
  level: OrgLevel;
  primaryFunction: FunctionArea;
  additionalFunctions: FunctionArea[] | null;
  designation: string | null;
  isSpiritualRepresentative: boolean;
  availability: Availability | null;
  availabilityNote: string | null;
  status: ApprovalStatus;
  reviewNote: string | null;
  intake: Record<string, unknown> | null;
  createdAt: Date;
  stateName: string | null;
  districtName: string | null;
};

export default async function AdminOrganizersPage() {
  await requireAdmin();

  const [pending, approved, all] = await Promise.all([
    listOrganizerProfiles("pending", 200),
    listOrganizerProfiles("approved", 200),
    listOrganizerProfiles(undefined, 300),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Organising team"
        description="Approve postings and manage who works on what, where."
      />

      <Tabs defaultSelectedKey={pending.length ? "pending" : "approved"}>
        <Tabs.List>
          <Tabs.Tab id="pending">Pending ({pending.length})</Tabs.Tab>
          <Tabs.Tab id="approved">Approved ({approved.length})</Tabs.Tab>
          <Tabs.Tab id="all">All ({all.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="pending" className="pt-4">
          {pending.length === 0 ? (
            <Empty
              icon={UserCheck}
              title="Nothing awaiting approval"
              description="New organiser registrations appear here for review."
            />
          ) : (
            <ul className="space-y-3">
              {pending.map((o) => (
                <OrganizerCard key={o.profileId} row={o as Row} showReview />
              ))}
            </ul>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="approved" className="pt-4">
          {approved.length === 0 ? (
            <Empty icon={UserCheck} title="No approved organisers yet" />
          ) : (
            <ul className="space-y-3">
              {approved.map((o) => (
                <OrganizerCard key={o.profileId} row={o as Row} showReview />
              ))}
            </ul>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="all" className="pt-4">
          <ul className="space-y-3">
            {all.map((o) => (
              <OrganizerCard key={o.profileId} row={o as Row} showReview />
            ))}
          </ul>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function OrganizerCard({ row, showReview }: { row: Row; showReview?: boolean }) {
  const motivation =
    row.intake && typeof row.intake.motivation === "string"
      ? row.intake.motivation
      : null;

  return (
    <li className="rounded-xl border border-ink-200 bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base text-ink-900">{row.fullName}</p>
            {row.isSpiritualRepresentative ? (
              <Chip size="sm" variant="soft" color="warning">
                Spiritual representative
              </Chip>
            ) : null}
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <Mail size={12} aria-hidden="true" />
              {row.email}
            </span>
            {row.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone size={12} aria-hidden="true" />
                {row.phone}
              </span>
            ) : null}
          </p>

          <p className="mt-1.5 text-sm text-ink-600">
            {LEVEL_LABELS[row.level]}
            {row.districtName || row.stateName
              ? ` · ${row.districtName ? `${row.districtName}, ` : ""}${row.stateName ?? ""}`
              : " · All India"}
            {row.designation ? ` · ${row.designation}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip size="sm" variant="soft" color="accent">
              {FUNCTION_LABELS[row.primaryFunction]}
            </Chip>
            {(row.additionalFunctions ?? []).map((f) => (
              <Chip key={f} size="sm" variant="soft">
                {FUNCTION_LABELS[f]}
              </Chip>
            ))}
          </div>

          {row.availability ? (
            <p className="mt-2 text-xs text-ink-600">
              <span className="font-medium text-ink-900">Time offered:</span>{" "}
              {AVAILABILITY_LABELS[row.availability]}
              {row.availabilityNote ? ` · ${row.availabilityNote}` : ""}
            </p>
          ) : null}

          {motivation ? (
            <p className="mt-2.5 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-600">
              {motivation}
            </p>
          ) : null}

          {row.reviewNote ? (
            <p className="mt-2 text-xs text-ink-500">
              <span className="font-medium">Review note:</span> {row.reviewNote}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ApprovalStatusChip status={row.status} />
          <span className="text-[11px] text-ink-400">
            {formatRelative(row.createdAt)}
          </span>
        </div>
      </div>

      {showReview ? (
        <div className="mt-3.5 border-t border-ink-200 pt-3.5">
          <OrganizerReviewForm profileId={row.profileId} currentStatus={row.status} />
        </div>
      ) : null}
    </li>
  );
}
