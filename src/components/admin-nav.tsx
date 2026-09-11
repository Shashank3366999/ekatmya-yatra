"use client";

/**
 * Admin navigation. Green is the sidebar's colour and belongs nowhere else in
 * the product.
 *
 *   >= lg   a static green sidebar
 *   < lg    a green top bar with a slide-in drawer, rather than a cramped
 *           horizontally-scrolling pill row that hides most of the sections
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Menu,
  Route,
  Settings2,
  Users,
  UserCheck,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/surveys", label: "Survey Inbox", icon: CalendarDays },
  { href: "/admin/organizers", label: "Organisers", icon: UserCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/route", label: "Yatra Route", icon: Route },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/automations", label: "Automations", icon: Settings2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function useIsActive() {
  const pathname = usePathname();
  // "/admin" is a prefix of every admin route, so match the root exactly.
  return (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pendingCount,
  onNavigate,
}: {
  pendingCount: number;
  onNavigate?: () => void;
}) {
  const isActive = useIsActive();

  return (
    <ul className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-pumpkin-500 text-ink-0"
                  : "text-ink-0/70 hover:bg-yatra-800 hover:text-ink-0"
              }`}
            >
              <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
              <span className="flex-1">{link.label}</span>

              {link.href === "/admin/organizers" && pendingCount > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-ink-0 text-pumpkin-700" : "bg-pumpkin-500 text-ink-0"
                  }`}
                  aria-label={`${pendingCount} awaiting approval`}
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop sidebar list. */
export function AdminNav({ pendingCount = 0 }: { pendingCount?: number }) {
  return (
    <nav aria-label="Admin sections">
      <NavList pendingCount={pendingCount} />
    </nav>
  );
}

/** Mobile drawer trigger + panel. */
export function AdminMobileNav({
  pendingCount = 0,
  children,
}: {
  pendingCount?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change and on Escape; lock scroll while open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-lg text-ink-0/80 hover:bg-yatra-800 hover:text-ink-0"
      >
        <Menu size={20} aria-hidden="true" />
        {pendingCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-pumpkin-500" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/60"
          />

          <div className="bg-nav-green absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4">
              <span className="font-display text-base text-ink-0">Sections</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="grid size-10 place-items-center rounded-lg text-ink-0/80 hover:bg-yatra-800 hover:text-ink-0"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Admin sections" className="flex-1 overflow-y-auto">
              <NavList pendingCount={pendingCount} onNavigate={() => setOpen(false)} />
            </nav>

            {children ? (
              <div className="border-t border-yatra-800 pt-4">{children}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
