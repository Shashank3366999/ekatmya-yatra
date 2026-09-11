"use client";

/**
 * Primary navigation for the User and Organiser apps.
 *
 * A bottom tab bar at every screen size. These surfaces are mobile-first in the
 * strong sense — the phone layout is the design on a laptop too — so there is no
 * separate desktop navigation to keep in step with this one.
 *
 * It lives in this client module on purpose: Lucide icons are `forwardRef`
 * components, and passing them as props from a Server Component throws
 * "Functions cannot be passed directly to Client Components".
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Compass,
  Home,
  ListChecks,
  MapPinned,
  Route,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const USER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/yatra", label: "Yatra", icon: Compass },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/journey", label: "My Journey", icon: Route },
];

const ORGANIZER_NAV: NavItem[] = [
  { href: "/o", label: "Dashboard", icon: Home },
  { href: "/o/survey", label: "Survey", icon: MapPinned },
  { href: "/o/activities", label: "Checklists", icon: ListChecks },
  { href: "/o/profile", label: "Profile", icon: ClipboardList },
];

function items(variant: "user" | "organizer") {
  return variant === "user" ? USER_NAV : ORGANIZER_NAV;
}

/** "/o" is a prefix of every organiser route, so match the roots exactly. */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/o" || href === "/home"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
}

/** The app's tab bar, present at every screen size. */
export function BottomNav({ variant }: { variant: "user" | "organizer" }) {
  const isActive = useIsActive();

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-ink-200 bg-surface/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg">
        {items(variant).map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors active:bg-ink-100 ${
                  active ? "text-pumpkin-700" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
