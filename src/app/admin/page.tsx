import type { Metadata } from "next";
import { Chip } from "@heroui/react";
import {
  CalendarDays,
  ClipboardList,
  MapPinned,
  Route,
  UserCheck,
  Users,
} from "lucide-react";

import { AccentRule, ThemeBanner } from "@/components/brand";
import { IndiaMap, MapLegend } from "@/components/india-map";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { StatCard } from "@/components/ui/stat-card";
import { SurveyStatusChip } from "@/components/ui/status-chip";
import { formatRelative } from "@/lib/format";
import { LEVEL_LABELS } from "@/lib/permissions";
import {
  adminOverview,
  listOrganizerProfiles,
  listRoutePlaces,
  listSurveyedPlacesForMap,
  listSurveys,
  surveyStatusCounts,
} from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const [overview, counts, recentSurveys, pendingOrganizers, route, surveyed] =
    await Promise.all([
      adminOverview(),
      surveyStatusCounts(admin),
      listSurveys(admin, {}, 6),
      listOrganizerProfiles("pending", 5),
      listRoutePlaces(),
      listSurveyedPlacesForMap(admin, 300),
    ]);

  const awaiting = (counts.byStatus.submitted ?? 0) + (counts.byStatus.under_review ?? 0);

  return (
    <div className="space-y-7">
      {/* Themed banner: gateways, echoing the mark. The statue photograph is
          reserved for the public landing hero. */}
      <ThemeBanner motif="arches" className="h-32 rounded-2xl sm:h-40">
        <div className="flex h-full flex-col justify-center p-5 sm:p-7 lg:p-8">
          <h1 className="font-display text-2xl text-ink-0 sm:text-3xl">
            Ekatma Yatra
          </h1>
          <p className="mt-1 text-sm text-ink-0/75">
            One Journey. One Consciousness.
          </p>
        </div>
      </ThemeBanner>

      {/* Numbers */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Registered users" value={overview.users} icon={Users} />
        <StatCard
          label="Organisers"
          value={overview.organizers}
          hint="approved"
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Awaiting approval"
          value={overview.pendingOrganizers}
          hint={overview.pendingOrganizers ? "needs your attention" : "all clear"}
          icon={ClipboardList}
          tone={overview.pendingOrganizers ? "warning" : "default"}
        />
        <StatCard
          label="Survey entries"
          value={overview.surveys}
          hint={`${awaiting} to review`}
          icon={MapPinned}
          tone="accent"
        />
        <StatCard
          label="Route stops"
          value={overview.routeStops}
          hint={
            overview.routeUnsequenced
              ? `+${overview.routeUnsequenced} awaiting sequencing`
              : "all sequenced"
          }
          icon={Route}
        />
        <StatCard
          label="Upcoming events"
          value={overview.upcomingEvents}
          icon={CalendarDays}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Map */}
        <section className="lg:col-span-3">
          <div className="mb-2.5 flex items-end justify-between">
            <h2 className="font-display text-lg text-ink-900">Yatra route overview</h2>
            <LinkButton href="/admin/route" variant="ghost" size="sm">
              Manage route
            </LinkButton>
          </div>

          <div className="rounded-xl border border-ink-200 bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <IndiaMap
                places={[
                  ...route.map((p) => ({
                    id: p.id,
                    name: p.name,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    routeOrder: p.routeOrder,
                    stateName: p.stateName,
                    kind: "main" as const,
                  })),
                  ...surveyed.map((p) => ({
                    id: p.id,
                    name: p.name,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    routeOrder: null,
                    stateName: p.stateName,
                    kind: "survey" as const,
                  })),
                ]}
                className="mx-auto max-h-[28rem] w-full max-w-sm"
              />

              {/* Itinerary rail */}
              <ol className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
                {route.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 text-xs">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-[9px] font-semibold text-ink-900">
                      {p.routeOrder}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink-700">{p.name}</span>
                  </li>
                ))}
              </ol>
            </div>

            <MapLegend className="mt-3" />
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pending approvals */}
          <section>
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="font-display text-lg text-ink-900">Awaiting approval</h2>
              <LinkButton href="/admin/organizers" variant="ghost" size="sm">
                View all
              </LinkButton>
            </div>

            {pendingOrganizers.length === 0 ? (
              <Empty
                icon={UserCheck}
                title="No pending requests"
                description="New organiser registrations will appear here."
              />
            ) : (
              <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
                {pendingOrganizers.map((o) => (
                  <li key={o.profileId} className="px-4 py-3">
                    <p className="text-sm font-medium text-ink-900">{o.fullName}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {LEVEL_LABELS[o.level]}
                      {o.districtName || o.stateName
                        ? ` · ${o.districtName ?? o.stateName}`
                        : ""}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Chip size="sm" variant="soft" color="warning">
                        Pending
                      </Chip>
                      <span className="text-[11px] text-ink-500">
                        {formatRelative(o.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent surveys */}
          <section>
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="font-display text-lg text-ink-900">Latest surveys</h2>
              <LinkButton href="/admin/surveys" variant="ghost" size="sm">
                Inbox
              </LinkButton>
            </div>

            {recentSurveys.length === 0 ? (
              <Empty
                icon={MapPinned}
                title="No survey entries yet"
                description="Entries filed by survey teams appear here as soon as they submit."
              />
            ) : (
              <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
                {recentSurveys.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`/admin/surveys/${s.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 active:bg-ink-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">
                          {s.placeName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {[s.districtName, s.stateName].filter(Boolean).join(", ")} ·{" "}
                          {s.submittedByName ?? "Unknown"}
                        </p>
                      </div>
                      <SurveyStatusChip status={s.status} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <AccentRule />

      <p className="text-center text-[11px] leading-relaxed text-ink-500">
        Yatra dates, route and organisational terminology are provisional pending
        confirmation by the Yatra committee.
      </p>
    </div>
  );
}
