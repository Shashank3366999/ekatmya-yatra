"use client";

import { useActionState, useState } from "react";
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

import { createAnnouncement } from "@/actions/admin";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { humanise } from "@/lib/format";
import type { ActionResult, Audience } from "@/lib/types";

type Option = { id: string; name: string };

const AUDIENCES: Audience[] = [
  "everyone",
  "users_only",
  "organizers_only",
  "national_organizers",
  "state_organizers",
  "district_organizers",
];

export function AnnouncementForm({ states }: { states: Option[] }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createAnnouncement,
    null,
  );
  const [stateId, setStateId] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink-200 bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink-900">New announcement</h2>

      <FormBanner state={state} />

      <TextField name="title" isRequired>
        <Label>Title</Label>
        <Input placeholder="e.g. Yatra route update" />
      </TextField>

      <TextField name="body" isRequired>
        <Label>Message</Label>
        <TextArea rows={6} placeholder="What the team or the public should know…" />
      </TextField>

      <Select name="audience" defaultSelectedKey="everyone" isRequired>
        <Label>Who sees this</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {AUDIENCES.map((a) => (
              <ListBoxItem key={a} id={a}>
                {humanise(a)}
              </ListBoxItem>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        name="stateId"
        selectedKey={stateId}
        onSelectionChange={(k) => setStateId(k as string | null)}
        placeholder="All of Bharat"
      >
        <Label>Limit to a state</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={states}>
            {(s: Option) => <ListBoxItem id={s.id}>{s.name}</ListBoxItem>}
          </ListBox>
        </Select.Popover>
        <Description>Optional. Leave blank to reach everyone.</Description>
      </Select>

      <SubmitButton fullWidth pendingLabel="Publishing…">
        Publish announcement
      </SubmitButton>
    </form>
  );
}
