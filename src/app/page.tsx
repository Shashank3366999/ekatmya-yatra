import type { Metadata } from "next";
import { ArrowDown, Compass, HandHeart, MapPin, ShieldCheck } from "lucide-react";

import { redirectIfSignedIn } from "@/actions/auth";
import {
  AccentRule,
  BrandLockup,
  LotusMandala,
  ShankaraPortrait,
} from "@/components/brand";
import { IndiaMap, MapLegend } from "@/components/india-map";
import {
  CountUp,
  Countdown,
  Marquee,
  Parallax,
  QuoteRotator,
  Reveal,
  ScrollProgress,
  SiteSpotlight,
} from "@/components/motion";
import { LinkButton } from "@/components/ui/link-button";
import { formatDate, formatDateShort } from "@/lib/format";
import { HERITAGE_LABELS, type HeritageType } from "@/lib/heritage-data";
import { heritageCounts, listHeritagePlaces, listRoutePlaces } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ekatma Yatra 2027 — One Journey, One Consciousness",
  description:
    "A Bharat Yatra for oneness tracing Adi Shankaracharya's Digvijaya Yatra, 16 January to 10 May 2027, from Kalady to Kedarnath.",
};

/** The Yatra begins at dawn on 16 January 2027, IST. */
const YATRA_START_ISO = "2027-01-16T06:00:00+05:30";

/**
 * The four Mahavakyas — the "great sayings" at the centre of Advaita Vedanta,
 * one from each Veda. The philosophy the Yatra carries, in its own words.
 */
const MAHAVAKYAS = [
  {
    sanskrit: "अहं ब्रह्मास्मि",
    translation: "I am Brahman",
    source: "Brihadaranyaka Upanishad",
  },
  {
    sanskrit: "तत् त्वम् असि",
    translation: "That thou art",
    source: "Chandogya Upanishad",
  },
  {
    sanskrit: "प्रज्ञानं ब्रह्म",
    translation: "Consciousness is Brahman",
    source: "Aitareya Upanishad",
  },
  {
    sanskrit: "अयम् आत्मा ब्रह्म",
    translation: "This Self is Brahman",
    source: "Mandukya Upanishad",
  },
];

const HERITAGE_ORDER: HeritageType[] = [
  "jyotirlinga",
  "shakti_peetha",
  "saptapuri",
  "char_dham",
  "amnaya_peetham",
  "shankaracharya_site",
];

const ROLES = [
  {
    icon: Compass,
    title: "Explore the Yatra",
    body: "Follow the route, see events near you, and build your own journey.",
    href: "/register",
    cta: "Create an account",
    variant: "primary" as const,
  },
  {
    icon: HandHeart,
    title: "Serve as a Shankardoot",
    body: "Survey places, plan events, handle outreach, media and logistics — at national, state or district level, for as many days as you can give.",
    href: "/register/organizer",
    cta: "Register to serve",
    variant: "secondary" as const,
  },
  {
    icon: ShieldCheck,
    title: "Administration",
    body: "For the Yatra administration team — approvals, survey review and reporting.",
    href: "/login",
    cta: "Administrator sign-in",
    variant: "outline" as const,
  },
];

