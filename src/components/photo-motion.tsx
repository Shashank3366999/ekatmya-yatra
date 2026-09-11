"use client";

/**
 * The two places the route photographs move rather than sit still.
 *
 * Both follow the same rules as the rest of the motion components: the content
 * renders on the server, the movement is layered on after mount, and reduced
 * motion collapses it to a still frame. Both also lean on next/image so the
 * browser fetches thumbnails, not the 900 KB originals.
 */
import Image from "next/image";
import { useEffect, useState } from "react";

export type PhotoItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  routeOrder: number | null;
  stateName: string | null;
};

function reduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A continuously drifting strip of the route photographs.
 *
 * The track is rendered twice so the animation can translate by exactly half
 * its width and repeat seamlessly; the second copy is aria-hidden so a screen
 * reader hears each place once. Hovering or focusing the ribbon stops it, which
 * is what lets someone actually read a caption.
 */
export function PhotoRibbon({ items }: { items: PhotoItem[] }) {
  const withPhotos = items.filter((i) => i.imageUrl);
  if (withPhotos.length === 0) return null;

  return (
    <div
      className="marquee relative overflow-hidden"
      aria-label={`Photographs of ${withPhotos.length} stops on the Yatra route`}
    >
      <div className="marquee__track flex w-max gap-3 py-1 sm:gap-4">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3 sm:gap-4" aria-hidden={copy === 1}>
            {withPhotos.map((p) => (
              <figure
                key={`${copy}-${p.id}`}
                className="group relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:h-28 sm:w-44"
              >
                <Image
                  src={p.imageUrl as string}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 144px, 176px"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
                  <p className="truncate text-[11px] font-medium text-ink-0">{p.name}</p>
                  {p.stateName ? (
                    <p className="truncate text-[9px] tracking-wide text-ink-0/70 uppercase">
                      {p.stateName}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink-50 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-50 to-transparent sm:w-16" />
    </div>
  );
}

/**
 * A slow cross-fade of the route photographs, used as a backdrop.
 *
 * Only the current frame and the one after it are mounted, so the section costs
 * two thumbnails rather than twenty-one. Under reduced motion it holds the
 * first frame and never advances.
 */
export function PhotoBackdrop({
  items,
  intervalMs = 6000,
  className = "",
}: {
  items: PhotoItem[];
  intervalMs?: number;
  className?: string;
}) {
  const withPhotos = items.filter((i) => i.imageUrl);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (withPhotos.length < 2 || reduced()) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % withPhotos.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [withPhotos.length, intervalMs]);

  if (withPhotos.length === 0) return null;

  // Keep the next frame mounted so its thumbnail is already decoded when the
  // opacity flips — otherwise the cross-fade fades in to a blank box.
  const next = (index + 1) % withPhotos.length;
  const mounted = withPhotos.length > 1 ? [index, next] : [index];

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {mounted.map((i) => (
        <Image
          key={withPhotos[i].id}
          src={withPhotos[i].imageUrl as string}
          alt=""
          fill
          sizes="100vw"
          priority={false}
          className="object-cover transition-opacity duration-[2200ms] ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
