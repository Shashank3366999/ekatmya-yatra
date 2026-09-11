"use client";

import { useActionState } from "react";
import {
  Description,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import { addActivityReport } from "@/actions/activity";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { humanise } from "@/lib/format";
import type { ActionResult } from "@/lib/types";

const STATUSES = ["not_started", "in_progress", "blocked", "completed"] as const;

/** "Who did you meet, what is the status" — the narrative update from the field. */
export function ReportForm({
  activityId,
  currentStatus,
}: {
  activityId: string;
  currentStatus: string;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    addActivityReport,
    null,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink-200 bg-surface p-4"
    >
      <FormBanner state={state} />
      <input type="hidden" name="activityId" value={activityId} />

      <TextField name="body" isRequired>
        <Label>What happened</Label>
        <TextArea rows={4} placeholder="What you did, what was agreed, what is pending…" />
      </TextField>

      <TextField name="peopleMet">
        <Label>People met</Label>
        <TextArea rows={2} placeholder="Names, roles, organisations…" />
        <Description>Optional.</Description>
      </TextField>

      <Select name="statusAtReport" defaultSelectedKey={currentStatus} isRequired>
        <Label>Status after this update</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {STATUSES.map((s) => (
              <ListBoxItem key={s} id={s}>
                {humanise(s)}
              </ListBoxItem>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <SubmitButton pendingLabel="Posting…">Post update</SubmitButton>
    </form>
  );
}
