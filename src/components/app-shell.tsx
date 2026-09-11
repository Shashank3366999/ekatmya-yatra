/**
 * The mobile app shell for the User and Organiser apps.
 *
 * These two surfaces are mobile-first in the strong sense: the phone layout IS
 * the design at every screen size. The brief asks for exactly this — "keep the
 * mobile screen for volunteer app and user app, but keep the admin app more on
 * web" — and the Yatra team's note agrees ("mobile app के view में रहेगा mostly").
 *
 * So on a phone this fills the screen, and on a laptop the same app sits centred
 * on a tinted backdrop rather than stretching into a dashboard. One layout, one
 * set of behaviours, nothing that only exists at one width.
 *
 * The Admin panel deliberately does NOT use this — see src/app/admin/layout.tsx.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-app-backdrop flex min-h-dvh justify-center">
      {/*
        `max-w-app` is the phone column. The ring and shadow only appear once
        there is room around it, so a phone sees an edge-to-edge app and a
        laptop sees a deliberate, framed one.
      */}
      <div className="bg-background flex min-h-dvh w-full max-w-app flex-col sm:my-0 sm:shadow-2xl sm:ring-1 sm:ring-ink-200/70">
        {children}
      </div>
    </div>
  );
}
