import { AppHeader } from "@/components/app-header";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/mobile-shell";
import { requireUser } from "@/lib/session";

/** User app shell. Open to any signed-in account. */
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const subtitle = user.districtId
    ? "Your district"
    : "One Journey, One Consciousness";

  return (
    <AppShell>
      <AppHeader user={user} subtitle={subtitle} variant="user" />
      <main className="w-full flex-1 px-4 py-5">{children}</main>
      <BottomNav variant="user" />
    </AppShell>
  );
}
