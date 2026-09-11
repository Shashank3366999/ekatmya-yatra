"use client";

/**
 * Inline access controls for one user row.
 *
 * Two separate forms on purpose: changing someone's role and deactivating them
 * are different decisions, and a single combined button made it impossible to do
 * one without the other.
 */
import { useActionState } from "react";
import { ListBox, ListBoxItem, Select } from "@heroui/react";

import { updateUserAccess } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { humanise } from "@/lib/format";
import type { AccountType, ActionResult } from "@/lib/types";

export function UserAccessForm({
  userId,
  isActive,
  accountType,
  canGrantAdmin,
}: {
  userId: string;
  isActive: boolean;
  accountType: AccountType;
  canGrantAdmin: boolean;
}) {
  const [roleState, roleAction] = useActionState<ActionResult | null, FormData>(
    updateUserAccess,
    null,
  );
  const [activeState, activeAction] = useActionState<ActionResult | null, FormData>(
    updateUserAccess,
    null,
  );

  const types: AccountType[] = canGrantAdmin
    ? ["user", "organizer", "admin", "super_admin"]
    : ["user", "organizer"];

  const error = (!roleState?.ok && roleState?.error) || (!activeState?.ok && activeState?.error);

  return (
    <div className="flex flex-col gap-2">
      {/* Role */}
      <form action={roleAction} className="flex items-center gap-1.5">
        <input type="hidden" name="userId" value={userId} />
        <Select
          name="accountType"
          defaultSelectedKey={accountType}
          aria-label="Account type"
        >
          <Select.Trigger className="min-w-30">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {types.map((t) => (
                <ListBoxItem key={t} id={t}>
                  {humanise(t)}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <SubmitButton size="sm" variant="secondary" pendingLabel="…">
          Save
        </SubmitButton>
      </form>

      {/* Activation */}
      <form action={activeAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="isActive" value={String(!isActive)} />
        <SubmitButton
          size="sm"
          variant={isActive ? "danger-soft" : "secondary"}
          pendingLabel="…"
        >
          {isActive ? "Deactivate" : "Activate"}
        </SubmitButton>
      </form>

      {error ? <span className="text-[11px] text-danger">{error}</span> : null}
    </div>
  );
}
