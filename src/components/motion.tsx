"use client";

/**
 * Scroll and count animations for the public pages.
 *
 * Two rules shape all of this:
 *
 * 1. Content is never hidden behind JavaScript. Everything renders visible on
 *    the server; the animation is layered on after mount. An element already in
 *    view when it mounts is marked shown immediately, so above-the-fold copy
 *    never flashes.
 * 2. Reduced motion wins. The global rule in globals.css collapses every
 *    duration, and the counters check the media query directly.
 */
import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Fade-and-rise as the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "out" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setState("in");
      return;
    }

    // Already on screen at mount: show it at once rather than animating in
    // from nothing, which would read as a flash.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.92) {
      setState("in");
      return;
    }

    setState("out");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          /*
            Reveal when the element enters view OR when the viewport has
            already moved past it. A jump — End, an anchor link, or the browser
            restoring a scroll position — can skip intersection entirely, and
            without the second condition those sections stayed invisible.
          */
          const passed = e.boundingClientRect.top < window.innerHeight;
          if (e.isIntersecting || passed) {
            setState("in");
            io.disconnect();
          }
        }
      },
      {
        /*
          The top margin expands the root far upward, so an element that the
          viewport has already scrolled past still counts as intersecting.
          Without it, a jump to the bottom of the page fires no callback at all
          (the element goes from "not intersecting" below to "not intersecting"
          above) and those sections stayed invisible. The bottom margin keeps
          the "wait until it is genuinely in view" behaviour on the way down.
        */
        rootMargin: "100000px 0px -8% 0px",
        threshold: 0,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      data-reveal={state === "idle" ? undefined : state}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to `value` the first time it is seen.
 *
 * The final number is rendered on the server, so it is correct without
 * JavaScript and for anyone who prefers less motion.
 */
export function CountUp({
  value,
  duration = 1100,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    if (prefersReducedMotion() || value <= 0) {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || started.current) continue;
        started.current = true;
        io.disconnect();

        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          // Ease out, so it decelerates onto the final figure.
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
          else setDisplay(value);
        };
        setDisplay(0);
        requestAnimationFrame(tick);
      }
    });

    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}

/**
 * Live countdown to the Yatra.
 *
 * Renders nothing until mounted: a server-rendered "days remaining" would be
 * stale the moment it was sent, and would mismatch on hydration.
 */
