import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { formatDateTime } from "@/lib/format";
import { listUpcomingEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await listUpcomingEvents(50);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Events & activities"
        description="Gatherings, discourses and programmes along the Yatra."
      />

      {events.length === 0 ? (
        <Empty
          icon={CalendarDays}
          title="No events published yet"
          description="Events appear here as the Yatra schedule is confirmed by the committee."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
              <div className="flex items-stretch">
                {/* Date rail */}
                <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-pumpkin-500 py-4 text-ink-900">
                  <span className="text-xl font-semibold tabular-nums leading-none">
                    {new Date(e.startsAt).getDate()}
                  </span>
                  <span className="mt-1 text-[10px] tracking-wide uppercase opacity-85">
                    {new Date(e.startsAt).toLocaleDateString("en-IN", {
                      month: "short",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                </div>

                <div className="min-w-0 flex-1 p-4">
                  <p className="font-display text-base leading-tight text-ink-900">
                    {e.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <MapPin size={12} aria-hidden="true" />
                    {[e.placeName, e.stateName].filter(Boolean).join(", ") ||
                      "Venue to be announced"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {formatDateTime(e.startsAt)}
                  </p>
                  {e.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {e.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
