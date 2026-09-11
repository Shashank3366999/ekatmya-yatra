"use client";

/**
 * Dependent State -> District selects.
 *
 * Districts for all states are passed in once (~400 rows) and filtered on the
 * client, so choosing a state costs no round trip. That matters: survey teams
 * work on patchy mobile connections in the field.
 */
import { useMemo, useState } from "react";
import { Description, Label, ListBox, ListBoxItem, Select } from "@heroui/react";
import { Lock } from "lucide-react";

type Option = { id: string; name: string };

export function StateDistrictSelect({
  states,
  districtsByState,
  defaultStateId,
  defaultDistrictId,
  stateName = "stateId",
  districtName = "districtId",
  stateLabel = "State",
  districtLabel = "District / Zilla",
  isStateRequired = false,
  isDistrictRequired = false,
  districtDescription,
  /** Pin the state (e.g. a state organiser may only file within their state). */
  lockedStateId,
}: {
  states: Option[];
  districtsByState: Record<string, Option[]>;
  defaultStateId?: string | null;
  defaultDistrictId?: string | null;
  stateName?: string;
  districtName?: string;
  stateLabel?: string;
  districtLabel?: string;
  isStateRequired?: boolean;
  isDistrictRequired?: boolean;
  districtDescription?: string;
  lockedStateId?: string | null;
}) {
  const [stateId, setStateId] = useState<string | null>(
    lockedStateId ?? defaultStateId ?? null,
  );
  const [districtId, setDistrictId] = useState<string | null>(defaultDistrictId ?? null);

  const districts = useMemo(
    () => (stateId ? (districtsByState[stateId] ?? []) : []),
    [stateId, districtsByState],
  );

  const lockedState = lockedStateId
    ? states.find((s) => s.id === lockedStateId)
    : undefined;

  return (
    <>
      {lockedStateId ? (
        /*
          A pinned state is shown read-only with a hidden input carrying the
          value. Rendering a *disabled* Select here would be a silent data bug:
          a disabled <select> contributes nothing to FormData, so the required
          stateId would arrive empty and the submission would be rejected.
        */
        <div>
          <span className="label" data-slot="label">
            {stateLabel}
          </span>
          <div className="mt-1.5 flex items-center gap-2 rounded-[var(--field-radius)] border border-ink-200 bg-ink-50 px-3 py-2.5">
            <Lock size={13} className="shrink-0 text-ink-500" aria-hidden="true" />
            <span className="text-sm text-ink-700">
              {lockedState?.name ?? "Your state"}
            </span>
          </div>
          <input type="hidden" name={stateName} value={lockedStateId} />
          <span className="description mt-1.5 block" data-slot="description">
            You file within the area you are approved for.
          </span>
        </div>
      ) : (
        <Select
          name={stateName}
          selectedKey={stateId}
          onSelectionChange={(key) => {
            setStateId(key as string | null);
            setDistrictId(null); // the old district belongs to the old state
          }}
          isRequired={isStateRequired}
          placeholder="Select state"
        >
          <Label>{stateLabel}</Label>
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
      )}

      <Select
        name={districtName}
        selectedKey={districtId}
        onSelectionChange={(key) => setDistrictId(key as string | null)}
        isRequired={isDistrictRequired}
        /* Only disabled when there is genuinely nothing to pick — and the value
           is optional, so nothing is lost from FormData. */
        isDisabled={!stateId || districts.length === 0}
        placeholder={stateId ? "Select district" : "Select a state first"}
      >
        <Label>{districtLabel}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={districts}>
            {(d: Option) => <ListBoxItem id={d.id}>{d.name}</ListBoxItem>}
          </ListBox>
        </Select.Popover>
        {stateId && districts.length === 0 ? (
          <Description>
            Districts for this state are not loaded yet. Leave blank and the admin
            will fill it in.
          </Description>
        ) : districtDescription ? (
          <Description>{districtDescription}</Description>
        ) : null}
      </Select>
    </>
  );
}
