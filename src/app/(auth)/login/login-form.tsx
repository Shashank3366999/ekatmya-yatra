"use client";

import { useActionState } from "react";
import { Input, Label, TextField } from "@heroui/react";

import { login } from "@/actions/auth";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/types";

export function LoginForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextField name="email" isRequired>
        <Label>Email address</Label>
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
      </TextField>

      <TextField name="password" isRequired>
        <Label>Password</Label>
        <Input type="password" autoComplete="current-password" placeholder="••••••••" />
      </TextField>

      <SubmitButton fullWidth pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