export default async function LandingPage() {
  // Anyone already signed in belongs in their own app, not here.
  await redirectIfSignedIn();

  const [route, heritage, counts] = await Promise.all([
    listRoutePlaces(),
    listHeritagePlaces(),
    heritageCounts(),
  ]);

  /*
    "Stops" always means the confirmed, sequenced itinerary. Places approved
    from a survey join the route without a position.
  */
  const sequenced = route.filter((p) => p.routeOrder !== null);
  const first = sequenced[0];
  const last = sequenced[sequenced.length - 1];
  const offRoute = heritage.filter((h) => !h.isOnRoute);
  const beyondReach = heritage.filter((h) => h.isBeyondReach);

  const mapPlaces = [
    // Heritage first; the map paints the 2027 route on top.
    ...offRoute.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      routeOrder: null,
      stateName: p.stateName,
      kind: p.isBeyondReach ? ("beyondReach" as const) : ("heritage" as const),
    })),
    ...route.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      routeOrder: p.routeOrder,
      stateName: p.stateName,
      kind: "main" as const,
    })),
  ];

  return (
    <div className="min-h-dvh">
      <ScrollProgress />

      {/* ------------------------------------------------------------ hero */}
      {/* overflow-hidden contains the turning mandala and the aurora blobs,
          which are deliberately larger than the hero. */}
      <header className="bg-hero-ink relative overflow-hidden">
        {/* Drifting glow and a slowly turning mandala, so the hero is never still.
            The mandala scales with the breakpoint: at a fixed 34rem it was wider
            than a phone screen and swamped the corner. */}
        <div className="aurora pointer-events-none absolute inset-0 overflow-hidden" />
        <LotusMandala className="spin-slow pointer-events-none absolute -top-16 -right-16 size-56 text-pumpkin-400/10 sm:-top-28 sm:-right-24 sm:size-96 lg:-top-40 lg:-right-40 lg:size-[34rem]" />

        {/* Brand bar sits above the statue at every size. */}
        <div className="relative z-10 mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-12 lg:pt-8">
          <BrandLockup subtitle="Acharya Shankar Sanskritik Ekta Nyas" tone="light" />
        </div>

        {/*
          The statue.

          On a phone it is a band of its own, so the figure is actually visible —
          overlaying the whole hero with copy hid it behind text. From `sm` up
          there is room to lay the copy over it, so it fills the hero instead.
        */}
        <Parallax
          strength={0.14}
          className="relative mt-4 aspect-[16/10] w-full sm:absolute sm:inset-0 sm:mt-0 sm:aspect-auto"
        >
          <ShankaraPortrait priority className="drift h-full w-full" />
        </Parallax>

        <div className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col px-5 pt-7 pb-10 sm:min-h-[40rem] sm:justify-end sm:px-8 sm:pt-64 lg:min-h-[44rem] lg:px-12">
            <div className="max-w-2xl">
              <Reveal>
                <p className="text-[11px] tracking-[0.2em] text-pumpkin-400 uppercase sm:text-xs">
                  Ek Bharat — Ekatmata Bharat
                </p>
                <h1 className="mt-3 font-display text-[2rem] leading-[1.08] text-ink-0 sm:text-5xl xl:text-6xl">
                  One Journey.
                  <br />
                  One Consciousness.
                </h1>
              </Reveal>

              <AccentRule className="my-4 max-w-xs sm:my-5" />

              <Reveal delay={90}>
                <p className="text-sm leading-relaxed text-ink-0/80 sm:text-base">
                  Tracing the legendary <em>Digvijaya Yatra</em> of Jagadguru Adi
                  Shankaracharya —{" "}
                  <strong className="font-medium text-ink-0">16 January</strong> to{" "}
                  <strong className="font-medium text-ink-0">10 May 2027</strong>,
                  from{" "}
                  <strong className="font-medium text-ink-0">
                    {first?.name ?? "Kalady"} (Kerala)
                  </strong>{" "}
                  to{" "}
                  <strong className="font-medium text-ink-0">
                    {last?.name ?? "Kedarnath"} (Uttarakhand)
                  </strong>
                  .
                </p>
              </Reveal>

              {/* Live countdown — the most dynamic thing on the page, and real. */}
              <Reveal delay={160} className="mt-6 sm:mt-7">
                <p className="mb-2.5 text-[10px] tracking-[0.16em] text-ink-0/50 uppercase">
                  The Yatra begins in
                </p>
                <div className="max-w-md">
                  <Countdown target={YATRA_START_ISO} />
                </div>
              </Reveal>

              <Reveal delay={220} className="mt-6 flex flex-wrap gap-3 sm:mt-7">
                <LinkButton href="/register/organizer" size="lg">
                  Become a Shankardoot
                </LinkButton>
                <LinkButton href="/register" variant="secondary" size="lg">
                  Explore the Yatra
                </LinkButton>
              </Reveal>
            </div>

            <div className="mt-10 hidden justify-center sm:flex lg:mt-12">
              <ArrowDown size={20} className="nudge text-ink-0/50" aria-hidden="true" />
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------- ribbon of sites */}
      <section className="border-y border-ink-200 bg-ink-50 py-3.5">
        <Marquee items={heritage.map((h) => h.name)} />
      </section>

      {/* --------------------------------------------------- the journey */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
                The journey of oneness
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
                A lamp lit centuries ago
              </h2>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-600 sm:text-base">
                The eternal lamp of Advaita Vedanta, Sanatana culture and cultural
                unity lit by Jagadguru Adi Shankaracharya — as he sanctified the
                sacred land of Bharat with his holy steps — continues to
                illuminate our consciousness today.
              </p>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-600 sm:text-base">
                Tracing the footsteps of that legendary <em>Digvijaya Yatra</em>,
                the Acharya Shankar Sanskritik Ekta Nyas is organising the
                historic Ekatma Yatra from 16 January to 10 May 2027.
              </p>
            </Reveal>

            <Reveal delay={90}>
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ink-200 pt-6">
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">
                    Begins
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
                    {first?.expectedArrival
                      ? formatDateShort(first.expectedArrival)
                      : "16 Jan"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">
                    Stops
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-ink-900">
                    <CountUp value={sequenced.length} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">
                    Concludes
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
                    {last?.expectedArrival
                      ? formatDateShort(last.expectedArrival)
                      : "10 May"}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-b from-ink-0 to-ink-50 p-5 shadow-sm sm:p-8">
              <LotusMandala className="pointer-events-none absolute -top-8 -right-8 size-36 text-pumpkin-500/10 sm:-top-10 sm:-right-10 sm:size-48" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
                    The Main Yatra
                  </p>
                  <p className="mt-1 font-display text-lg text-ink-900">
                    {first?.name ?? "Kalady"}{" "}
                    <span className="text-pumpkin-500">→</span>{" "}
                    {last?.name ?? "Kedarnath"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-pumpkin-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-pumpkin-700">
                  {sequenced.length} stops
                </span>
              </div>

              <IndiaMap
                places={mapPlaces}
                className="mx-auto mt-4 max-h-[30rem] w-full max-w-sm lg:max-w-md"
              />

              <MapLegend className="relative mt-4 justify-center border-t border-ink-200 pt-4" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- the philosophy */}
      <section className="bg-hero-ink relative overflow-hidden">
        <div className="aurora pointer-events-none absolute inset-0" />
        <LotusMandala className="spin-slow pointer-events-none absolute -bottom-24 -left-20 size-64 text-pumpkin-400/10 sm:-bottom-36 sm:-left-32 sm:size-80 lg:-bottom-48 lg:-left-40 lg:size-[30rem]" />

        <div className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <p className="text-center text-[10px] tracking-[0.16em] text-pumpkin-400 uppercase">
              The four Mahavakyas
            </p>
            <div className="mt-8">
              <QuoteRotator quotes={MAHAVAKYAS} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------- sacred geography */}
      <section className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
              The Digvijaya Yatra
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
              Every corner of Bharat he sanctified
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              Adi Shankaracharya walked from Kalady to the Himalaya, establishing
              the four Mathas and reaching the Jyotirlingas, Shakti Peethas and
              Saptapuris. Pilgrims on the Ekatma Yatra will have the rare blessing
              to visit and stay at the sites he personally sanctified.
            </p>
          </Reveal>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {HERITAGE_ORDER.map((t, i) => (
              <Reveal key={t} delay={i * 60}>
                <div className="lift h-full rounded-xl border border-ink-200 bg-surface p-4">
                  <dd className="text-3xl font-semibold leading-none text-pumpkin-600">
                    <CountUp value={counts[t] ?? 0} />
                  </dd>
                  <dt className="mt-2 text-[11px] leading-tight text-ink-500">
                    {HERITAGE_LABELS[t]}
                  </dt>
                </div>
              </Reveal>
            ))}
          </dl>

          {/* One site at a time — breadth felt rather than counted. */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Reveal delay={80}>
              <SiteSpotlight
                sites={heritage.map((h) => ({
                  id: h.id,
                  name: h.name,
                  stateName: h.stateName,
                  significance: h.significance,
                }))}
              />
            </Reveal>

            <Reveal delay={140}>
              <div className="flex h-full flex-col justify-center rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
                <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
                  Across Bharat
                </p>
                <p className="mt-3 text-5xl font-semibold leading-none text-ink-900">
                  <CountUp value={heritage.length} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  sacred sites mapped along the Digvijaya Yatra — the Char Dham,
                  the four Mathas, the Jyotirlingas, Shakti Peethas and Saptapuris.
                </p>
              </div>
            </Reveal>
          </div>

          {/* The site the Yatra cannot reach, named rather than omitted. */}
          {beyondReach.length > 0 ? (
            <Reveal delay={120}>
              <div className="mt-6 rounded-xl border border-dashed border-gold/50 bg-surface p-4 sm:p-5">
                <p className="text-[10px] tracking-[0.16em] text-gold uppercase">
                  Beyond reach today
                </p>
                {beyondReach.map((h) => (
                  <div key={h.id} className="mt-2">
                    <p className="flex items-center gap-1.5 font-display text-base text-ink-900">
                      <MapPin size={14} className="text-gold" aria-hidden="true" />
                      {h.name}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
                      {h.significance}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* ----------------------------------------------- journey timeline */}
      <section className="border-t border-ink-200">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
              The itinerary
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
              {sequenced.length} halts, {first?.name ?? "Kalady"} to{" "}
              {last?.name ?? "Kedarnath"}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              Drag or scroll along the journey. Halts and dates are provisional
              until the Yatra committee confirms the final itinerary.
            </p>
          </Reveal>

          {/*
            Horizontal, snapping, thumb-draggable — reads as a journey.
            The row reveals as a whole and `.stagger` cascades the cards in:
            wrapping each card in its own Reveal left the off-screen ones
            permanently hidden, because the scroller clips them from the
            IntersectionObserver.
          */}
          <Reveal>
            <div className="snap-row stagger mt-8 flex gap-3 overflow-x-auto pb-3">
              {sequenced.map((p) => (
                <article
                  key={p.id}
                  className="lift flex h-full w-56 shrink-0 flex-col rounded-xl border border-ink-200 bg-surface p-4 sm:w-64"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-[11px] font-semibold tabular-nums text-ink-0">
                      {p.routeOrder}
                    </span>
                    <span className="text-[11px] tabular-nums text-ink-500">
                      {p.expectedArrival ? formatDate(p.expectedArrival) : "date TBC"}
                    </span>
                  </div>

                  <p className="mt-3 font-display text-base leading-tight text-ink-900">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {[p.districtName, p.stateName].filter(Boolean).join(", ")}
                  </p>

                  {p.significance ? (
                    <p className="mt-2.5 line-clamp-4 text-xs leading-relaxed text-ink-600">
                      {p.significance}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- role chooser */}
      <section className="border-t border-ink-200">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-600 uppercase">
              A sacred call to service
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
              Become a Shankardoot
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              It is a sacred privilege to step forward and dedicate yourself to
              this grand initiative for awakening our spiritual heritage.
              Contribute your time according to your convenience — in managing
              arrangements, public awareness and ground operations; in spreading
              the wisdom of Advaita; and in walking the footsteps of Acharya
              Shankar yourself.
            </p>
          </Reveal>

          <AccentRule className="mx-auto my-8 max-w-xs" />

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {ROLES.map((card, i) => (
              <Reveal key={card.title} delay={i * 80}>
                <div className="lift flex h-full flex-col rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-pumpkin-50 text-pumpkin-600">
                    <card.icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-ink-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                    {card.body}
                  </p>
                  <LinkButton
                    href={card.href}
                    variant={card.variant}
                    size="sm"
                    className="mt-5"
                  >
                    {card.cta}
                  </LinkButton>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 text-center">
          <BrandLockup subtitle="Acharya Shankar Sanskritik Ekta Nyas" />
          <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
            Ekatma Yatra 2027 · One Journey, One Consciousness
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
            Route and halts are provisional, pending confirmation by the Yatra
            committee.
          </p>
        </div>
      </footer>
    </div>
  );
}
