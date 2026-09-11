"use client";

/**
 * The survey capture form.
 *
 * Presented as four steps because it is filled in on a phone, often standing in
 * a temple courtyard. Design notes:
 *
 *  - All steps stay mounted (hidden, not unmounted) so a half-finished answer is
 *    never lost by stepping back and forth, and one submit posts every field.
 *  - Only "where is it" is mandatory. A surveyor who knows nothing else yet can
 *    still file the place and fill in details later — a blocked form means the
 *    information ends up in a notebook instead.
 *  - "Save as draft" exists for exactly that reason.
 */
import { useActionState, useState } from "react";
import {
  Button,
  Description,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  RadioGroup,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { Check, MapPin } from "lucide-react";

import { submitSurvey } from "@/actions/survey";
import { RadioOption } from "@/components/ui/choice";
import { FormBanner } from "@/components/ui/form-banner";
import { StateDistrictSelect } from "@/components/ui/state-district-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { PLACE_CATEGORY_LABELS, RECOMMENDATION_LABELS, YATRA_KIND_LABELS } from "@/lib/labels";
import type {
  ActionResult,
  PlaceCategory,
  Recommendation,
  SessionUser,
  YatraKind,
} from "@/lib/types";

type Option = { id: string; name: string };

const STEPS = [
  { id: 1, label: "Location" },
  { id: 2, label: "Significance" },
  { id: 3, label: "Facilities" },
  { id: 4, label: "Contact & verdict" },
] as const;

const CATEGORIES = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategory[];
const KINDS = Object.keys(YATRA_KIND_LABELS) as YatraKind[];
const RECOMMENDATIONS = Object.keys(RECOMMENDATION_LABELS) as Recommendation[];

/** Yes / No / Not known — a tri-state, because "unknown" is real field data. */
function TriState({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    /*
      Vertical group (label above) with the options laid out in a row inside.
      Passing orientation="horizontal" makes the *label* part of the flex row
      too, so short questions sat inline while long ones wrapped — the answers
      then failed to line up down the page.
    */
    <RadioGroup name={name} defaultValue="unknown">
      <Label>{label}</Label>
      <div className="mt-1.5 flex gap-4">
        <RadioOption value="true">Yes</RadioOption>
        <RadioOption value="false">No</RadioOption>
        <RadioOption value="unknown">Not known</RadioOption>
      </div>
    </RadioGroup>
  );
}

export function SurveyForm({
  user,
  states,
  districtsByState,
}: {
  user: SessionUser;
  states: Option[];
  districtsByState: Record<string, Option[]>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    submitSurvey,
    null,
  );
  const [step, setStep] = useState(1);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "locating" | "done" | "error" | "insecure"
  >("idle");
  const [coords, setCoords] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });

  /** A state organiser may only file inside their own state. */
  const lockedStateId =
    user.organizer && user.organizer.level !== "national" ? user.organizer.stateId : null;

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    /*
      Browsers only expose geolocation in a secure context. Over plain HTTP —
      which is how the app is reached when testing on a phone across the local
      network — the call fails with the same generic error as a denied
      permission, so say what is actually wrong instead.
    */
    if (!window.isSecureContext) {
      setGeoStatus("insecure");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  /* The progress bar. One presentation at every size: this form lives in the
     phone-width app column, so a wide-screen variant would never be the right
     shape for it. */
  const stepBar = (
    <ol className="flex items-center gap-1.5" aria-label="Survey progress">
      {STEPS.map((s) => {
        const done = s.id < step;
        const active = s.id === step;
        return (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => setStep(s.id)}
              /* Tappable, so it needs a real target height, not just the bar. */
              className="flex min-h-11 w-full flex-col justify-center gap-1.5 text-left"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`block h-1.5 rounded-full transition-colors ${
                  done || active ? "bg-pumpkin-500" : "bg-ink-200"
                }`}
              />
              <span
                className={`block truncate text-[10px] ${
                  active ? "font-semibold text-pumpkin-700" : "text-ink-500"
                }`}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <form
      action={formAction}
     
    >

      <div className="space-y-5">
        <FormBanner state={state} />

        {stepBar}

      {/* ------------------------------------------------- 1. Where is it */}
      <fieldset hidden={step !== 1} className="space-y-4">
        <legend className="sr-only">Location</legend>

        <TextField name="placeName" isRequired>
          <Label>Name of the place</Label>
          <Input placeholder="e.g. Sree Krishna Temple, Perumbavoor" autoComplete="off" />
          <Description>How it is known locally.</Description>
        </TextField>

        <StateDistrictSelect
          states={states}
          districtsByState={districtsByState}
          isStateRequired
          lockedStateId={lockedStateId}
          defaultStateId={user.organizer?.stateId ?? null}
          defaultDistrictId={user.organizer?.districtId ?? null}
        />

        <TextField name="addressNotes">
          <Label>Address / landmark</Label>
          <TextArea rows={2} placeholder="Nearest bus stand, road, distance from town…" />
        </TextField>

        <Select name="category" defaultSelectedKey="religious" isRequired>
          <Label>Type of place</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CATEGORIES.map((c) => (
                <ListBoxItem key={c} id={c}>
                  {PLACE_CATEGORY_LABELS[c]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <RadioGroup name="proposedFor" defaultValue="main">
          <Label>Proposed for</Label>
          <div className="mt-1.5 space-y-1.5">
            {KINDS.map((k) => (
              <RadioOption key={k} value={k}>
                {YATRA_KIND_LABELS[k]}
              </RadioOption>
            ))}
          </div>
          <Description>
            The Main Yatra is the Kalady–Kedarnath spine. A Sub-Yatra is a local
            journey that joins it.
          </Description>
        </RadioGroup>

        {/* Coordinates: captured from the device where possible */}
        <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">Coordinates</p>
              <p className="text-[11px] text-ink-500">
                {geoStatus === "done"
                  ? `Captured: ${coords.lat}, ${coords.lng}`
                  : geoStatus === "insecure"
                    ? "Your browser only shares location over a secure (https) connection. Type the coordinates in below."
                    : geoStatus === "error"
                      ? "Could not read location. Type it in below or leave blank."
                      : "Put the place on the Yatra map."}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onPress={captureLocation}
              isDisabled={geoStatus === "locating"}
            >
              {geoStatus === "done" ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <MapPin size={15} aria-hidden="true" />
              )}
              {geoStatus === "locating" ? "Locating…" : "Use my location"}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <TextField name="latitude" value={coords.lat} onChange={(v) => setCoords((c) => ({ ...c, lat: v }))}>
              <Label>Latitude</Label>
              <Input inputMode="decimal" placeholder="10.1747" />
            </TextField>
            <TextField name="longitude" value={coords.lng} onChange={(v) => setCoords((c) => ({ ...c, lng: v }))}>
              <Label>Longitude</Label>
              <Input inputMode="decimal" placeholder="76.4358" />
            </TextField>
          </div>
        </div>
      </fieldset>

      {/* --------------------------------------------- 2. Why it matters */}
      <fieldset hidden={step !== 2} className="space-y-4">
        <legend className="sr-only">Significance</legend>

        <TextField name="significance">
          <Label>Significance to the Yatra</Label>
          <TextArea
            rows={5}
            placeholder="Connection to Adi Shankaracharya or Advaita, local devotion, history, why the Yatra should come here…"
          />
          <Description>
            The single most useful field for route planning. Write freely.
          </Description>
        </TextField>

        <TextField name="expectedGathering">
          <Label>Expected gathering</Label>
          <Input inputMode="numeric" placeholder="e.g. 2500" />
          <Description>
            Roughly how many people could assemble here. An estimate is fine.
          </Description>
        </TextField>
      </fieldset>

      {/* ------------------------------------------------- 3. Facilities */}
      <fieldset hidden={step !== 3} className="space-y-5">
        <legend className="sr-only">Facilities</legend>

        <TriState name="isVehicleAccessible" label="Can vehicles and buses reach it?" />
        <TriState name="hasParking" label="Is there parking?" />
        <TriState name="hasStageOrHall" label="Is there a stage or hall?" />
        <TriState name="hasAccommodation" label="Is accommodation available nearby?" />

        <TextField name="accessNotes">
          <Label>Access notes</Label>
          <TextArea
            rows={3}
            placeholder="Road width, last-mile walk, steps, restrictions, timings…"
          />
        </TextField>
      </fieldset>

      {/* -------------------------------------------- 4. Contact & verdict */}
      <fieldset hidden={step !== 4} className="space-y-4">
        <legend className="sr-only">Contact and recommendation</legend>

        <TextField name="contactName">
          <Label>Person you met</Label>
          <Input placeholder="e.g. Sri Ramesh Nair" autoComplete="off" />
        </TextField>

        <div className="grid grid-cols-1 gap-4">
          <TextField name="contactPhone">
            <Label>Their phone</Label>
            <Input type="tel" inputMode="tel" placeholder="98765 43210" />
          </TextField>

          <TextField name="contactRole">
            <Label>Their role</Label>
            <Input placeholder="e.g. Trust Secretary" autoComplete="off" />
          </TextField>
        </div>

        <TextField name="organizationsMet">
          <Label>Organisations involved</Label>
          <TextArea rows={2} placeholder="Temple Trust, local Sabha, college…" />
          <Description>Separate several with commas.</Description>
        </TextField>

        <RadioGroup name="recommendation" defaultValue="recommended" isRequired>
          <Label>Your recommendation</Label>
          <div className="mt-1.5 space-y-1.5">
            {RECOMMENDATIONS.map((r) => (
              <RadioOption key={r} value={r}>
                {RECOMMENDATION_LABELS[r]}
              </RadioOption>
            ))}
          </div>
        </RadioGroup>

        <TextField name="observations">
          <Label>Observations</Label>
          <TextArea
            rows={4}
            placeholder="What was offered, what is needed, cautions, best time of day…"
          />
        </TextField>
      </fieldset>

      {/* Navigation */}
      <div className="flex items-center gap-2.5 border-t border-ink-200 pt-4">
        {step > 1 ? (
          <Button type="button" variant="ghost" onPress={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}

        <div className="flex-1" />

        {step < STEPS.length ? (
          <>
            <SubmitButton name="intent" value="draft" variant="secondary" size="sm">
              Save draft
            </SubmitButton>
            <Button type="button" variant="primary" onPress={() => setStep((s) => s + 1)}>
              Next
            </Button>
          </>
        ) : (
          <>
            <SubmitButton name="intent" value="draft" variant="secondary" size="sm">
              Save draft
            </SubmitButton>
            <SubmitButton name="intent" value="submitted" pendingLabel="Submitting…">
              Submit survey
            </SubmitButton>
          </>
        )}
        </div>
      </div>
    </form>
  );
}
