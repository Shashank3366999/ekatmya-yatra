import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Building2,
  Compass,
  HandHeart,
  Landmark,
  Sparkles,
} from "lucide-react";

import { redirectIfSignedIn } from "@/actions/auth";
import {
  AccentRule,
  BrandLockup,
  LotusMandala,
  RouteMotif,
} from "@/components/brand";
import { IndiaMap, MapLegend } from "@/components/india-map";
import { PhotoBackdrop, PhotoRibbon } from "@/components/photo-motion";
import { VideoHero } from "@/components/video-hero";
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

/**
 * The Nyas's wider work at Omkareshwar, linked rather than restated.
 *
 * Named and described from the organisation's own site (oneness.org.in), which
 * is the same Acharya Shankar Sanskritik Ekta Nyas organising this Yatra — so
 * the Yatra is not a standalone event but one part of a larger project, and the
 * landing page should say so. Descriptions are ours; the links go to theirs, so
 * nothing here can drift out of date into a wrong claim.
 */
const INSIDE_EKATMA_DHAM = [
  {
    icon: Landmark,
    title: "Statue of Oneness",
    body: "The 108-foot bronze of Adi Shankaracharya as a young seeker, at Omkareshwar in Khandwa district, sculpted by Shri Bhagwan Rampure.",
    href: "https://www.oneness.org.in/statue-of-oneness",
  },
  {
    icon: Sparkles,
    title: "Advaita Lok",
    body: "The museum at Ekatma Dham, presenting Sanatana Dharma and the Advaita tradition through modern, immersive methods.",
    href: "https://www.oneness.org.in/advait-lok",
  },
  {
    icon: Building2,
    title: "Institute of Advaita Vedanta",
    body: "The Acharya Shankar International Institute of Advaita Vedanta: the campus for study and research in the tradition.",
    href: "https://www.oneness.org.in/institute-of-advaita-vedanta",
  },
] as const;

