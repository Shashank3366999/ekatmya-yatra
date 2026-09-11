import type { Metadata } from "next";
import { Alert, Chip } from "@heroui/react";

import { IndiaMap, MapLegend } from "@/components/india-map";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate } from "@/lib/format";
import { PLACE_CATEGORY_LABELS } from "@/lib/labels";
import { listRoutePlaces } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Yatra route" };

/**
 * Route overview. Read-only in this release: approving a survey is how places
 * join the route (see the survey review panel). Full reordering and date editing
 * is Phase 5 — see docs/ARCHITECTURE.md.
 */
export default async function AdminRoutePage() {
  await requireAdmin();
  const route = await listRoutePlaces();

  // Places approved from surveys join the route without a position, so they are
  // listed separately rather than silently tacked on after Kedarnath.
  const sequenced = route.filter((p) => p.routeOrder !== null);
  const unsequenced = route.filter((p) => p.routeOrder === null);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Yatra route"
        description="The Main Yatra spine, Kalady to Kedarnath."
      />

      <Alert status="accent">
        <Alert.Content>
          <Alert.Title>How places join the route</Alert.Title>
          <Alert.Description>
            Approve a survey entry and choose “Add to the Yatra route”. It joins
            the route without a position and appears under “Awaiting sequencing”
            below. Placing stops in order and setting arrival dates comes in the
            next phase — the route below is a researched starting point, not the
            confirmed itinerary.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-ink-200 bg-surface p-4 lg:sticky lg:top-6">
            <IndiaMap
              places={route.map((p) => ({
                id: p.id,
                name: p.name,
                latitude: p.latitude,
                longitude: p.longitude,
                routeOrder: p.routeOrder,
                stateName: p.stateName,
                kind: "main" as const,
              }))}
              className="mx-auto max-h-[30rem] w-full max-w-sm"
            />
            <MapLegend className="mt-3 justify-center" />
          </div>
        </div>

        <div className="lg:col-span-3">
          <ol className="space-y-2.5">
            {sequenced.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-3.5 rounded-xl border border-ink-200 bg-surface p-4"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-xs font-semibold text-ink-0">
                  {p.routeOrder}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-base text-ink-900">{p.name}</p>
                    <span className="text-xs text-ink-500">
                      {p.expectedArrival ? formatDate(p.expectedArrival) : "date TBC"}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-ink-500">
                    {[p.districtName, p.stateName].filter(Boolean).join(", ")}
                  </p>

                  <Chip size="sm" variant="soft" className="mt-2">
                    {PLACE_CATEGORY_LABELS[p.category]}
                  </Chip>

                  {p.significance ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {p.significance}
                    </p>
                  ) : null}

                  {p.latitude === null || p.longitude === null ? (
                    <p className="mt-2 text-[11px] text-pumpkin-700">
                      No coordinates — will not appear as a map marker.
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {unsequenced.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-1 font-display text-lg text-ink-900">
                Awaiting sequencing
              </h2>
              <p className="mb-2.5 text-xs leading-relaxed text-ink-500">
                Approved from survey entries. These are part of the Yatra but do
                not yet have a position in the itinerary.
              </p>

              <ul className="space-y-2.5">
                {unsequenced.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-3.5 rounded-xl border border-dashed border-pumpkin-200 bg-pumpkin-50/40 p-4"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-xs font-semibold text-ink-0">
                      ?
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base text-ink-900">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {[p.districtName, p.stateName].filter(Boolean).join(", ")}
                      </p>
                      <Chip size="sm" variant="soft" className="mt-2">
                        {PLACE_CATEGORY_LABELS[p.category]}
                      </Chip>
                      {p.significance ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">
                          {p.significance}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
