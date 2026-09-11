import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import { logout } from "@/actions/auth";
import { BrandLockup } from "@/components/brand";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

/**
 * Sticky header for the User and Organiser apps.
 *
 * One compact bar at every screen size: navigation lives in the bottom tab bar,
 * because these surfaces keep the phone layout on a laptop too.
 */
export function AppHeader({
  user,
  subtitle,
  variant,
  showBell = true,
}: {
  user: SessionUser;
  subtitle?: string;
  variant: "user" | "organizer";
  showBell?: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-ink-200 bg-surface/95 backdrop-blur-sm"
      /* Installed to a home screen the page draws under the status bar. */
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={variant === "user" ? "/home" : "/o"} className="min-w-0 flex-1">
          <BrandLockup subtitle={subtitle} />
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {showBell ? (
            <Link
              href="/announcements"
              className="grid size-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
              aria-label="Announcements"
            >
              <Bell size={18} aria-hidden="true" />
            </Link>
          ) : null}

          <form action={logout}>
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
              aria-label="Sign out"
              title={`Sign out (${user.email})`}
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </form>

          <span
            className="ml-1 grid size-9 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-xs font-semibold text-ink-0"
            title={user.fullName}
          >
            {initials(user.fullName)}
          </span>
        </div>
      </div>
    </header>
  );
}
