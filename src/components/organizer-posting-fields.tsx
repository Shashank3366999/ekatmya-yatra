"use client";

/**
 * Joining the organising team is two choices, in the Yatra team's own framing:
 *
 *   1. Which team do you want to join?   National / State / District
 *   2. Which role?                       Survey, Event Planning, Digital Media…
 *
 * Those map to `level` and `primaryFunction`. Everything else here is supporting
 * detail: where the team sits geographically, any extra roles you can cover, how
 * much time you can give.
 *
 * Shared by organiser signup and by the in-place posting request an existing
 * user makes from /join, so the two can never ask different questions.
 */
import { useState } from "react";
import {
  CheckboxGroup,
  Description,
  RadioGroup,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import { CheckOption, RadioOption, SwitchField } from "@/components/ui/choice";
import { AVAILABILITY_LABELS } from "@/lib/labels";
import { StateDistrictSelect } from "@/components/ui/state-district-select";
import {
  FUNCTION_LABELS,
  TEAM_DESCRIPTIONS,
  TEAM_LABELS,
} from "@/lib/permissions";
import type { Availability, FunctionArea, OrgLevel } from "@/lib/types";

type Option = { id: string; name: string };

/** A role an admin has defined, as the signup form needs it. */
export type RoleTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  level: OrgLevel;
  functionArea: FunctionArea;
  items: string[];
};

const LEVELS: OrgLevel[] = ["national", "state", "district"];

const AVAILABILITY: Availability[] = [
  "few_days",
  "one_week",
  "two_weeks",
  "one_month",
  "full_yatra",
  "flexible",
];

/** The streams a person can volunteer for at signup. */
export const SELECTABLE_FUNCTIONS: FunctionArea[] = [
  "survey",
  "route_planning",
  "event_planning",
  "concept_design",
  "social_media",
  "print_media",
  "media_pr",
  "invite_outreach",
  "logistics",
  "boarding_lodging",
  "fleet",
  "medical",
  "finance",
  "general",
];

