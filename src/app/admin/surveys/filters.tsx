"use client";

/**
 * Survey inbox filters.
 *
 * State lives in the URL, not React — so a filtered inbox can be pasted into a
 * message to a colleague, and the CSV export can reuse the same query.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, ListBox, ListBoxItem, Select, TextField } from "@heroui/react";
import { X } from "lucide-react";

import { PLACE_CATEGORY_LABELS, SURVEY_STATUS_LABELS } from "@/lib/labels";
import type { PlaceCategory, SurveyStatus } from "@/lib/types";

type Option = { id: string; name: string };

const STATUSES = Object.keys(SURVEY_STATUS_LABELS) as SurveyStatus[];
const CATEGORIES = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategory[];

export function SurveyFilters({
  states,
  current,
}: {
  states: Option[];
  current: {
    status?: string;
    stateId?: string;
    category?: string;
    proposedFor?: string;
    q?: string;
  };
}) {
  const router = useRouter();
  const params = useSearchParams();

  function apply(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/surveys${next.toString() ? `?${next}` : ""}`);
  }

  const hasFilters = Boolean(
    current.status || current.stateId || current.category || current.proposedFor || current.q,
  );

  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            apply("q", value ? String(value) : null);
          }}
        >
          <TextField name="q" defaultValue={current.q ?? ""}>
            <Label>Search place</Label>
            <Input placeholder="Place name…" />
          </TextField>
        </form>

        <Select
          selectedKey={current.status ?? "all"}
          onSelectionChange={(k) => apply("status", k === "all" ? null : String(k))}
        >
          <Label>Status</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="all">All statuses</ListBoxItem>
              {STATUSES.map((s) => (
                <ListBoxItem key={s} id={s}>
                  {SURVEY_STATUS_LABELS[s]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={current.stateId ?? "all"}
          onSelectionChange={(k) => apply("stateId", k === "all" ? null : String(k))}
        >
          <Label>State</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="all">All states</ListBoxItem>
              {states.map((s) => (
                <ListBoxItem key={s.id} id={s.id}>
                  {s.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={current.category ?? "all"}
          onSelectionChange={(k) => apply("category", k === "all" ? null : String(k))}
        >
          <Label>Type</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="all">All types</ListBoxItem>
              {CATEGORIES.map((c) => (
                <ListBoxItem key={c} id={c}>
                  {PLACE_CATEGORY_LABELS[c]}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={current.proposedFor ?? "all"}
          onSelectionChange={(k) => apply("proposedFor", k === "all" ? null : String(k))}
        >
          <Label>Proposed for</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="all">Main & Sub</ListBoxItem>
              <ListBoxItem id="main">Main Yatra</ListBoxItem>
              <ListBoxItem id="sub">Sub-Yatra</ListBoxItem>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onPress={() => router.push("/admin/surveys")}
        >
          <X size={14} aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
