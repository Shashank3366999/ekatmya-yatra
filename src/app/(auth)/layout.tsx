import Link from "next/link";

import { AccentRule, BrandLockup, ThemeBanner } from "@/components/brand";

/**
 * Auth shell.
 *
 * A themed banner across the top at every width, with the form centred beneath.
 * The statue photograph is reserved for the public landing hero — repeating it
 * here made it wallpaper, and the landscape source could not fill a tall column
 * without either cropping to a sliver or floating in a corner.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemeBanner motif="arches" className="h-40 sm:h-48">
        <div className="mx-auto flex h-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-12 lg:py-7">
          <BrandLockup subtitle="Acharya Shankar Sanskritik Ekta Nyas" tone="light" />

          <div className="max-w-md">
            <p className="font-display text-xl leading-snug text-ink-0 sm:text-2xl">
              One Journey. One Consciousness.
            </p>
            <AccentRule className="mt-3 max-w-[11rem]" />
          </div>
        </div>
      </ThemeBanner>

      <main className="flex flex-1 flex-col px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="text-xs font-medium text-ink-500 hover:text-ink-900">
            ← Back to the Yatra
          </Link>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
