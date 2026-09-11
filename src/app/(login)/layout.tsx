/**
 * The sign-in shell.
 *
 * Sign-in gets its own route group, and its own full-bleed photograph, because
 * it is the one page where the Yatra should be felt before it is read. The
 * registration pages stay in `(auth)` under the themed banner: a long form over
 * a photograph is unreadable, and those pages are work rather than welcome.
 *
 * The photograph is 1080x1889 — portrait, so it fills a phone without cropping
 * to a sliver. On a laptop it is anchored left, where the figure stands, and the
 * card sits to the right of it.
 */
import Image from "next/image";

import { LotusMandala } from "@/components/brand";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-950">
      <Image
        src="/brand/login-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[42%_18%] lg:object-[34%_8%]"
      />

      {/*
        Two scrims, each doing one job. The top one darkens the sky just enough
        for the wordmark; the bottom one carries the card. Measured against the
        source: the sky reads ~#dfe6ef and the foliage ~#2c3a22, so the copy
        needs help at the top and the card needs contrast at the bottom.
      */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/45 via-ink-950/15 to-ink-950/85" />
      <div className="pointer-events-none absolute inset-0 lg:bg-gradient-to-r lg:from-ink-950/10 lg:via-ink-950/25 lg:to-ink-950/70" />

      {/*
        On a wide screen the photograph is a tall portrait, so the right third
        is scrim with nothing behind it. A slowly turning mandala gives that
        space something of the Yatra rather than leaving flat grey.
      */}
      <LotusMandala className="spin-slow pointer-events-none absolute -right-24 top-1/2 hidden size-[34rem] -translate-y-1/2 text-pumpkin-400/[0.09] lg:block" />

      <div className="relative flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}
