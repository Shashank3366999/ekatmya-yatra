"use client";

/**
 * The opening two minutes of the Ekatma Dham film, playing behind the hero copy.
 *
 * The film runs 7:47 at 86 MB. The site ships only its opening 120 seconds, in
 * two renditions, so a phone never fetches the desktop file:
 *
 *   /video/intro-sm.mp4   640x360   3.2 MB   phones
 *   /video/intro.mp4      960x540   5.3 MB   tablets and laptops
 *
 * Both are faststart (moov before mdat) so playback begins on the first chunk
 * rather than after the whole file. Trimming is what makes this safe: a cap on
 * the playback position does not cap the download — pointing the hero at the
 * full film and looping its opening pulled **64 MB in eight seconds**, because
 * the browser buffers ~44s ahead regardless. A Shankardoot opening this on
 * mobile data in the field would have paid for all of it.
 *
 * Autoplay is still withheld when the viewer prefers reduced motion or is on a
 * metered connection, the poster carries the first paint, and the controls are
 * always visible — motion should never be something a viewer has to endure.
 * Sound starts off, as autoplay requires, and can be turned on: with the film
 * no longer having a section of its own, this is where its narration lives.
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const SRC_WIDE = "/video/intro.mp4";
const SRC_SMALL = "/video/intro-sm.mp4";
const POSTER = "/video/intro-poster.jpg";

/** Where the phone rendition gives way to the larger one. */
const WIDE_FROM = "(min-width: 700px)";

type Reason = "ok" | "reduced-motion" | "metered";

/** Whether it is reasonable to start playing without being asked. */
function autoplayVerdict(): Reason {
  if (typeof window === "undefined") return "metered";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced-motion";
  }

  // Not in every browser; absent means "assume a normal connection".
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;

  if (conn?.saveData) return "metered";
  if (conn?.effectiveType && !/4g|5g/.test(conn.effectiveType)) return "metered";

  return "ok";
}

export function VideoHero({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reason, setReason] = useState<Reason>("metered");

  useEffect(() => {
    const verdict = autoplayVerdict();
    setReason(verdict);
    if (verdict !== "ok") return;

    const v = ref.current;
    if (!v) return;

    v.preload = "auto";
    // A muted play() is allowed without a gesture; a rejection is fine — the
    // poster stays and the button is there.
    v.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;

    if (v.paused) {
      v.preload = "auto";
      v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  /** Unmuting also starts playback, so the button always does something. */
  function toggleSound() {
    const v = ref.current;
    if (!v) return;

    const next = !v.muted;
    v.muted = next;
    setMuted(next);

    if (!next && v.paused) {
      v.preload = "auto";
      v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }

  return (
    <div className={`bg-hero-ink absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={ref}
        className="h-full w-full object-cover"
        poster={POSTER}
        preload="none"
        muted
        loop
        playsInline
        // Decorative: the hero's meaning is in the copy over it.
        aria-hidden="true"
        tabIndex={-1}
      >
        {/* First match wins, so the wide rendition is listed first. */}
        <source src={SRC_WIDE} type="video/mp4" media={WIDE_FROM} />
        <source src={SRC_SMALL} type="video/mp4" />
      </video>

      {/* Scrims, so the copy over the film stays readable on any frame. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-ink-950/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-ink-950/40" />

      {/* The controls sit in the corner, clear of the copy. */}
      <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 sm:right-6 sm:bottom-6">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause the background film" : "Play the background film"}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink-0/25 bg-ink-950/45 px-3.5 text-xs font-medium text-ink-0/80 backdrop-blur-sm transition-colors hover:bg-ink-950/70 hover:text-ink-0"
        >
          {playing ? (
            <>
              <Pause size={13} aria-hidden="true" />
              Pause film
            </>
          ) : (
            <>
              <Play size={13} aria-hidden="true" />
              {reason === "metered" ? "Play film" : "Play"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Turn on the film's sound" : "Mute the film"}
          className="inline-flex size-10 items-center justify-center rounded-full border border-ink-0/25 bg-ink-950/45 text-ink-0/80 backdrop-blur-sm transition-colors hover:bg-ink-950/70 hover:text-ink-0"
        >
          {muted ? (
            <VolumeX size={14} aria-hidden="true" />
          ) : (
            <Volume2 size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
