import { AppHeader } from "@/components/app-header";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/mobile-shell";
import { LEVEL_LABELS } from "@/lib/permissions";
import { requireOrganizer } from "@/lib/session";

/** Organiser app shell. Guarded — pending organisers are sent to /pending. */
export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOrganizer();

  const scopeLabel = user.organizer
    ? [
        LEVEL_LABELS[user.organizer.level],
        user.organizer.districtName ?? user.organizer.stateName,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Administration";

  return (
    <AppShell>
      <AppHeader user={user} subtitle={scopeLabel} variant="organizer" />

      <main className="w-full flex-1 px-4 py-5">{children}</main>

      <BottomNav variant="organizer" />
    </AppShell>
  );
}
