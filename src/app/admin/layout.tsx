import Link from "next/link";

import { logout } from "@/actions/auth";
import { AdminMobileNav, AdminNav } from "@/components/admin-nav";
import { YatraMark } from "@/components/brand";
import { initials } from "@/lib/format";
import { adminPendingCounts } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

/**
 * Admin shell.
 *
 * The brief asks for the admin panel to be web-first, but admins also open it on
 * a phone — so this is a static green sidebar from `lg` up, and a green top bar
 * with a slide-in drawer below that. Green is the sidebar's colour and is used
 * nowhere else in the product.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  /*
    What is waiting for this admin, scoped to what they can act on. Read here
    rather than per screen so every section shows the same counts.
  */
  const pending = await adminPendingCounts(admin);
  const badges = {
    "/admin/organizers": pending.organisers,
    "/admin/surveys": pending.surveys,
  };

  const account = (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-xs font-semibold text-ink-900">
          {initials(admin.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-0">{admin.fullName}</p>
          <p className="truncate text-[11px] text-ink-0/60">{admin.email}</p>
        </div>
      </div>
      <form action={logout} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-lg border border-yatra-600 px-3 py-2 text-xs font-medium text-ink-0/80 hover:bg-yatra-800 hover:text-ink-0"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header
        className="bg-nav-green sticky top-0 z-40 flex items-center gap-3 px-4 py-2.5 lg:hidden"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.625rem)" }}
      >
        <AdminMobileNav badges={badges}>{account}</AdminMobileNav>

        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <YatraMark size={26} className="shrink-0 text-pumpkin-400" />
          <span className="truncate leading-tight">
            <span className="block font-display text-sm text-ink-0">Ekatma Yatra</span>
            <span className="block text-[10px] text-ink-0/60">Administration</span>
          </span>
        </Link>

        <span className="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-pumpkin-500 text-[11px] font-semibold text-ink-900">
          {initials(admin.fullName)}
        </span>
      </header>

      {/* Desktop sidebar */}
      <aside className="bg-nav-green hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-col lg:justify-between">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <Link href="/admin" className="flex items-center gap-2.5 px-1 pb-5">
            <YatraMark size={30} className="text-pumpkin-400" />
            <span className="leading-tight">
              <span className="block font-display text-base text-ink-0">
                Ekatma Yatra
              </span>
              <span className="block text-[11px] text-ink-0/60">Administration</span>
            </span>
          </Link>

          <AdminNav badges={badges} />
        </div>

        <div className="border-t border-yatra-800 p-4">{account}</div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
