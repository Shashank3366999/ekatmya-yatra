/**
 * Brand furniture.
 *
 * Adi Shankaracharya is the visual anchor of the product. The official image is
 * the Statue of Oneness at Omkareshwar (`/public/brand/oneness.png`).
 *
 * That file is 434x828 — portrait and modest in size — which shapes how it is
 * used. `variant="panel"` covers tall columns where it barely needs upscaling;
 * `variant="banner"` puts it in a short wide strip as a contained figure
 * anchored to one side, over an ink gradient, rather than stretching a small
 * image across a 1400px header and going soft.
 */
import Image from "next/image";

/**
 * The official imagery: the Statue of Oneness at Omkareshwar.
 *
 * 1366x768, landscape, with the figure right of centre and open sky to the
 * left — so the natural composition is a wide frame with the copy over the sky.
 * `OBJECT_POSITION` keeps the figure in shot whatever the crop.
 */
const ONENESS_SRC = "/brand/oneness.avif";
const ONENESS_ALT =
  "The Statue of Oneness at Omkareshwar, depicting Adi Shankaracharya";
/** Figure sits at ~59% across; its head at ~28% down. */
const OBJECT_POSITION = "59% 28%";

/** Concentric lotus mandala — a watermark behind devotional sections. */
export function LotusMandala({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="100"
          cy="100"
          rx="22"
          ry="74"
          strokeWidth="1"
          transform={`rotate(${deg} 100 100)`}
          opacity="0.5"
        />
      ))}
      <circle cx="100" cy="100" r="30" strokeWidth="1" opacity="0.7" />
      <circle cx="100" cy="100" r="14" strokeWidth="1" opacity="0.9" />
    </svg>
  );
}

/**
 * The large emblem, for the sign-in screen only.
 *
 * `YatraMark` is a 2px line drawing tuned to read at 24px in a header; blown up
 * to 64px over a photograph it turns into a thin wire outline. This is the same
 * idea drawn for size: filled petals opening around a single flame, in two
 * tones of pumpkin so it holds its shape against a bright sky or dark foliage.
 * Pumpkin only — green is reserved for the sidebars.
 */
