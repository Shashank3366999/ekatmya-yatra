import type { Metadata } from "next";
import { Card } from "@heroui/react";
import { CalendarDays, HandHeart, MapPin, Megaphone } from "lucide-react";

import { AccentRule, ThemeBanner } from "@/components/brand";
import { BharatWatermark } from "@/components/bharat-watermark";
import { IndiaMap, MapLegend } from "@/components/india-map";
import { LikeButton } from "@/components/ui/like-button";
import { LinkButton } from "@/components/ui/link-button";
import { formatDate, formatDateShort } from "@/lib/format";
import {
  listAnnouncementsFor,
  listRoutePlaces,
  listUpcomingEvents,
} from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default async function UserHomePage() {
  const user = await getSessionUser();

  const [route, events, announcements] = await Promise.all([
    listRoutePlaces(),
    listUpcomingEvents(5),
    listAnnouncementsFor(user, 4),
  ]);

  // Start, end and the stop count all come from the sequenced spine. Places
  // approved from a survey join the route without a position, and counting
  // those in "stops" made this page disagree with itself.
  const sequenced = route.filter((p) => p.routeOrder !== null);
  const first = sequenced[0];
  const last = sequenced[sequenced.length - 1];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/*
        Themed banner rather than the statue photograph, which belongs to the
        landing hero. Bharat's own outline is the watermark here — it costs
        nothing on this screen, which already loads the map's path data.
      */}
      <ThemeBanner motif="journey" className="h-40 rounded-2xl sm:h-48 lg:h-56">
        <BharatWatermark className="pointer-events-none absolute -top-8 right-6 h-[190%] text-pumpkin-300/20 sm:right-12" />

        <div className="relative flex h-full flex-col justify-center p-5 sm:p-7">
          <p className="font-display text-2xl leading-snug text-ink-0 lg:text-3xl">
            Ekatma Yatra
          </p>
          <p className="mt-1 text-sm text-ink-0/75">One Journey. One Consciousness.</p>
          {first && last ? (
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink-0/60">
              {first.name} → {last.name} · {sequenced.length} stops
            </p>
          ) : null}
        </div>
      </ThemeBanner>

      {/* Intro + at-a-glance */}
      <section className="rounded-xl border border-ink-200 bg-surface p-4 sm:p-6">
        <div>
          <p className="max-w-prose flex-1 text-sm leading-relaxed text-ink-600 sm:text-base">
            A Bharat Yatra for oneness, in the footsteps of{" "}
            <strong className="font-medium text-ink-900">Adi Shankaracharya</strong>,
            travelling the places he journeyed to, and connecting them as one.
          </p>

          <AccentRule className="my-4 lg:hidden" />

          <dl className="grid shrink-0 grid-cols-3 gap-4 text-center lg:border-ink-200">
            <div>
              <dt className="text-[10px] tracking-wide text-ink-500 uppercase">Begins</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900">
                {first?.expectedArrival ? formatDateShort(first.expectedArrival) : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-wide text-ink-500 uppercase">Stops</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900">
                {sequenced.length}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-wide text-ink-500 uppercase">Concludes</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900">
                {last?.expectedArrival ? formatDateShort(last.expectedArrival) : "Not set"}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-ink-500">
          Dates are provisional and subject to confirmation by the Yatra committee.
        </p>
      </section>

      {/* Map + side rail. One column on a phone, two from lg. */}
      <div className="space-y-6">
        <section>
          <div className="mb-2.5 flex items-end justify-between">
            <h2 className="font-display text-lg text-ink-900">The route</h2>
            <LinkButton href="/yatra" variant="ghost" size="sm">
              Explore
            </LinkButton>
          </div>

          <div className="rounded-xl border border-ink-200 bg-surface p-3 sm:p-5">
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
              className="mx-auto max-h-[26rem] w-full max-w-sm"
            />
            <MapLegend className="mt-3 justify-center" />
          </div>
        </section>

        <div className="space-y-6">
          {/* Upcoming events */}
          <section>
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="font-display text-lg text-ink-900">Upcoming events</h2>
              <LinkButton href="/events" variant="ghost" size="sm">
                View all
              </LinkButton>
            </div>

            {events.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
                Events will be published as the Yatra schedule is confirmed.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-ink-200 bg-surface p-3.5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-pumpkin-50 text-center">
                        <span className="text-base font-semibold tabular-nums leading-none text-pumpkin-700">
                          {new Date(e.startsAt).getDate()}
                        </span>
                        <span className="text-[9px] tracking-wide text-pumpkin-700 uppercase">
                          {new Date(e.startsAt).toLocaleDateString("en-IN", {
                            month: "short",
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900">{e.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                          <MapPin size={12} aria-hidden="true" />
                          {[e.placeName, e.stateName].filter(Boolean).join(", ") ||
                            "Venue to be announced"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Announcements */}
          {announcements.length > 0 ? (
            <section>
              <h2 className="mb-2.5 font-display text-lg text-ink-900">Announcements</h2>
              <ul className="space-y-2.5">
                {announcements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-ink-200 bg-surface p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-pumpkin-50 text-pumpkin-700">
                        <Megaphone size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900">{a.title}</p>
                        <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-ink-500">
                          {a.body}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-500">
                          {formatDate(a.createdAt)}
                        </p>
                        <div className="mt-2">
                          <LikeButton
                            announcementId={a.id}
                            count={Number(a.likeCount ?? 0)}
                            liked={Boolean(a.likedByMe)}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Volunteer call to action */}
          <Card variant="secondary">
            {/* Card.Content is flex-column by default, so the row is explicit. */}
            <Card.Content className="flex flex-row items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pumpkin-500 text-ink-900">
                <HandHeart size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">
                  Be a part of the Yatra
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  Offer your time for survey, outreach, logistics and more. Your
                  contribution matters.
                </p>
                <LinkButton href="/join" size="sm" className="mt-3">
                  <CalendarDays size={15} aria-hidden="true" />
                  Request to contribute
                </LinkButton>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
