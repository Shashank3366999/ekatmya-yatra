"use client";

/**
 * The Ekatma Dham film, playing behind the hero copy.
 *
 * It plays an 18-second, 960x540, 0.77 MB loop cut from the full film — not the
 * film itself, which is 86 MB.
 *
 * That distinction was measured, not assumed. Pointing the hero at the full file
 * and looping only its opening pulled **64 MB in the first eight seconds**: a
 * playback cap does not limit the download, because the browser buffers ~44s
 * ahead regardless. A Shankardoot opening this on mobile data in the field
 * would have paid for all of it.
 *
 * The loop was encoded from the source with Chrome's MediaRecorder (see the note
 * in docs/ARCHITECTURE.md); the full film belongs in its own section where
 * someone chooses to watch it.
 *
 * Autoplay is still withheld when the viewer prefers reduced motion or is on a
 * metered connection, the poster carries the first paint, and there is always a
 * visible control — motion should never be something a viewer has to endure.
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** The short loop cut for this purpose — not the 86 MB film. */
const SRC = "/video/hero-loop.mp4";
const POSTER = "/video/poster.jpg";

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
        <source src={SRC} type="video/mp4" />
      </video>

      {/* Scrims, so the copy over the film stays readable on any frame. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-ink-950/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-ink-950/40" />

      {/* The control sits in the corner, clear of the copy. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause the background film" : "Play the background film"}
        className="absolute right-4 bottom-4 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-ink-0/25 bg-ink-950/45 px-3.5 text-xs font-medium text-ink-0/80 backdrop-blur-sm transition-colors hover:bg-ink-950/70 hover:text-ink-0 sm:right-6 sm:bottom-6"
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
    </div>
  );
}