export const metadata: Metadata = {
  title: "Ekatma Yatra 2027: One Journey, One Consciousness",
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

/**
 * The two ways in — deliberately not peers.
 *
 * The Yatra team's correction: a Shankardoot is not the same thing as everyone
 * who joins the Yatra, and volunteering is not the same thing as following it.
 * Most people who arrive here just want to be part of the Yatra — that is
 * JOIN, the main action, open the moment someone submits the form. A smaller
 * number step forward for a specific responsibility under a role the Yatra
 * team defines (survey, logistics, outreach, and whatever else an admin adds
 * at /admin/roles) — that is VOLUNTEER, a posting that waits for approval, and
 * it is presented as the secondary path, not an equal alternative.
 *
 * The Admin Panel is not a card here at all; it is a small link beside the
 * wordmark, reached by signing in like anything else at /login.
 */
const JOIN = {
  icon: Compass,
  title: "Join Ekatma Yatra",
  body: "Follow the route, see the events near you, and build your own journey as the Yatra moves from Kalady to Kedarnath.",
  href: "/register",
  cta: "Join Ekatma Yatra",
  note: "Open straight away, no approval needed",
};

const VOLUNTEER = {
  icon: HandHeart,
  title: "Join as Volunteer",
  body: "Give time on the ground under a role the Yatra team defines: survey, logistics, outreach and more, reviewed before your dashboard unlocks.",
  href: "/register/organizer",
  cta: "Join as Volunteer",
  note: "Needs approval from the Yatra team",
};

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
        {/*
          The Ekatma Dham film plays behind the copy. It carries its own scrims
          and pause control, and loops only its opening so the hero costs a few
          MB rather than the whole 86 MB file.
        */}
        <Parallax strength={0.1} className="absolute inset-0">
          <VideoHero />
        </Parallax>

        {/* Drifting glow and a slowly turning mandala over the film. */}
        <div className="aurora pointer-events-none absolute inset-0 overflow-hidden" />
        <LotusMandala className="spin-slow pointer-events-none absolute -top-16 -right-16 size-56 text-pumpkin-400/10 sm:-top-28 sm:-right-24 sm:size-96 lg:-top-40 lg:-right-40 lg:size-[34rem]" />

        <div className="relative z-10">
          <div className="mx-auto flex min-h-[36rem] max-w-7xl flex-col px-5 pt-6 pb-16 sm:min-h-[40rem] sm:px-8 sm:pb-20 lg:min-h-[44rem] lg:px-12 lg:pt-8">
            <div className="flex items-start justify-between gap-3">
              <BrandLockup subtitle="Acharya Shankar Sanskritik Ekta Nyas" tone="light" />
              {/*
                The Yatra team's instruction: no admin card on this page, but a
                small way in at the top for whoever administers it. It goes to
                /login, not straight to /admin — this is not a shortcut past
                signing in, just a quiet door for the people who need it.
              */}
              <Link
                href="/login"
                className="shrink-0 pt-1 text-xs font-medium text-ink-0/50 transition-colors hover:text-ink-0/85"
              >
                Admin
              </Link>
            </div>

            <div className="mt-auto max-w-2xl">
              <Reveal>
                <p className="text-[11px] tracking-[0.2em] text-pumpkin-400 uppercase sm:text-xs">
                  Ek Bharat, Ekatmata Bharat
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
                  Shankaracharya.{" "}
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
                <LinkButton href="/register" size="lg">
                  Join Ekatma Yatra
                </LinkButton>
                <LinkButton href="/register/organizer" variant="secondary" size="lg">
                  Join as Volunteer
                </LinkButton>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ ribbon of the route */}
      <section className="border-y border-pumpkin-100 bg-pumpkin-50/70 py-4">
        <PhotoRibbon items={sequenced} />
        <div className="mt-3">
          <Marquee items={heritage.map((h) => h.name)} />
        </div>
      </section>

      {/* --------------------------------------------------- the journey */}
      <section className="bg-dawn relative overflow-hidden">
        <div className="bg-grain pointer-events-none absolute inset-0" />
        <Parallax
          strength={0.12}
          className="pointer-events-none absolute -top-20 -left-24 hidden sm:block"
        >
          <LotusMandala className="spin-slow size-72 text-pumpkin-500/[0.07] lg:size-96" />
        </Parallax>
        <RouteMotif className="pointer-events-none absolute -right-10 bottom-6 hidden w-72 text-pumpkin-500/10 lg:block" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
                The journey of oneness
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
                A lamp lit centuries ago
              </h2>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-600 sm:text-base">
                The eternal lamp of Advaita Vedanta, Sanatana culture and cultural
                unity lit by Jagadguru Adi Shankaracharya, as he sanctified the
                sacred land of Bharat with his holy steps, continues to
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

            {/*
              The column ran out of content well before the map card did, which
              left a pane of empty ground on a laptop. A live countdown is the
              one thing on this page that changes by the second, so it earns the
              space rather than padding it.
            */}
            <Reveal delay={140}>
              <div className="relative mt-8 overflow-hidden rounded-2xl border border-pumpkin-200/70 bg-ink-0/70 p-5 backdrop-blur-sm sm:p-6">
                <LotusMandala className="spin-slow pointer-events-none absolute -right-10 -bottom-12 size-40 text-pumpkin-500/[0.08]" />
                <div className="relative">
                  <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
                    The Yatra begins in
                  </p>
                  <div className="mt-3">
                    <Countdown target={YATRA_START_ISO} ground="light" />
                  </div>
                  <p className="mt-3 text-xs text-ink-500">
                    16 January 2027 · {first?.name ?? "Kalady"}, Kerala
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="relative overflow-hidden rounded-2xl border border-pumpkin-200/70 bg-gradient-to-b from-ink-0 via-pumpkin-50/60 to-pumpkin-100/70 p-5 shadow-[0_18px_40px_-24px_rgba(94,39,5,0.35)] sm:p-8">
              <LotusMandala className="pointer-events-none absolute -top-8 -right-8 size-36 text-pumpkin-500/10 sm:-top-10 sm:-right-10 sm:size-48" />
              {/*
                The lamp the map sits over. Behind the landmass, breathing
                slowly, so the country reads as lit rather than printed.
              */}
              <div className="lamp-glow pointer-events-none absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pumpkin-300/25 blur-3xl sm:size-80" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
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

              <MapLegend className="relative mt-4 justify-center border-t border-pumpkin-200/70 pt-4" />
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ------------------------------------------------- the philosophy */}
      <section className="bg-hero-ink relative overflow-hidden">
        {/*
          The route itself drifts behind the Mahavakyas — held far back so the
          verse stays the thing being read, not the photograph.
        */}
        <PhotoBackdrop items={sequenced} className="opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950/90" />
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
      <section className="bg-dusk relative overflow-hidden border-t border-pumpkin-100">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
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
                <div className="lift h-full rounded-xl border border-pumpkin-200/60 bg-surface p-4">
                  <dd className="text-3xl font-semibold leading-none text-pumpkin-700">
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
              <div className="flex h-full flex-col justify-center rounded-2xl border border-pumpkin-200/60 bg-surface p-5 sm:p-6">
                <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
                  Across Bharat
                </p>
                <p className="mt-3 text-5xl font-semibold leading-none text-ink-900">
                  <CountUp value={heritage.length} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  sacred sites mapped along the Digvijaya Yatra: the Char Dham,
                  the four Mathas, the Jyotirlingas, Shakti Peethas and Saptapuris.
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------ inside Ekatma Dham */}
      <section className="bg-hero-ink relative overflow-hidden">
        <div className="aurora pointer-events-none absolute inset-0" />
        <LotusMandala className="spin-slow pointer-events-none absolute -top-24 -right-20 size-64 text-pumpkin-400/10 sm:size-80 lg:size-96" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-400 uppercase">
              Oneness through Vedanta
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-0 sm:text-3xl">
              The Yatra sets out from Ekatma Dham
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-0/70 sm:text-base">
              The Abode of Oneness at Omkareshwar is the home of the Acharya
              Shankar Sanskritik Ekta Nyas, which is organising this Yatra. The
              Statue of Oneness stands there, and Omkareshwar is halt eleven on
              the route.
            </p>
          </Reveal>

          {/*
            The statue's dimensions, taken from the Nyas's own site. Figures
            only — 108, 54 and 27 are stated identically on both its home page
            and its Statue of Oneness page, so they are safe to print.
          */}
          <Reveal delay={80}>
            <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
              {[
                { value: 108, unit: "feet", label: "The statue" },
                { value: 54, unit: "feet", label: "Its pedestal" },
                { value: 27, unit: "feet", label: "Lotus petal base" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-ink-0/15 bg-ink-0/5 p-4 text-center backdrop-blur-sm sm:p-5"
                >
                  <dd className="text-3xl font-semibold leading-none text-ink-0 sm:text-4xl">
                    <CountUp value={f.value} />
                    <span className="ml-1 text-sm font-normal text-pumpkin-400 sm:text-base">
                      {f.unit}
                    </span>
                  </dd>
                  <dt className="mt-2 text-[11px] tracking-wide text-ink-0/60 uppercase">
                    {f.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="stagger mt-8 grid gap-4 sm:grid-cols-3">
            {INSIDE_EKATMA_DHAM.map((card) => (
              <a
                key={card.title}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="lift group flex flex-col rounded-2xl border border-ink-0/15 bg-ink-0/5 p-5 backdrop-blur-sm transition-colors hover:border-pumpkin-400/50 hover:bg-ink-0/10"
              >
                <card.icon size={20} className="text-pumpkin-400" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg text-ink-0">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-0/65">
                  {card.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-pumpkin-400">
                  oneness.org.in
                  <ArrowUpRight
                    size={13}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- journey timeline */}
      <section className="bg-dusk relative overflow-hidden border-t border-pumpkin-100">
        <div className="bg-grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
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
            <div className="snap-row stagger mt-8 flex gap-3 overflow-x-auto pb-3 sm:gap-4">
              {sequenced.map((p) => (
                <article
                  key={p.id}
                  className="lift group flex h-full w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-pumpkin-200/60 bg-surface sm:w-72"
                >
                  {/* The place itself. Lazy by default — 21 photos must not
                      all load before the page is usable. */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 240px, 288px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : null}

                    {/* Stop number, over the photo. */}
                    <span className="absolute top-2.5 left-2.5 grid size-7 place-items-center rounded-full bg-pumpkin-500 text-[11px] font-semibold tabular-nums text-ink-900 shadow">
                      {p.routeOrder}
                    </span>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-2.5 pt-8">
                      <p className="font-display text-sm leading-tight text-ink-0">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-ink-0/70">
                        {[p.districtName, p.stateName].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3.5">
                    <p className="text-[11px] tabular-nums text-pumpkin-700">
                      {p.expectedArrival ? formatDate(p.expectedArrival) : "date TBC"}
                    </p>
                    {p.significance ? (
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-600">
                        {p.significance}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- role chooser */}
      <section className="bg-dawn relative overflow-hidden border-t border-pumpkin-100">
        <div className="bg-grain pointer-events-none absolute inset-0" />
        <LotusMandala className="spin-slow pointer-events-none absolute -bottom-24 -right-20 size-64 text-pumpkin-500/[0.06] sm:size-80" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
              Two ways to take part
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
              Join Ekatma Yatra
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              Most people simply join the Yatra: follow the route, see events
              nearby, be part of the journey. A smaller number step forward as
              volunteers, taking on a role the Yatra team defines and reviews.
            </p>
          </Reveal>

          <AccentRule className="mx-auto my-8 max-w-xs" />

          {/*
            Asymmetric on purpose: JOIN is the main action, large and first.
            VOLUNTEER sits beside it as a visibly smaller, quieter side card —
            same information shape, deliberately less weight, never an equal
            two-up grid.
          */}
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
            <Reveal className="sm:flex-[3]">
              <div className="lift flex h-full flex-col rounded-2xl border border-pumpkin-300/70 bg-surface p-6 shadow-[0_18px_40px_-24px_rgba(94,39,5,0.25)] sm:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-pumpkin-500 text-ink-900">
                  <JOIN.icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl text-ink-900 sm:text-2xl">
                  {JOIN.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-600 sm:text-base">
                  {JOIN.body}
                </p>
                <LinkButton href={JOIN.href} size="lg" className="mt-6 self-start">
                  {JOIN.cta}
                </LinkButton>
                <p className="mt-2.5 text-[11px] text-ink-500">{JOIN.note}</p>
              </div>
            </Reveal>

            <Reveal delay={80} className="sm:flex-[2]">
              <div className="flex h-full flex-col rounded-2xl border border-dashed border-ink-300 bg-surface/60 p-5">
                <span className="grid size-9 place-items-center rounded-lg bg-ink-100 text-ink-600">
                  <VOLUNTEER.icon size={17} aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display text-base text-ink-900">
                  {VOLUNTEER.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-600">
                  {VOLUNTEER.body}
                </p>
                <LinkButton
                  href={VOLUNTEER.href}
                  variant="outline"
                  size="sm"
                  className="mt-4 self-start"
                >
                  {VOLUNTEER.cta}
                </LinkButton>
                <p className="mt-2 text-[11px] text-ink-500">{VOLUNTEER.note}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/*
        The footer carries the Nyas's own details, taken from oneness.org.in and
        checked on two of its pages. The email is deliberately absent: it is
        obfuscated on their site, and a guessed address on a public page is worse
        than none. See docs/TEAM-QUESTIONS.md.
      */}
      <footer className="border-t border-pumpkin-100 bg-dawn">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <BrandLockup subtitle="Acharya Shankar Sanskritik Ekta Nyas" />
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                Ekatma Yatra 2027 · One Journey, One Consciousness
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                16 January – 10 May 2027 · Kalady to Kedarnath
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
                The wider mission
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  ["Ekatma Dham", "https://www.oneness.org.in/ekatma-dham"],
                  ["Statue of Oneness", "https://www.oneness.org.in/statue-of-oneness"],
                  ["Advaita Lok", "https://www.oneness.org.in/advait-lok"],
                  ["The Nyas", "https://www.oneness.org.in/nyas"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-ink-600 hover:text-pumpkin-700"
                    >
                      {label}
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.16em] text-pumpkin-700 uppercase">
                Acharya Shankar Sanskritik Ekta Nyas
              </p>
              <address className="mt-3 text-xs leading-relaxed text-ink-600 not-italic">
                Department of Culture, Government of Madhya Pradesh
                <br />
                Madhya Pradesh Tribal Museum, Shyamla Hills
                <br />
                Bhopal, Madhya Pradesh 462003
              </address>
              <a
                href="tel:+917554928869"
                className="mt-2 inline-block text-xs font-medium text-ink-700 tabular-nums hover:text-pumpkin-700"
              >
                +91 755-4928869
              </a>

              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  ["X (Twitter)", "https://www.twitter.com/EkatmaDham/"],
                  ["Facebook", "https://www.facebook.com/Ekatmadham/"],
                  ["Instagram", "https://www.instagram.com/ekatmadham/"],
                  ["YouTube", "https://www.youtube.com/@EkatmaDham"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ink-500 underline decoration-pumpkin-300 underline-offset-4 hover:text-pumpkin-700"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 border-t border-pumpkin-100 pt-5 text-[11px] leading-relaxed text-ink-500">
            Route, halts and dates are provisional, pending confirmation by the
            Yatra committee. Boundaries on the map are a cartographic reference,
            simplified for display.
          </p>
        </div>
      </footer>
    </div>
  );
}
