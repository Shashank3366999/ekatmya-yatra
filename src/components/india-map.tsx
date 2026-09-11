"use client";

/**
 * The Yatra map: India's outline with the route marked on it.
 *
 * Rendered as inline SVG rather than a tile map (Leaflet/Mapbox) on purpose —
 * the brief calls for a lightweight app, and this ships ~18 KB of path data with
 * no tile requests, no API key, and it works offline in the field. The trade-off
 * is no pan/zoom to street level, which route planning does not need here.
 *
 * The route draws itself on, then its dashes march along the path, markers
 * arrive in route order, and the first and last stops breathe. Every bit of that
 * is CSS animation on top of a complete static picture, so the reduced-motion
 * rule in globals.css collapses it without changing what is shown.
 */
import { useId, useRef, useState } from "react";

import {
  INDIA_OUTLINE_PATHS,
  MAP_VIEW_BOX,
  projectPoint,
} from "@/lib/india-outline";

export type MapPlace = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  routeOrder: number | null;
  stateName?: string | null;
  /**
   * main         a confirmed, sequenced stop on the 2027 itinerary
   * sub          a local Sub-Yatra place
   * survey       a surveyed proposal awaiting review
   * heritage     sanctified by Adi Shankaracharya, not a 2027 halt
   * beyondReach  heritage the Yatra cannot reach (across a border)
   */
  kind?: "main" | "sub" | "survey" | "heritage" | "beyondReach";
};

type Props = {
  places: MapPlace[];
  /** Draw the connecting line through the main-route stops in order. */
  showRouteLine?: boolean;
  /** Currently highlighted place id. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Turn off the entrance animation (e.g. a dense admin view). */
  animate?: boolean;
  className?: string;
};

type MarkerKind = NonNullable<MapPlace["kind"]> | "pending";

/**
 * Four categories that must stay tellable apart with only the brand palette
 * (pumpkin, black, white, gold) — so they differ in fill AND in treatment,
 * not just hue: solid pumpkin, hollow pumpkin, solid black, solid gold.
 */
const MARKER_STYLES: Record<
  MarkerKind,
  { fill: string; stroke: string; r: number; strokeWidth: number; dashed?: boolean }
> = {
  main: {
    fill: "var(--color-pumpkin-500)",
    stroke: "var(--color-ink-0)",
    r: 11,
    strokeWidth: 3,
  },
  /** On the route but not yet placed in the itinerary — hollow. */
  pending: {
    fill: "var(--color-ink-0)",
    stroke: "var(--color-pumpkin-500)",
    r: 9,
    strokeWidth: 4,
  },
  sub: {
    fill: "var(--color-ink-800)",
    stroke: "var(--color-ink-0)",
    r: 9,
    strokeWidth: 3,
  },
  survey: {
    fill: "var(--color-gold)",
    stroke: "var(--color-ink-0)",
    r: 8,
    strokeWidth: 3,
  },
  /** Sanctified by Adi Shankaracharya; smaller, so the route stays dominant. */
  heritage: {
    fill: "var(--color-gold)",
    stroke: "var(--color-ink-0)",
    r: 6,
    strokeWidth: 2,
  },
  /** Beyond reach — drawn hollow and dashed, present but unvisitable. */
  beyondReach: {
    fill: "var(--color-ink-0)",
    stroke: "var(--color-gold)",
    r: 7,
    strokeWidth: 2.5,
    dashed: true,
  },
};

/** Paint order: heritage underneath, the confirmed route on top. */
function layer(kind: MarkerKind): number {
  return kind === "beyondReach" || kind === "heritage"
    ? 0
    : kind === "survey"
      ? 1
      : 2;
}

/**
 * How close a pointer must be to a marker to pick it, in viewBox units.
 *
 * The map is drawn in a 1000-unit viewBox but displayed around 350px wide, so a
 * visible 11-unit marker is only ~4px on screen — far too small to tap. Rather
 * than give each marker a big invisible circle (which overlapped: Thrissur's
 * would swallow Kalady, 15 units away), a single surface over the map picks the
 * *nearest* marker to the pointer. Dense stops stay individually selectable and
 * every tap lands on something sensible.
 */
const PICK_RADIUS = 70;

/** Stagger between marker entrances, in ms. */
const MARKER_STAGGER = 55;

