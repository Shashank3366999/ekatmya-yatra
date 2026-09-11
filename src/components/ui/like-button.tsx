import { Heart } from "lucide-react";

import { toggleAnnouncementLike } from "@/actions/announcement";

/**
 * Like control for an announcement.
 *
 * A plain form so it works without JavaScript, matching the checklist toggles.
 */
export function LikeButton({
  announcementId,
  count,
  liked,
}: {
  announcementId: string;
  count: number;
  liked: boolean;
}) {
  return (
    <form action={toggleAnnouncementLike}>
      <input type="hidden" name="announcementId" value={announcementId} />
      <button
        type="submit"
        aria-pressed={liked}
        aria-label={liked ? "Remove your like" : "Like this announcement"}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          liked
            ? "border-pumpkin-300 bg-pumpkin-50 text-pumpkin-700"
            : "border-ink-200 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
        }`}
      >
        <Heart
          size={14}
          aria-hidden="true"
          className={liked ? "fill-pumpkin-500 text-pumpkin-500" : undefined}
        />
        <span className="tabular-nums">{count > 0 ? count : ""}</span>
        <span className={count > 0 ? "sr-only" : undefined}>Like</span>
      </button>
    </form>
  );
}
