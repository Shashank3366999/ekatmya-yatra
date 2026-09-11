/**
 * India's outline as a decorative watermark.
 *
 * Lives apart from the other motifs because it pulls in the boundary path data.
 * Use it only on screens that already render the map, where the module is
 * loaded anyway and this costs nothing extra — the user home banner today.
 */
import { INDIA_OUTLINE_PATHS, MAP_VIEW_BOX } from "@/lib/india-outline";

export function BharatWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEW_BOX.width} ${MAP_VIEW_BOX.height}`}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {INDIA_OUTLINE_PATHS.map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