export function OrganizerPostingFields({
  states,
  districtsByState,
  defaultStateId,
  defaultDistrictId,
  roleTemplates = [],
}: {
  states: Option[];
  districtsByState: Record<string, Option[]>;
  defaultStateId?: string | null;
  defaultDistrictId?: string | null;
  roleTemplates?: RoleTemplateOption[];
}) {
  const [level, setLevel] = useState<OrgLevel>(roleTemplates[0]?.level ?? "state");
  const [primaryFunction, setPrimaryFunction] = useState<FunctionArea>(
    roleTemplates[0]?.functionArea ?? "survey",
  );
  const [templateId, setTemplateId] = useState<string>(roleTemplates[0]?.id ?? "");

  const template = roleTemplates.find((t) => t.id === templateId) ?? null;

  /*
    Picking a role moves the team and the responsibility to whatever the admin
    set on it. Both stay editable: the role is a starting point, and the admin
    can change the posting at approval either way.
  */
  function chooseTemplate(id: string) {
    setTemplateId(id);
    const picked = roleTemplates.find((t) => t.id === id);
    if (picked) {
      setLevel(picked.level);
      setPrimaryFunction(picked.functionArea);
    }
  }

  return (
    <>
      {roleTemplates.length > 0 ? (
        <fieldset className="space-y-4">
          <legend className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
            1 · Which role are you signing up for?
          </legend>

          <RadioGroup
            name="roleTemplateId"
            value={templateId}
            onChange={chooseTemplate}
            aria-label="Role"
          >
            <div className="space-y-2.5">
              {roleTemplates.map((t) => (
                <RadioOption
                  key={t.id}
                  value={t.id}
                  className="rounded-xl border border-ink-200 bg-surface p-3.5 data-[selected]:border-pumpkin-400 data-[selected]:bg-pumpkin-50/60"
                >
                  <span className="block text-sm font-medium text-ink-900">{t.name}</span>
                  {t.description ? (
                    <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                      {t.description}
                    </span>
                  ) : null}
                </RadioOption>
              ))}
            </div>
          </RadioGroup>

          {/*
            The checklist that comes with the role, shown before anyone commits.
            It is the Admin Panel's list: it becomes their actual tasks the
            moment an admin approves them, so it should be no surprise here.
          */}
          {template && template.items.length > 0 ? (
            <div className="rounded-xl border border-pumpkin-200/70 bg-pumpkin-50/50 p-3.5">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-pumpkin-700 uppercase">
                What this role involves
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {template.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-relaxed text-ink-700">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pumpkin-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11px] text-ink-500">
                These become your checklist once the Yatra team approves you.
              </p>
            </div>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
          {roleTemplates.length > 0 ? "2" : "1"} · Which team do you want to join?
        </legend>

        <Select
          name="level"
          selectedKey={level}
          onSelectionChange={(k) => setLevel(k as OrgLevel)}
          isRequired
        >
          <Label>Team</Label>
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
          <Description>{TEAM_DESCRIPTIONS[level]}</Description>
        </Select>

        {level === "national" ? (
          <p className="rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-500">
The national team works across all of Bharat, so there is no state or
            district to choose.
          </p>
        ) : (
          <StateDistrictSelect
            states={states}
            districtsByState={districtsByState}
            defaultStateId={defaultStateId}
            defaultDistrictId={defaultDistrictId}
            isStateRequired
            isDistrictRequired={level === "district"}
          />
        )}

        <TextField name="designation">
          <Label>Designation or title</Label>
          <Input placeholder="e.g. State Survey Coordinator" />
          <Description>
            Optional. Use the title you have been given, if any.
          </Description>
        </TextField>

        <div className="rounded-lg border border-ink-200 bg-ink-50/70 px-3.5 py-3">
          <SwitchField name="isSpiritualRepresentative">
            <span className="text-sm text-ink-900">
              I am a Sannyasi / Acharya / spiritual representative
            </span>
          </SwitchField>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
            Helps the Yatra team route respect and responsibilities correctly.
            Final titles are being confirmed by the committee.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-ink-200 pt-5">
        <legend className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
          {roleTemplates.length > 0 ? "3" : "2"} · Which responsibility?
        </legend>

        <Select
          name="primaryFunction"
          selectedKey={primaryFunction}
          onSelectionChange={(k) => setPrimaryFunction(k as FunctionArea)}
          isRequired
        >
          <Label>Your main role</Label>
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

        <CheckboxGroup name="additionalFunctions">
          <Label>Other roles you could help with</Label>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SELECTABLE_FUNCTIONS.filter((f) => f !== primaryFunction).map((f) => (
              <CheckOption key={f} value={f}>
                <span className="text-sm">{FUNCTION_LABELS[f]}</span>
              </CheckOption>
            ))}
          </div>
          <Description>
            Optional. Pick as many as apply. The admin assigns your final roles.
          </Description>
        </CheckboxGroup>

        {/* How much time — asked for alongside the responsibility itself, so
            the team can plan who to assign what. */}
        <Select name="availability" defaultSelectedKey="few_days" isRequired>
          <Label>How much time can you give?</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {AVAILABILITY.map((a) => (
                <ListBoxItem key={a} id={a}>
                  {AVAILABILITY_LABELS[a]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
          <Description>
            Contribute your time according to your convenience. Any amount helps.
          </Description>
        </Select>

        <TextField name="availabilityNote">
          <Label>Which days suit you?</Label>
          <Input placeholder="e.g. 20–25 January, or weekends only" />
          <Description>Optional.</Description>
        </TextField>

        <TextField name="motivation">
          <Label>Anything the team should know</Label>
          <TextArea
            rows={3}
            placeholder="Experience, the area you know well, who referred you…"
          />
        </TextField>
      </fieldset>
    </>
  );
}
