"use client";

import { useActionState } from "react";
import {
  Description,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import { saveRoleTemplate, toggleRoleTemplate } from "@/actions/roles";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SELECTABLE_FUNCTIONS } from "@/components/organizer-posting-fields";
import { FUNCTION_LABELS, TEAM_LABELS } from "@/lib/permissions";
import type { ActionResult, FunctionArea, OrgLevel } from "@/lib/types";

type Template = {
  id: string;
  name: string;
  description: string | null;
  postingKind: "committee" | "volunteer";
  level: OrgLevel;
  functionArea: FunctionArea;
  items: string[];
};

const LEVELS: OrgLevel[] = ["national", "state", "district"];

export function RoleForm({ template }: { template?: Template }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    saveRoleTemplate,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner state={state} />
      {template ? <input type="hidden" name="templateId" value={template.id} /> : null}

      <TextField name="name" isRequired defaultValue={template?.name}>
        <Label>Role name</Label>
        <Input placeholder="Survey Lead (State)" />
        <Description>What the joiner sees on the signup form.</Description>
      </TextField>

      <TextField name="description" defaultValue={template?.description ?? ""}>
        <Label>What it involves</Label>
        <TextArea rows={2} placeholder="One or two lines, in plain language." />
      </TextField>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select name="postingKind" defaultSelectedKey={template?.postingKind ?? "committee"}>
          <Label>Route in</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="committee">Organizing Team Member</ListBoxItem>
              <ListBoxItem id="volunteer">Volunteer</ListBoxItem>
            </ListBox>
          </Select.Popover>
        </Select>

        <Select name="level" defaultSelectedKey={template?.level ?? "state"}>
          <Label>Suggested team</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {LEVELS.map((l) => (
                <ListBoxItem key={l} id={l}>
                  {TEAM_LABELS[l]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          name="functionArea"
          defaultSelectedKey={template?.functionArea ?? "survey"}
        >
          <Label>Responsibility</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SELECTABLE_FUNCTIONS.map((f) => (
                <ListBoxItem key={f} id={f}>
                  {FUNCTION_LABELS[f]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <TextField name="checklist" defaultValue={(template?.items ?? []).join("\n")}>
        <Label>Checklist</Label>
        <TextArea rows={6} placeholder={"One point per line\nVisit each place and record what you find\nFile a survey entry for every place"} />
        <Description>
          One point per line. Copied onto the person&apos;s own dashboard when you
          approve them, so editing here never changes work already underway.
        </Description>
      </TextField>

      <SubmitButton pendingLabel="Saving…">
        {template ? "Save this role" : "Add role"}
      </SubmitButton>
    </form>
  );
}

/** Hide or show a role on the signup form. */
export function RoleVisibilityButton({
  templateId,
  isActive,
}: {
  templateId: string;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    toggleRoleTemplate,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <SubmitButton variant="outline" size="sm" pendingLabel="…">
        {isActive ? "Hide" : "Show"}
      </SubmitButton>
      {state && !state.ok ? (
        <span className="ml-2 text-xs text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