export function YatraEmblem({ className = "", size = 72 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Ekatma Yatra"
    >
      {/*
        A flame cradled in a lotus. The first attempt ringed the flame with
        eight petals and read as a daisy — a full circle of petals is a sunburst,
        not a lotus. So the petals sit beneath and to the sides, opening upward,
        and the flame is the tallest thing in the mark.
      */}
      <g transform="translate(60 64)">
        {/* Outer pair, sweeping wide */}
        <path
          d="M-4 8C-22 4-34-6-38-22c14 0 26 8 34 26Z"
          fill="currentColor"
          opacity="0.45"
        />
        <path
          d="M4 8C22 4 34-6 38-22c-14 0-26 8-34 26Z"
          fill="currentColor"
          opacity="0.45"
        />
        {/* Inner pair, upright and stronger */}
        <path
          d="M-3 10C-15 4-21-6-20-20c9 4 15 14 17 30Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M3 10C15 4 21-6 20-20c-9 4-15 14-17 30Z"
          fill="currentColor"
          opacity="0.7"
        />

        {/* The flame — one light, taller than the petals that hold it */}
        <path
          d="M0-46c9.5 11.5 14.5 20 14.5 27.4A14.5 14.5 0 0 1 0-4.1a14.5 14.5 0 0 1-14.5-14.5C-14.5-26-9.5-34.5 0-46Z"
          fill="currentColor"
        />
        <path
          d="M0-28c3.8 4.6 5.8 8 5.8 11A5.8 5.8 0 0 1 0-11.2 5.8 5.8 0 0 1-5.8-17C-5.8-20-3.8-23.4 0-28Z"
          fill="#fff"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

/**
 * The app mark: a lamp flame inside an arch — the Ekatma (oneness) idea as a
 * single light. Reads clearly at 24px.
 */
export function YatraMark({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Ekatma Yatra"
    >
      <path
        d="M10 42V22a14 14 0 0 1 28 0v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Single flame — the one consciousness */}
      <path
        d="M24 14c3.4 3.6 5.2 6.4 5.2 9.2A5.2 5.2 0 0 1 24 28.4a5.2 5.2 0 0 1-5.2-5.2c0-2.8 1.8-5.6 5.2-9.2Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path d="M8 42h32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Wordmark lockup used in headers. */
export function BrandLockup({
  subtitle,
  tone = "dark",
}: {
  subtitle?: string;
  tone?: "dark" | "light";
}) {
  const title = tone === "light" ? "text-ink-0" : "text-ink-900";
  const sub = tone === "light" ? "text-ink-0/70" : "text-ink-500";
  const mark = tone === "light" ? "text-pumpkin-400" : "text-pumpkin-500";

  return (
    <div className="flex items-center gap-2.5">
      <YatraMark size={30} className={mark} />
      <div className="leading-tight">
        <div className={`font-display text-base ${title}`}>Ekatma Yatra</div>
        {subtitle ? <div className={`text-[11px] ${sub}`}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

/**
 * The Statue of Oneness at Omkareshwar.
 *
 * Used in exactly one place — the landing hero — where the frame is close to
 * the source's own 16:9 and the figure can be shown large and crisp. Reusing
 * the same photograph as a band across every dashboard flattened it and forced
 * awkward crops; those surfaces use the themed motifs below instead.
 */
export function ShankaraPortrait({
  className = "",
  priority = false,
  sizes = "100vw",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={`bg-hero-ink relative overflow-hidden ${className}`}>
      <Image
        src={ONENESS_SRC}
        alt={ONENESS_ALT}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition: OBJECT_POSITION }}
      />
      {/*
        The sky is pale, so copy laid over this needs its own ground — but the
        scrim only has to be strong where copy actually sits on the image. On a
        phone the hero shows this as a band with the copy beneath it, so a heavy
        overlay just muddied the statue; it lightens below `sm`.
      */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/45 via-ink-950/10 to-transparent sm:from-ink-950/85 sm:via-ink-950/45 sm:to-ink-950/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent sm:from-ink-950/80 sm:via-ink-950/20" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Themed motifs — the graphic language used where a photograph would not sit  */
/* -------------------------------------------------------------------------- */

/**
 * A row of temple gateways, echoing the arch in `YatraMark`.
 *
 * Drawn as an SVG pattern so it tiles to any width without distortion.
 */
export function ArchRow({ className = "" }: { className?: string }) {
  const id = "arch-pattern";

  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <defs>
        <pattern id={id} width="34" height="46" patternUnits="userSpaceOnUse">
          {/* Gateway: an arch on a plinth. */}
          <path
            d="M6 46V20a11 11 0 0 1 22 0v26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M2 46h30" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="17" cy="26" r="2.6" fill="currentColor" opacity="0.7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * An abstract journey: a path of stops, drawn as a flowing dotted line.
 * The stops animate along the line, reusing the map's own motion language.
 */
export function RouteMotif({ className = "" }: { className?: string }) {
  const d = "M0 78 C 60 30, 110 96, 170 52 S 260 8, 330 60 S 410 104, 480 48";

  return (
    <svg
      viewBox="0 0 480 120"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
        pathLength="1"
        className="map-route-draw"
      />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="map-route-march"
      />
    </svg>
  );
}

/**
 * The banner used at the top of the sign-in screen and the dashboards.
 *
 * An ink ground carrying themed geometry rather than photography: a lotus
 * mandala bloom, a tiled row of gateways, and the journey line. `children` is
 * the copy, which sits over the ground with plenty of contrast.
 */
export function ThemeBanner({
  children,
  className = "",
  motif = "mandala",
}: {
  children?: React.ReactNode;
  className?: string;
  motif?: "mandala" | "arches" | "journey";
}) {
  return (
    <div className={`bg-hero-ink relative overflow-hidden ${className}`}>
      {/* Bloom: always present, anchored right so copy reads left. */}
      <LotusMandala className="pointer-events-none absolute -top-1/2 right-[-4%] h-[220%] text-pumpkin-500/15" />

      {motif === "arches" ? (
        <ArchRow className="pointer-events-none absolute inset-x-0 bottom-0 h-14 text-pumpkin-300/25" />
      ) : null}

      {motif === "journey" ? (
        <RouteMotif className="pointer-events-none absolute inset-x-0 bottom-0 h-20 text-pumpkin-400/45" />
      ) : null}

      {/* A single warm glow so the ground is not flat. */}
      <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-pumpkin-500/12 blur-3xl" />

      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** Thin pumpkin divider with a centred glyph. */
export function AccentRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <div className="rule-accent h-px flex-1 opacity-50" />
      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-pumpkin-500">
        <path d="M5 0 6.4 3.6 10 5 6.4 6.4 5 10 3.6 6.4 0 5 3.6 3.6Z" fill="currentColor" />
      </svg>
      <div className="rule-accent h-px flex-1 opacity-50" />
    </div>
  );
}
