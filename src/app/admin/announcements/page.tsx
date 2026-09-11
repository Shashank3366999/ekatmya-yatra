import type { Metadata } from "next";
import { Chip } from "@heroui/react";
import { Megaphone } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { PageTitle } from "@/components/ui/page-title";
import { formatDateTime, humanise } from "@/lib/format";
import { listAllAnnouncements, listStates } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

import { AnnouncementForm } from "./announcement-form";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const [announcements, states] = await Promise.all([
    listAllAnnouncements(50),
    listStates(),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Announcements"
        description="Post updates to users and the organising team."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <AnnouncementForm states={states} />
          </div>
        </div>

        <div className="lg:col-span-3">
          {announcements.length === 0 ? (
            <Empty
              icon={Megaphone}
              title="No announcements yet"
              description="Anything you post appears here and in the apps immediately."
            />
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-xl border border-ink-200 bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-display text-base text-ink-900">{a.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Chip size="sm" variant="soft" color="accent">
                        {humanise(a.audience)}
                      </Chip>
                      {!a.isPublished ? (
                        <Chip size="sm" variant="soft">
                          Draft
                        </Chip>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {formatDateTime(a.createdAt)}
                    {a.stateName ? ` · ${a.stateName}` : ""}
                  </p>

                  <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-ink-600">
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
