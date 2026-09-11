"use client";

/**
 * Admin review of one organiser posting.
 *
 * The admin controls the whole posting, not only the verdict — "admin panel पे
 * सारे role control होते हैं". Someone may ask to join the national Survey team
 * and be placed in the Maharashtra chapter on Digital Media instead, so the
 * team, the role, the extra roles and the designation are all editable here
 * alongside approve/reject.
 *
 * The decision row is always visible; the team-and-role editor sits behind a
 * disclosure so the common case (a straight approval) stays one click.
 */
import { useActionState, useState } from "react";
import {
  CheckboxGroup,
  Description,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextField,
} from "@heroui/react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { reviewOrganizer } from "@/actions/admin";
import { CheckOption, SwitchField } from "@/components/ui/choice";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { APPROVAL_STATUS_LABELS } from "@/lib/labels";
import { FUNCTION_LABELS, TEAM_LABELS } from "@/lib/permissions";
import type {
  ActionResult,
  ApprovalStatus,
  FunctionArea,
  OrgLevel,
} from "@/lib/types";

type Option = { id: string; name: string };

const STATUSES = Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[];
const LEVELS: OrgLevel[] = ["national", "state", "district"];

/** Every role the admin can assign. */
const ROLES: FunctionArea[] = [
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

export function OrganizerReviewForm({
  profileId,
  currentStatus,
  currentLevel,
  currentStateId,
  currentDistrictId,
  currentPrimaryFunction,
  currentAdditionalFunctions,
  currentDesignation,
  currentIsSpiritual,
  states,
  districtsByState,
}: {
  profileId: string;
  currentStatus: ApprovalStatus;
  currentLevel: OrgLevel;
  currentStateId: string | null;
  currentDistrictId: string | null;
  currentPrimaryFunction: FunctionArea;
  currentAdditionalFunctions: FunctionArea[];
  currentDesignation: string | null;
  currentIsSpiritual: boolean;
  states: Option[];
  districtsByState: Record<string, Option[]>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    reviewOrganizer,
    null,
  );

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<OrgLevel>(currentLevel);
  const [stateId, setStateId] = useState<string | null>(currentStateId);
  const [districtId, setDistrictId] = useState<string | null>(currentDistrictId);
  const [primary, setPrimary] = useState<FunctionArea>(currentPrimaryFunction);

  const districts = stateId ? (districtsByState[stateId] ?? []) : [];

  return (
    <form action={formAction} className="space-y-3">
      <FormBanner state={state} />
      <input type="hidden" name="profileId" value={profileId} />

      {/* ------------------------------------------------ the decision row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <Select name="status" defaultSelectedKey={currentStatus} isRequired>
            <Label>Decision</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STATUSES.map((s) => (
                  <ListBoxItem key={s} id={s}>
                    {APPROVAL_STATUS_LABELS[s]}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div className="min-w-52 flex-[2]">
          <TextField name="reviewNote">
            <Label>Note (shown to them)</Label>
            <Input placeholder="Optional" />
          </TextField>
        </div>

        <SubmitButton size="md" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </div>

      {/* --------------------------------------- team and role, on request */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        {open ? "Hide team & role" : "Change team & role"}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>

      {open ? (
        <div className="space-y-4 rounded-xl border border-ink-200 bg-ink-50 p-4">
          {/*
            Submitted only while this panel is open. The action distinguishes
            "absent" from "blank", so a plain approve never wipes the posting.
          */}
          <input type="hidden" name="reviewTeamRole" value="1" />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* 1 — which team */}
            <Select
              name="level"
              selectedKey={level}
              onSelectionChange={(k) => {
                const next = k as OrgLevel;
                setLevel(next);
                if (next === "national") {
                  setStateId(null);
                  setDistrictId(null);
                }
                if (next === "state") setDistrictId(null);
              }}
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
            </Select>

            {/* 2 — which role */}
            <Select
              name="primaryFunction"
              selectedKey={primary}
              onSelectionChange={(k) => setPrimary(k as FunctionArea)}
            >
              <Label>Main role</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ROLES.map((f) => (
                    <ListBoxItem key={f} id={f}>
                      {FUNCTION_LABELS[f]}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {/* Scope, only where the team has one */}
            {level === "national" ? (
              <p className="self-center text-xs leading-relaxed text-ink-500 sm:col-span-2">
                The national team works across all of Bharat, so it carries no
                state or district.
              </p>
            ) : (
              <>
                <Select
                  name="stateId"
                  selectedKey={stateId}
                  onSelectionChange={(k) => {
                    setStateId(k as string | null);
                    setDistrictId(null);
                  }}
                  placeholder="Select state"
                >
                  <Label>State</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox items={states}>
                      {(s: Option) => <ListBoxItem id={s.id}>{s.name}</ListBoxItem>}
                    </ListBox>
                  </Select.Popover>
                </Select>

                {level === "district" ? (
                  <Select
                    name="districtId"
                    selectedKey={districtId}
                    onSelectionChange={(k) => setDistrictId(k as string | null)}
                    isDisabled={!stateId || districts.length === 0}
                    placeholder={stateId ? "Select district" : "Select a state first"}
                  >
                    <Label>District</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox items={districts}>
                        {(d: Option) => <ListBoxItem id={d.id}>{d.name}</ListBoxItem>}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                ) : null}
              </>
            )}
          </div>

          {/* Extra roles */}
          <CheckboxGroup name="additionalFunctions" defaultValue={currentAdditionalFunctions}>
            <Label>Other roles they also cover</Label>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {ROLES.filter((f) => f !== primary).map((f) => (
                <CheckOption key={f} value={f}>
                  <span className="text-sm">{FUNCTION_LABELS[f]}</span>
                </CheckOption>
              ))}
            </div>
            <Description>
              The main role is excluded automatically.
            </Description>
          </CheckboxGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="designation" defaultValue={currentDesignation ?? ""}>
              <Label>Designation</Label>
              <Input placeholder="e.g. State Survey Coordinator" />
            </TextField>

            <div className="self-end rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5">
              <SwitchField
                name="isSpiritualRepresentative"
                defaultSelected={currentIsSpiritual}
              >
                <span className="text-sm text-ink-900">
                  Sannyasi / Acharya / spiritual representative
                </span>
              </SwitchField>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-ink-400">
            Saving applies the decision and this team and role together. Changes
            are recorded in the audit trail.
          </p>
        </div>
      ) : null}
    </form>
  );
}
