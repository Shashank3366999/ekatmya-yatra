"use client";

import { useActionState } from "react";

import { requestOrganizerPosting } from "@/actions/organizer";
import { OrganizerPostingFields } from "@/components/organizer-posting-fields";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/types";

type Option = { id: string; name: string };

/** Requests an organiser posting on the account the user already has. */
export function PostingRequestForm({
  states,
  districtsByState,
  defaultStateId,
  defaultDistrictId,
}: {
  states: Option[];
  districtsByState: Record<string, Option[]>;
  defaultStateId?: string | null;
  defaultDistrictId?: string | null;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    requestOrganizerPosting,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormBanner state={state} />
      <OrganizerPostingFields
        states={states}
        districtsByState={districtsByState}
        defaultStateId={defaultStateId}
        defaultDistrictId={defaultDistrictId}
      />
      <SubmitButton fullWidth pendingLabel="Submitting…">
        Submit request for approval
      </SubmitButton>
    </form>
  );
}
