import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { LikeButton } from "@/components/ui/like-button";
import { PageTitle } from "@/components/ui/page-title";
import { formatDateTime } from "@/lib/format";
import { listAnnouncementsFor } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const announcements = await listAnnouncementsFor(user, 50);

  return (
    <div className="space-y-5">
      <PageTitle title="Announcements" backHref="/home" />

      {announcements.length === 0 ? (
        <Empty
          icon={Megaphone}
          title="Nothing to announce yet"
          description="Updates from the Yatra administration will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-xl border border-ink-200 bg-surface p-4">
              <p className="font-display text-base text-ink-900">{a.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">
                {formatDateTime(a.createdAt)}
                {a.stateName ? ` · ${a.stateName}` : ""}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-ink-600">
                {a.body}
              </p>

              <div className="mt-3.5 border-t border-ink-200 pt-3">
                <LikeButton
                  announcementId={a.id}
                  count={Number(a.likeCount ?? 0)}
                  liked={Boolean(a.likedByMe)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
