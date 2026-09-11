import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Button, Chip } from "@heroui/react";
import { Clock } from "lucide-react";

import { logout } from "@/actions/auth";
import { AccentRule } from "@/components/brand";
import { LinkButton } from "@/components/ui/link-button";
import { ApprovalStatusChip } from "@/components/ui/status-chip";
import { formatDate } from "@/lib/format";
import { FUNCTION_LABELS, LEVEL_LABELS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Awaiting approval" };

/**
 * Status screen for organisers who are not yet operational. Also catches the
 * rejected/changes-requested cases so nobody is left staring at a dead end.
 */
export default async function PendingPage() {
  const user = await requireUser();

  // Approved organisers and admins have no business here.
  if (user.accountType === "admin" || user.accountType === "super_admin") redirect("/admin");
  if (user.organizer?.status === "approved") redirect("/o");
  if (!user.organizer) redirect("/home");

  const posting = user.organizer;
  const rejected = posting.status === "rejected";
  const changes = posting.status === "changes_requested";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-pumpkin-50 text-pumpkin-700">
          <Clock size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-xl text-ink-900">
            {rejected
              ? "Registration not approved"
              : changes
                ? "Changes requested"
                : "Awaiting approval"}
          </h1>
          <p className="text-sm text-ink-500">Namaste, {user.fullName}</p>
        </div>
      </div>

      <AccentRule className="my-6" />

      {rejected ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>Your organiser request was not approved</Alert.Title>
            <Alert.Description>
              {posting.reviewNote ??
                "Please contact the Yatra team if you believe this is a mistake."}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : changes ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>The team needs a little more information</Alert.Title>
            <Alert.Description>
              {posting.reviewNote ?? "Please get in touch with the Yatra team."}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <Alert status="accent">
          <Alert.Content>
            <Alert.Title>Your details are with the Yatra team</Alert.Title>
            <Alert.Description>
              You will be able to see your checklists and file survey entries as
              soon as your posting is approved.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* What they submitted, so they can check it at a glance */}
      <dl className="mt-6 divide-y divide-ink-200 rounded-xl border border-ink-200 bg-surface">
        <Row label="Status">
          <ApprovalStatusChip status={posting.status} />
        </Row>
        <Row label="Level">{LEVEL_LABELS[posting.level]}</Row>
        <Row label="Area">
          {posting.districtName
            ? `${posting.districtName}, ${posting.stateName ?? ""}`.replace(/, $/, "")
            : (posting.stateName ?? "All India")}
        </Row>
        <Row label="Responsibility">
          <div className="flex flex-wrap justify-end gap-1.5">
            <Chip size="sm" variant="soft" color="accent">
              {FUNCTION_LABELS[posting.primaryFunction]}
            </Chip>
            {posting.additionalFunctions.map((f) => (
              <Chip key={f} size="sm" variant="soft">
                {FUNCTION_LABELS[f]}
              </Chip>
            ))}
          </div>
        </Row>
        {posting.designation ? <Row label="Designation">{posting.designation}</Row> : null}
      </dl>

      <div className="mt-6 flex flex-col gap-2.5">
        <LinkButton href="/home" variant="secondary" fullWidth>
          Explore the Yatra meanwhile
        </LinkButton>
        <form action={logout}>
          <Button type="submit" variant="ghost" fullWidth>
            Sign out
          </Button>
        </form>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-500">
        Registered {formatDate(new Date())}. Approvals are handled by the Yatra
        administration team.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}
