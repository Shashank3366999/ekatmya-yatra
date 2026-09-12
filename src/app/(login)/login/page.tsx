import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { YatraEmblem } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Sign in.
 *
 * Laid out as a phone screen first — the brand at the top against the sky, the
 * form resting at the bottom over the darker foliage, exactly where the eye and
 * the thumb already are. At `lg` the same two blocks become two columns beside
 * the figure rather than stacking over it.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-6xl lg:flex-row lg:items-center lg:gap-16 lg:px-12">
      {/* ------------------------------------------------------ the welcome */}
      <div className="relative px-6 pt-6 text-center sm:pt-14 lg:flex-1 lg:px-0 lg:text-left">
        <div className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 bg-gradient-to-b from-ink-950/70 via-ink-950/45 to-transparent lg:hidden" />
        <div className="relative">
        <YatraEmblem
          size={80}
          className="mx-auto size-14 text-pumpkin-400 drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)] sm:size-20 lg:mx-0 lg:size-28"
        />

        <h1 className="mt-3 font-display text-[1.75rem] leading-none text-ink-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:mt-4 sm:text-5xl">
          Ekatma <span className="text-pumpkin-400">Yatra</span>
        </h1>

        <p className="mt-2 text-sm font-medium text-ink-0/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] sm:mt-3 sm:text-lg">
          One Journey, One Consciousness.
        </p>

        <p className="mx-auto mt-3 inline-block rounded-full bg-ink-950/45 px-3.5 py-1 text-[11px] leading-relaxed text-ink-0/85 backdrop-blur-sm sm:mt-4 sm:px-4 sm:py-1.5 sm:text-sm lg:mx-0">
          A Yatra for a Viksit Bharat, in the tradition of Adi Shankaracharya
        </p>
        </div>
      </div>

      {/* --------------------------------------------------------- the form */}
      <div className="mt-auto w-full px-4 pb-5 sm:px-8 sm:pb-8 lg:mt-0 lg:w-[26rem] lg:shrink-0 lg:px-0 lg:pb-0">
        {/*
          Glass rather than a solid card: the photograph should still be felt
          behind the form, and a blurred dark panel keeps the fields legible on
          any part of the image.
        */}
        <div className="glass-panel rounded-2xl border border-ink-0/20 bg-ink-950/45 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-6">
          <LoginForm />

          <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
            <Link
              href="/register"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-ink-0/25 px-4 text-sm font-medium text-ink-0/90 transition-colors hover:border-ink-0/45 hover:bg-ink-0/10"
            >
              Create an account
            </Link>

            <Link
              href="/yatra"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-0/25 px-4 text-sm font-medium text-ink-0/90 transition-colors hover:border-ink-0/45 hover:bg-ink-0/10"
            >
              <Compass size={15} aria-hidden="true" />
              Explore the journey
            </Link>
          </div>

          <Link
            href="/register/organizer"
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-pumpkin-400 sm:mt-5 underline decoration-pumpkin-400/50 decoration-2 underline-offset-[6px] transition-colors hover:text-pumpkin-300"
          >
            Join the organising team
            <ArrowRight size={15} aria-hidden="true" />
          </Link>

          <div className="mt-4 border-t border-ink-0/12 pt-3 sm:mt-5 sm:pt-4">
            <Link
              href="/"
              className="block text-center text-[11px] font-medium text-ink-0/70 hover:text-ink-0"
            >
              ← Back to the Yatra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
