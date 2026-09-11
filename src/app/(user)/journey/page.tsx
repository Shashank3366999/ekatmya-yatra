import type { Metadata } from "next";
import Image from "next/image";
import { Route } from "lucide-react";

import { toggleJourneyPlace } from "@/actions/journey";
import { IndiaMap } from "@/components/india-map";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate } from "@/lib/format";
import { listJourneyPlaces } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My Journey" };

export default async function JourneyPage() {
  const user = await requireUser();
  const places = await listJourneyPlaces(user.id);

  return (
    <div className="space-y-5">
      <PageTitle
        title="My Journey"
        description="The places you intend to join the Yatra at."
      />

      {places.length === 0 ? (
        <Empty
          icon={Route}
          title="Your journey is empty"
          description="Explore the Yatra route and add the places you would like to be part of."
          action={<LinkButton href="/yatra" size="sm">Explore the route</LinkButton>}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-ink-200 bg-surface p-3 sm:p-5">
            <IndiaMap
              places={places.map((p) => ({
                id: p.id,
                name: p.name,
                latitude: p.latitude,
                longitude: p.longitude,
                routeOrder: p.routeOrder,
                stateName: p.stateName,
                kind: "main" as const,
              }))}
              showRouteLine={places.length > 1}
              className="mx-auto max-h-[24rem] w-full max-w-sm"
            />
          </div>

          <div>
            <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
              {places.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  {p.imageUrl ? (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-xs font-semibold text-ink-0">
                    {p.routeOrder ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-500">
                      {p.stateName}
                      {p.expectedArrival ? ` · ${formatDate(p.expectedArrival)}` : ""}
                    </p>
                  </div>
                  <form action={toggleJourneyPlace}>
                    <input type="hidden" name="placeId" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
              Arrival dates are provisional. The Yatra team will confirm the final
              schedule closer to the date.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
