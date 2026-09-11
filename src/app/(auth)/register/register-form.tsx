"use client";

import { useActionState } from "react";
import { Description, Input, Label, TextField } from "@heroui/react";

import { registerUser } from "@/actions/auth";
import { FormBanner } from "@/components/ui/form-banner";
import { StateDistrictSelect } from "@/components/ui/state-district-select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/types";

type Option = { id: string; name: string };

export function RegisterUserForm({
  states,
  districtsByState,
}: {
  states: Option[];
  districtsByState: Record<string, Option[]>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    registerUser,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextField name="fullName" isRequired>
        <Label>Full name</Label>
        <Input autoComplete="name" placeholder="Your name" />
      </TextField>

      <TextField name="email" isRequired>
        <Label>Email address</Label>
        <Input type="email" autoComplete="email" inputMode="email" />
      </TextField>

      <TextField name="phone">
        <Label>Mobile number</Label>
        <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" />
        <Description>Optional. Used only for Yatra updates.</Description>
      </TextField>

      <StateDistrictSelect
        states={states}
        districtsByState={districtsByState}
        districtDescription="So we can show you what is happening in your district."
      />

      <TextField name="password" isRequired>
        <Label>Password</Label>
        <Input type="password" autoComplete="new-password" />
        <Description>At least 8 characters.</Description>
      </TextField>

      <SubmitButton fullWidth pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
