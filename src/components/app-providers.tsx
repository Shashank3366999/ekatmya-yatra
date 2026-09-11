"use client";

import { useRouter } from "next/navigation";
import { RouterProvider } from "@heroui/react";

/**
 * Client-side providers.
 *
 * HeroUI v3 needs no theme provider (it themes through CSS variables). Wiring
 * RouterProvider to the Next router makes every HeroUI Link and navigating
 * component use client-side navigation instead of a full page load.
 *
 * NOTE: HeroUI's `ToastProvider` is deliberately NOT mounted here. With
 * @heroui/react 3.2.4 + Next 16.3, wrapping the tree in it makes the server
 * emit no SSR HTML at all — the document body comes back as just the RSC
 * payload and everything renders client-side, which costs first paint and SEO.
 * Verified by bisecting the root layout: RouterProvider alone is fine.
 *
 * We do not need it: form feedback goes through `FormBanner`/`Alert`, which are
 * server-rendered. If toasts become necessary, mount the provider around the
 * specific subtree that needs them rather than the whole app, and re-check the
 * SSR output.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={router.push} useHref={(href) => href}>
      {children}
    </RouterProvider>
  );
}