export function Countdown({
  target,
  ground = "dark",
}: {
  target: string;
  /**
   * The ground it sits on, not the colour of its type. The first version was
   * written for the dark hero and hard-coded white digits, so dropping it onto
   * a light card rendered an empty box — the numbers were there, in white, on
   * cream. Naming the prop after the background is what stops that recurring.
   */
  ground?: "dark" | "light";
}) {
  const [parts, setParts] = useState<
    { days: number; hours: number; minutes: number; seconds: number } | null
  >(null);

  useEffect(() => {
    const when = new Date(target).getTime();

    const compute = () => {
      const left = when - Date.now();
      if (left <= 0) {
        setParts({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setParts({
        days: Math.floor(left / 86_400_000),
        hours: Math.floor((left / 3_600_000) % 24),
        minutes: Math.floor((left / 60_000) % 60),
        seconds: Math.floor((left / 1000) % 60),
      });
    };

    compute();
    const id = window.setInterval(compute, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!parts) {
    // Reserve the same space so the layout does not jump on hydration.
    return <div className="h-[4.5rem]" aria-hidden="true" />;
  }

  const shell =
    ground === "dark" ? "border-ink-0/15 bg-ink-0/8" : "border-pumpkin-200 bg-ink-0/80";
  const digit = ground === "dark" ? "text-ink-0" : "text-ink-900";
  const caption = ground === "dark" ? "text-ink-0/60" : "text-ink-500";

  const cells = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Minutes", value: parts.minutes },
    { label: "Seconds", value: parts.seconds },
  ];

  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-live="off">
      {cells.map((c) => (
        <div
          key={c.label}
          className={`min-w-14 flex-1 rounded-xl border px-2 py-2 text-center backdrop-blur-sm sm:min-w-16 sm:px-3 ${shell}`}
        >
          <div className={`text-xl font-semibold tabular-nums sm:text-2xl ${digit}`}>
            {String(c.value).padStart(2, "0")}
          </div>
          <div className={`mt-0.5 text-[9px] tracking-wider uppercase sm:text-[10px] ${caption}`}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A slow, continuous ribbon of place names — the breadth of the journey, moving.
 * Duplicated once so the loop is seamless; the copy is hidden from assistive
 * tech to avoid reading everything twice.
 */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="marquee relative overflow-hidden" aria-label="Sacred sites of the journey">
      <div className="marquee__track flex w-max gap-3 py-1">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1}>
            {items.map((name) => (
              <span
                key={`${copy}-${name}`}
                className="rounded-full border border-pumpkin-200/70 bg-ink-0/70 px-3.5 py-1.5 text-xs whitespace-nowrap text-ink-600"
              >
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>
      {/* Fade the ribbon into the page at both ends. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-pumpkin-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-pumpkin-50 to-transparent" />
    </div>
  );
}

/** Gentle parallax: shifts a hero layer as the page scrolls. */
export function Parallax({
  children,
  strength = 0.18,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Only worth doing while the hero is anywhere near the viewport.
        const y = window.scrollY;
        if (y > window.innerHeight * 1.5) return;
        el.style.transform = `translate3d(0, ${(y * strength).toFixed(1)}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Landing-page set pieces                                                    */
/* -------------------------------------------------------------------------- */

/** A thin pumpkin bar across the top showing how far down the page you are. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      aria-hidden="true"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-pumpkin-500"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/**
 * The four Mahavakyas, cycling slowly.
 *
 * These are the great sayings at the heart of Advaita — the philosophy the
 * Yatra carries — so the rotation is deliberately unhurried and the type is
 * given room. All four are rendered; only one is visible at a time, so the text
 * is present for search engines and screen readers without JavaScript.
 */
export function QuoteRotator({
  quotes,
  interval = 6500,
}: {
  quotes: { sanskrit: string; translation: string; source: string }[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(true);
    if (quotes.length < 2 || prefersReducedMotion()) return;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % quotes.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [quotes.length, interval]);

  return (
    <div className="relative">
      {/* Reserve the tallest quote's height so the section never jumps. */}
      <div className="grid">
        {quotes.map((q, i) => (
          <figure
            key={q.sanskrit}
            className={`quote col-start-1 row-start-1 text-center transition-opacity duration-700 ${
              live && i !== index ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden={live && i !== index}
          >
            <blockquote
              lang="sa"
              className="font-display text-2xl leading-snug text-ink-0 sm:text-3xl lg:text-4xl"
            >
              {q.sanskrit}
            </blockquote>
            <figcaption className="mt-4 text-sm text-ink-0/70 sm:text-base">
              “{q.translation}”
              <span className="mt-1 block text-[11px] tracking-wide text-pumpkin-400 uppercase">
                {q.source}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Progress dots, also a control. */}
      {quotes.length > 1 ? (
        <div className="mt-7 flex justify-center gap-2">
          {quotes.map((q, i) => (
            <button
              key={q.sanskrit}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show: ${q.translation}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-7 bg-pumpkin-500" : "w-1.5 bg-ink-0/30 hover:bg-ink-0/60"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Cycles through the sacred sites, one at a time.
 *
 * A quiet way to show breadth: 38 sites is a number, but seeing them named one
 * after another conveys the reach of the Digvijaya Yatra.
 */
export function SiteSpotlight({
  sites,
  interval = 4200,
}: {
  sites: { id: string; name: string; stateName: string | null; significance: string | null }[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (sites.length < 2 || paused || prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % sites.length), interval);
    return () => window.clearInterval(id);
  }, [sites.length, interval, paused]);

  if (sites.length === 0) return null;
  const site = sites[index];

  return (
    <div
      className="rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
          Sacred sites of the journey
        </p>
        <span className="text-[11px] tabular-nums text-ink-400">
          {index + 1} / {sites.length}
        </span>
      </div>

      {/* key forces a remount so the fade replays on each change */}
      <div key={site.id} className="quote-in mt-3 min-h-28">
        <p className="font-display text-lg text-ink-900 sm:text-xl">{site.name}</p>
        {site.stateName ? (
          <p className="mt-0.5 text-xs text-ink-500">{site.stateName}</p>
        ) : null}
        {site.significance ? (
          <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
            {site.significance}
          </p>
        ) : null}
      </div>

      <div className="mt-4 h-0.5 overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full bg-pumpkin-500 transition-all duration-500"
          style={{ width: `${((index + 1) / sites.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
