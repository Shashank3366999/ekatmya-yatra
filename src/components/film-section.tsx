"use client";

/**
 * The full Ekatma Dham film, offered rather than imposed.
 *
 * The file is 86 MB. Nothing loads until someone presses play — `preload="none"`
 * plus a poster frame — and the size is stated next to the button so a viewer on
 * mobile data can decide. The hero's background loop is a separate 0.77 MB cut.
 *
 * For production this wants compressing or a CDN/YouTube embed; see
 * docs/TEAM-QUESTIONS.md Q7.
 */
import { useState } from "react";
import { Clock, Play } from "lucide-react";

const SRC = "/video/ekatma-dham-journey-of-oneness.mp4";
const POSTER = "/video/poster.jpg";
const DURATION = "7 min 48 sec";
const SIZE = "86 MB";

export function FilmSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface">
      <div className="relative aspect-video w-full bg-ink-950">
        {playing ? (
          <video
            className="h-full w-full"
            src={SRC}
            poster={POSTER}
            controls
            autoPlay
            playsInline
            preload="auto"
          />
        ) : (
          <>
            {/* Poster only — the film itself is not fetched yet. */}
            <img
              src={POSTER}
              alt="A still from the Ekatma Dham film"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-ink-950/20" />

            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 grid place-items-center"
              aria-label={`Play the film — ${DURATION}, ${SIZE}`}
            >
              <span className="grid size-16 place-items-center rounded-full bg-pumpkin-500 text-ink-0 shadow-lg transition-transform hover:scale-105 sm:size-20">
                <Play size={26} className="translate-x-0.5 fill-current" aria-hidden="true" />
              </span>
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="font-display text-base text-ink-0 sm:text-lg">
                Ekatma Dham — A Journey of Oneness
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-0/70">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" />
                  {DURATION}
                </span>
                {/* Stated plainly, so nobody on mobile data is ambushed. */}
                <span>{SIZE} — plays only when you choose</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
