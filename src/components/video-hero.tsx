"use client";

/**
 * The opening two minutes of the Ekatma Dham film, playing behind the hero copy.
 *
 * The film runs 7:47 at 86 MB. The site ships only its opening 120 seconds, in
 * two renditions, so a phone never fetches the desktop file:
 *
 *   /video/intro-sm.mp4   640x360   2.5 MB   phones
 *   /video/intro.mp4      960x540   4.6 MB   tablets and laptops
 *
 * Both are faststart (moov before mdat) so playback begins on the first chunk
 * rather than after the whole file, and both are silent — there is no control
 * to unmute, so an audio track would be bytes nobody can hear.
 *
 * Trimming is what makes this safe: a cap on the playback position does not cap
 * the download — pointing the hero at the full film and looping its opening
 * pulled **64 MB in eight seconds**, because the browser buffers ~44s ahead
 * regardless. A Shankardoot opening this on mobile data in the field would have
 * paid for all of it.
 *
 * There are deliberately no controls over the film: it is wallpaper, and the
 * copy is the content. Autoplay is therefore the only thing to get right, and
 * it is withheld when the viewer prefers reduced motion or is on a metered
 * connection — in which case nothing is fetched at all and the poster stands in.
 */
import { useEffect, useRef } from "react";

const SRC_WIDE = "/video/intro.mp4";
const SRC_SMALL = "/video/intro-sm.mp4";
const POSTER = "/video/intro-poster.jpg";

/** Where the phone rendition gives way to the larger one. */
const WIDE_FROM = "(min-width: 700px)";

/** Whether it is reasonable to start playing without being asked. */
function mayAutoplay(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  // Not in every browser; absent means "assume a normal connection".
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;

  if (conn?.saveData) return false;
  if (conn?.effectiveType && !/4g|5g/.test(conn.effectiveType)) return false;

  return true;
}

export function VideoHero({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!mayAutoplay()) return;

    const v = ref.current;
    if (!v) return;

    v.preload = "auto";
    // A muted play() is allowed without a gesture; a rejection is fine, the
    // poster simply stays.
    void v.play().catch(() => {});
  }, []);

  return (
    <div className={`bg-hero-ink absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={ref}
        /*
          Brightened and warmed a little. The knockout headline shows whatever
          the film is, and nothing inside a `multiply` group can be brighter
          than its backdrop — white type multiplies by 1 and no more. So the
          only way to make the letters read is to light the film itself; the
          plate behind the headline still crushes everything around them.
        */
        className="h-full w-full object-cover brightness-[2.2] contrast-[1.12] saturate-[1.2]"
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

      {/*
        Scrims, so the copy over the film stays readable on any frame.

        The two stack, so what the viewer sees of the film is the product of both
        transmissions, not either alone. These values pass 10% more light than
        the first pass did: each layer's (1 - alpha) was multiplied by sqrt(1.1),
        which compounds to exactly +10% across the pair. The top-left corner is
        the one exception — 0.90 scaled rounds back to itself, so it is set a
        point lighter by hand.
      */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/42 to-ink-950/2" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/86 via-ink-950/9 to-ink-950/22" />
    </div>
  );
}
