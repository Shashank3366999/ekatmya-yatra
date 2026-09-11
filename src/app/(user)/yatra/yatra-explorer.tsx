"use client";

/**
 * Map + itinerary, linked selection.
 *
 * They answer different questions — the map answers "where does this go across
 * Bharat", the list answers "when does it reach my place" — so both are always
 * present: stacked on a phone, side by side with the map pinned on a laptop.
 * Choosing a marker scrolls the itinerary to that stop.
 */
import { useRef, useState } from "react";
import Image from "next/image";
import { Chip } from "@heroui/react";
import { CalendarDays, Check, MapPin, Plus } from "lucide-react";

import { toggleJourneyPlace } from "@/actions/journey";
import { IndiaMap, MapLegend } from "@/components/india-map";
import { formatDate, humanise } from "@/lib/format";
import { PLACE_CATEGORY_LABELS } from "@/lib/labels";
import type { PlaceCategory } from "@/lib/types";

type Heritage = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  stateName: string | null;
  significance: string | null;
  isBeyondReach: boolean;
};

type Place = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  routeOrder: number | null;
  stateName: string | null;
  districtName: string | null;
  category: PlaceCategory;
  significance: string | null;
  imageUrl: string | null;
  expectedArrival: string | null;
};

export function YatraExplorer({
  places,
  heritage,
  journeyIds,
}: {
  places: Place[];
  heritage: Heritage[];
  journeyIds: string[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const inJourney = new Set(journeyIds);

  function handleSelect(id: string) {
    setSelectedId(id);
    itemRefs.current[id]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const selected = places.find((p) => p.id === selectedId) ?? null;
  const selectedHeritage = selected
    ? null
    : (heritage.find((h) => h.id === selectedId) ?? null);

  const map = (
    <div className="rounded-xl border border-ink-200 bg-surface p-3 sm:p-5">
      <IndiaMap
        places={[
          /*
            The sites Adi Shankaracharya sanctified are drawn beneath the 2027
            route. The Yatra team's point: the itinerary is only part of the
            story, and the map should carry the whole Digvijaya Yatra.
          */
          ...heritage.map((h) => ({
            id: h.id,
            name: h.name,
            latitude: h.latitude,
            longitude: h.longitude,
            routeOrder: null,
            stateName: h.stateName,
            kind: h.isBeyondReach
              ? ("beyondReach" as const)
              : ("heritage" as const),
          })),
          ...places.map((p) => ({ ...p, kind: "main" as const })),
        ]}
        selectedId={selectedId}
        onSelect={handleSelect}
        className="mx-auto max-h-[30rem] w-full max-w-md"
      />
      <MapLegend className="mt-3 justify-center" />
      <p className="mt-2 text-center text-[11px] text-ink-400">
        Tap a marker to see the place.
      </p>
    </div>
  );

  const detail = selected ? (
    <div className="mt-3 rounded-xl border border-ink-200 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base text-ink-900">{selected.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {[selected.districtName, selected.stateName].filter(Boolean).join(", ")}
          </p>
        </div>
        {selected.routeOrder ? (
          <Chip size="sm" variant="soft" color="accent">
            Stop {selected.routeOrder}
          </Chip>
        ) : null}
      </div>
      {selected.imageUrl ? (
        <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-lg bg-ink-100">
          <Image
            src={selected.imageUrl}
            alt={selected.name}
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover"
          />
        </div>
      ) : null}
      {selected.significance ? (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
          {selected.significance}
        </p>
      ) : null}
      <JourneyToggle placeId={selected.id} isAdded={inJourney.has(selected.id)} />
    </div>
  ) : selectedHeritage ? (
    <div className="mt-3 rounded-xl border border-gold/40 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base text-ink-900">
            {selectedHeritage.name}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{selectedHeritage.stateName}</p>
        </div>
        <Chip size="sm" variant="soft" color={selectedHeritage.isBeyondReach ? "warning" : "default"}>
          {selectedHeritage.isBeyondReach ? "Beyond reach" : "Acharya Shankar site"}
        </Chip>
      </div>
      {selectedHeritage.significance ? (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
          {selectedHeritage.significance}
        </p>
      ) : null}
      <p className="mt-2.5 text-[11px] text-ink-400">
        Not a halt on the 2027 itinerary.
      </p>
    </div>
  ) : null;

  const itinerary = (
    <ol className="space-y-2.5">
      {places.map((p) => (
        <li
          key={p.id}
          ref={(el) => {
            itemRefs.current[p.id] = el;
          }}
          className={`rounded-xl border bg-surface p-4 transition-colors ${
            selectedId === p.id ? "border-pumpkin-500" : "border-ink-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="shrink-0">
              <span
                className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${
                  p.routeOrder
                    ? "bg-pumpkin-500 text-ink-0"
                    : "bg-pumpkin-100 text-pumpkin-700"
                }`}
              >
                {p.routeOrder ?? "?"}
              </span>

              {p.imageUrl ? (
                <div className="relative mt-2.5 size-16 overflow-hidden rounded-lg bg-ink-100">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-base leading-tight text-ink-900">
                {p.name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {[p.districtName, p.stateName].filter(Boolean).join(", ")}
                </span>
                {p.expectedArrival ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} aria-hidden="true" />
                    {formatDate(p.expectedArrival)}
                  </span>
                ) : null}
              </p>

              <Chip size="sm" variant="soft" className="mt-2">
                {PLACE_CATEGORY_LABELS[p.category] ?? humanise(p.category)}
              </Chip>

              {p.significance ? (
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                  {p.significance}
                </p>
              ) : null}

              <JourneyToggle placeId={p.id} isAdded={inJourney.has(p.id)} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );

  return (
    /*
      One layout, one map. An earlier version showed tabs on a phone and a
      side-by-side grid on a laptop, which meant rendering the whole map twice
      into the DOM — ~18 KB of path data and a second set of animations for a
      copy that was always hidden. Stacking instead gives the map the top of the
      screen on a phone and pins it beside the itinerary on a laptop.
    */
    <div className="space-y-6">
      <div>
        <div>
          {map}
          {detail}
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 font-display text-lg text-ink-900">Itinerary</h2>
        {itinerary}
      </div>
    </div>
  );
}

/** Add/remove this place from "My Journey". */
function JourneyToggle({ placeId, isAdded }: { placeId: string; isAdded: boolean }) {
  return (
    <form action={toggleJourneyPlace} className="mt-3">
      <input type="hidden" name="placeId" value={placeId} />
      <button
        type="submit"
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3.5 text-xs font-medium transition-colors ${
          isAdded
            ? "border-pumpkin-500 bg-pumpkin-50 text-pumpkin-700"
            : "border-ink-300 bg-surface text-ink-600 hover:bg-ink-50"
        }`}
      >
        {isAdded ? (
          <>
            <Check size={13} aria-hidden="true" />
            In my journey
          </>
        ) : (
          <>
            <Plus size={13} aria-hidden="true" />
            Add to my journey
          </>
        )}
      </button>
    </form>
  );
}