export function IndiaMap({
  places,
  showRouteLine = true,
  selectedId = null,
  onSelect,
  animate = true,
  className = "",
}: Props) {
  const uid = useId();
  const landId = `land-${uid}`;
  const glowId = `glow-${uid}`;
  const shadowId = `shadow-${uid}`;
  const skyId = `sky-${uid}`;
  const ringId = `ring-${uid}`;
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const plotted = places
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => {
      const kind = p.kind ?? "main";
      return {
        ...p,
        ...projectPoint(p.latitude!, p.longitude!),
        // A main-route place with no position is drawn distinctly, so an
        // unsequenced addition never masquerades as a confirmed stop.
        kind: (kind === "main" && p.routeOrder === null ? "pending" : kind) as MarkerKind,
      };
    });

  // The route line follows only ordered main-Yatra stops.
  const routePoints = plotted
    .filter((p) => p.kind === "main" && p.routeOrder !== null)
    .sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0));

  const routePath =
    routePoints.length > 1
      ? "M" + routePoints.map((p) => `${p.x} ${p.y}`).join(" L")
      : null;

  // The journey's start and end get a breathing halo.
  const endpointIds = new Set(
    routePoints.length > 1
      ? [routePoints[0].id, routePoints[routePoints.length - 1].id]
      : [],
  );

  // Entrance order: along the route first, then anything unsequenced.
  const orderIndex = new Map(routePoints.map((p, i) => [p.id, i]));

  const active = hovered ?? selectedId;
  const activePlace = plotted.find((p) => p.id === active) ?? null;

  /**
   * Pointer position -> viewBox coordinates. Uses the SVG's own screen matrix
   * so it stays correct through letterboxing from preserveAspectRatio.
   */
  function toViewBox(e: React.PointerEvent | React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return null;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(ctm.inverse());
  }

  /** The closest marker to a pointer, if any is close enough. */
  function nearest(e: React.PointerEvent | React.MouseEvent) {
    const at = toViewBox(e);
    if (!at) return null;

    let best: (typeof plotted)[number] | null = null;
    let bestDist = PICK_RADIUS * PICK_RADIUS;

    for (const p of plotted) {
      const dx = p.x - at.x;
      const dy = p.y - at.y;
      const d = dx * dx + dy * dy;
      if (d <= bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_VIEW_BOX.width} ${MAP_VIEW_BOX.height}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={`Map of India showing ${plotted.length} Yatra locations`}
      >
        <defs>
          <linearGradient id={landId} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fffaf5" />
            <stop offset="100%" stopColor="var(--color-pumpkin-50)" />
          </linearGradient>

          {/*
            The ground the country sits on. A flat white panel left the map
            looking like a spreadsheet; this is a warm dawn wash, brightest
            behind the route and fading to nothing at the edges so it never
            reads as a box.
          */}
          <radialGradient id={skyId} cx="0.5" cy="0.42" r="0.72">
            <stop offset="0%" stopColor="var(--color-pumpkin-200)" stopOpacity="0.75" />
            <stop offset="55%" stopColor="var(--color-pumpkin-200)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-pumpkin-100)" stopOpacity="0" />
          </radialGradient>

          {/* Concentric rings, as on a yantra — the journey's widening circles. */}
          <radialGradient id={ringId} cx="0.5" cy="0.42" r="0.72">
            <stop offset="0%" stopColor="var(--color-pumpkin-400)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--color-pumpkin-400)" stopOpacity="0" />
          </radialGradient>

          {/* Warm haze along the route, so the journey reads as lit. */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>

          {/* Soft lift under the landmass. */}
          <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="7"
              floodColor="var(--color-pumpkin-900)"
              floodOpacity="0.26"
            />
          </filter>
        </defs>

        {/* The ground, behind everything. Decorative, so never a hit target. */}
        <g className="pointer-events-none">
          <rect
            x="0"
            y="0"
            width={MAP_VIEW_BOX.width}
            height={MAP_VIEW_BOX.height}
            fill={`url(#${skyId})`}
          />
          {[0.22, 0.34, 0.46, 0.58].map((r) => (
            <circle
              key={r}
              cx={MAP_VIEW_BOX.width * 0.5}
              cy={MAP_VIEW_BOX.height * 0.42}
              r={MAP_VIEW_BOX.width * r}
              fill="none"
              stroke={`url(#${ringId})`}
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Landmass */}
        <g filter={`url(#${shadowId})`}>
          {INDIA_OUTLINE_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={`url(#${landId})`}
              stroke="var(--color-pumpkin-400)"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Route, drawn under the markers */}
        {showRouteLine && routePath ? (
          <g>
            {/* Glow */}
            <path
              d={routePath}
              fill="none"
              stroke="var(--color-pumpkin-400)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
              filter={`url(#${glowId})`}
              pathLength="1"
              className={animate ? "map-route-draw" : undefined}
            />
            {/* The line itself */}
            <path
              d={routePath}
              fill="none"
              stroke="var(--color-pumpkin-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              pathLength="1"
              className={animate ? "map-route-draw" : undefined}
            />
            {/* Dashes travelling along it */}
            <path
              d={routePath}
              fill="none"
              stroke="var(--color-pumpkin-600)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animate ? "map-route-march" : undefined}
              strokeDasharray={animate ? undefined : "9 13"}
            />
          </g>
        ) : null}

        {/*
          Markers. Presentational — picking happens on the surface below.
          Heritage sites paint first so the 2027 route always sits on top.
        */}
        <g>
          {[...plotted]
            .sort((a, b) => layer(a.kind) - layer(b.kind))
            .map((p) => {
            const style = MARKER_STYLES[p.kind];
            const isActive = p.id === active;
            const interactive = Boolean(onSelect);
            const delay = (orderIndex.get(p.id) ?? plotted.length) * MARKER_STAGGER;

            return (
              <g
                key={p.id}
                transform={`translate(${p.x} ${p.y})`}
                className="map-marker-hit"
                data-active={isActive ? "true" : undefined}
                /* Focusable for keyboard users even though pointer picking is
                   handled by the overlay. */
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? p.name : undefined}
                onFocus={interactive ? () => setHovered(p.id) : undefined}
                onBlur={
                  interactive
                    ? () => setHovered((cur) => (cur === p.id ? null : cur))
                    : undefined
                }
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect!(p.id);
                        }
                      }
                    : undefined
                }
              >
                <g
                  className={animate ? "map-marker-in" : undefined}
                  style={animate ? { animationDelay: `${delay}ms` } : undefined}
                >
                  <g className="map-marker-lift">
                    {/* Breathing halo on the first and last stop. */}
                    {animate && endpointIds.has(p.id) ? (
                      <circle
                        r={style.r}
                        fill="var(--color-pumpkin-500)"
                        className="map-pulse"
                      />
                    ) : null}

                    {isActive ? (
                      <circle
                        r={style.r + 12}
                        fill="var(--color-pumpkin-500)"
                        opacity="0.2"
                      />
                    ) : null}

                    <circle
                      r={style.r}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      strokeDasharray={style.dashed ? "3 3" : undefined}
                    />
                  </g>
                </g>
                </g>
              );
            })}
        </g>

        {/*
          Picking surface. Sits above the markers and resolves the pointer to the
          nearest stop, so dense clusters stay selectable and taps never fall
          between markers. Markers themselves keep focus/keyboard handling.
        */}
        {onSelect ? (
          <rect
            x="0"
            y="0"
            width={MAP_VIEW_BOX.width}
            height={MAP_VIEW_BOX.height}
            fill="transparent"
            style={{ cursor: hovered ? "pointer" : "default", touchAction: "manipulation" }}
            onPointerMove={(e) => setHovered(nearest(e)?.id ?? null)}
            onPointerLeave={() => setHovered(null)}
            onClick={(e) => {
              const hit = nearest(e);
              if (hit) onSelect(hit.id);
            }}
          />
        ) : null}
      </svg>

      {/* Label for the active marker, positioned over the SVG in normalised units */}
      {activePlace ? (
        <div
          className="map-tip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full pb-3"
          style={{
            left: `${(activePlace.x / MAP_VIEW_BOX.width) * 100}%`,
            top: `${(activePlace.y / MAP_VIEW_BOX.height) * 100}%`,
          }}
        >
          <div className="rounded-lg border border-ink-200 bg-surface px-2.5 py-1.5 shadow-lg">
            <p className="text-xs font-semibold whitespace-nowrap text-ink-900">
              {activePlace.name}
            </p>
            {activePlace.stateName ? (
              <p className="text-[10px] whitespace-nowrap text-ink-500">
                {activePlace.stateName}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Legend shared by the map screens. Mirrors the marker treatments exactly. */
export function MapLegend({ className = "" }: { className?: string }) {
  const items: { label: string; kind: MarkerKind }[] = [
    { label: "Yatra 2027 route", kind: "main" },
    { label: "Awaiting sequencing", kind: "pending" },
    { label: "Acharya Shankar sites", kind: "heritage" },
    { label: "Beyond reach today", kind: "beyondReach" },
    { label: "Surveyed", kind: "survey" },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {items.map((i) => {
        const style = MARKER_STYLES[i.kind];
        return (
          <div key={i.label} className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-full"
              style={{
                backgroundColor: style.fill,
                border: `2px ${style.dashed ? "dashed" : "solid"} ${style.stroke}`,
                boxShadow: style.dashed ? undefined : "0 0 0 1px var(--color-ink-300)",
              }}
            />
            <span className="text-xs text-ink-500">{i.label}</span>
          </div>
        );
      })}
    </div>
  );
}
