"use client";

import { useActionState } from "react";
import { Description, Input, Label, TextField } from "@heroui/react";

import { registerOrganizer } from "@/actions/auth";
import {
  OrganizerPostingFields,
  type RoleTemplateOption,
} from "@/components/organizer-posting-fields";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/types";

type Option = { id: string; name: string };

export function RegisterOrganizerForm({
  states,
  districtsByState,
  roleTemplates,
}: {
  states: Option[];
  districtsByState: Record<string, Option[]>;
  roleTemplates: RoleTemplateOption[];
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    registerOrganizer,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormBanner state={state} />

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
          Your details
        </legend>

        <TextField name="fullName" isRequired>
          <Label>Full name</Label>
          <Input autoComplete="name" />
        </TextField>

        <TextField name="email" isRequired>
          <Label>Email address</Label>
          <Input type="email" autoComplete="email" inputMode="email" />
        </TextField>

        <TextField name="phone">
          <Label>Mobile number</Label>
          <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" />
        </TextField>
      </fieldset>

      <OrganizerPostingFields
        states={states}
        districtsByState={districtsByState}
        roleTemplates={roleTemplates}
      />

      <fieldset className="space-y-4 border-t border-ink-200 pt-5">
        <TextField name="password" isRequired>
          <Label>Password</Label>
          <Input type="password" autoComplete="new-password" />
          <Description>At least 8 characters.</Description>
        </TextField>
      </fieldset>

      <SubmitButton fullWidth pendingLabel="Submitting…">
        Submit for approval
      </SubmitButton>
    </form>
  );
}
