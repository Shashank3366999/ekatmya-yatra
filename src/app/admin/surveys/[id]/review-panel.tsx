"use client";

/** Admin triage panel: set the status, leave a note, optionally add to the route. */
import { useActionState, useState } from "react";
import {
  Alert,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import { reviewSurvey } from "@/actions/survey";
import { SwitchField } from "@/components/ui/choice";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SURVEY_STATUS_LABELS } from "@/lib/labels";
import type { ActionResult, SurveyStatus } from "@/lib/types";

const REVIEWABLE: SurveyStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "rejected",
];

export function ReviewPanel({
  surveyId,
  currentStatus,
  currentNote,
  alreadyOnRoute,
  hasCoordinates,
}: {
  surveyId: string;
  currentStatus: SurveyStatus;
  currentNote: string | null;
  alreadyOnRoute: boolean;
  hasCoordinates: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    reviewSurvey,
    null,
  );
  const [status, setStatus] = useState<SurveyStatus>(currentStatus);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink-200 bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink-900">Review</h2>

      <FormBanner state={state} />
      <input type="hidden" name="surveyId" value={surveyId} />

      <Select
        name="status"
        selectedKey={status}
        onSelectionChange={(k) => setStatus(k as SurveyStatus)}
        isRequired
      >
        <Label>Decision</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {REVIEWABLE.map((s) => (
              <ListBoxItem key={s} id={s}>
                {SURVEY_STATUS_LABELS[s]}
              </ListBoxItem>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <TextField name="adminNote" defaultValue={currentNote ?? ""}>
        <Label>Note to the surveyor</Label>
        <TextArea rows={4} placeholder="Visible to whoever filed this entry." />
      </TextField>

      {/* Promotion onto the route is only meaningful on approval */}
      {status === "approved" ? (
        alreadyOnRoute ? (
          <Alert status="success">
            <Alert.Content>
              <Alert.Title>Already on the Yatra route</Alert.Title>
            </Alert.Content>
          </Alert>
        ) : (
          <div className="rounded-lg border border-ink-200 bg-ink-50/70 px-3.5 py-3">
            <SwitchField name="addToRoute">
              <span className="text-sm text-ink-900">Add to the Yatra route</span>
            </SwitchField>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
              Makes this place part of the Yatra and puts it on the public map. It
              joins without a position in the itinerary and appears under
              “Awaiting sequencing” on the Yatra route screen.
              {hasCoordinates
                ? ""
                : " No coordinates were captured, so it will not show as a map marker."}
            </p>
          </div>
        )
      ) : null}

      <SubmitButton fullWidth pendingLabel="Saving…">
        Save decision
      </SubmitButton>
    </form>
  );
}
