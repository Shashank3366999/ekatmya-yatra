"use client";

import { useActionState } from "react";
import { Input, Label, ListBox, ListBoxItem, Select, TextField } from "@heroui/react";

import { reviewOrganizer } from "@/actions/admin";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { APPROVAL_STATUS_LABELS } from "@/lib/labels";
import type { ActionResult, ApprovalStatus } from "@/lib/types";

const STATUSES = Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[];

/** Approve, reject or ask for changes on one organiser posting. */
export function OrganizerReviewForm({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: ApprovalStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    reviewOrganizer,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormBanner state={state} />
      <input type="hidden" name="profileId" value={profileId} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <Select name="status" defaultSelectedKey={currentStatus} isRequired>
            <Label>Decision</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STATUSES.map((s) => (
                  <ListBoxItem key={s} id={s}>
                    {APPROVAL_STATUS_LABELS[s]}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div className="min-w-52 flex-[2]">
          <TextField name="reviewNote">
            <Label>Note (shown to them)</Label>
            <Input placeholder="Optional" />
          </TextField>
        </div>

        <SubmitButton size="md" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}
