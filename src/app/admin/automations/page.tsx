import type { Metadata } from "next";
import { Alert, Chip } from "@heroui/react";
import { Bell, Clock, Mail } from "lucide-react";

import { toggleAutomation } from "@/actions/admin";
import { PageTitle } from "@/components/ui/page-title";
import { formatRelative } from "@/lib/format";
import { listAutomations } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Automations" };

const CHANNEL_ICON = {
  email: Mail,
  reminder: Clock,
  notification: Bell,
} as const;

/**
 * Automation switches.
 *
 * The registry and the toggles are real and persisted. Nothing dispatches yet —
 * no email/SMS provider has been chosen (docs/TEAM-QUESTIONS.md Q8) — and the
 * UI says so plainly rather than implying messages are going out.
 */
export default async function AdminAutomationsPage() {
  await requireAdmin();
  const automations = await listAutomations();

  const grouped = {
    email: automations.filter((a) => a.channel === "email"),
    reminder: automations.filter((a) => a.channel === "reminder"),
    notification: automations.filter((a) => a.channel === "notification"),
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Automations"
        description="Scheduled emails, reminders and notifications for the Yatra team."
      />

      <Alert status="warning">
        <Alert.Content>
          <Alert.Title>Not yet sending</Alert.Title>
          <Alert.Description>
            These switches are saved and will drive the dispatcher once a sending
            provider is configured. Turning one on now records the intent; no
            message is delivered yet.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      {(["email", "reminder", "notification"] as const).map((channel) => {
        const items = grouped[channel];
        if (items.length === 0) return null;
        const Icon = CHANNEL_ICON[channel];

        return (
          <section key={channel}>
            <h2 className="mb-2.5 flex items-center gap-2 font-display text-lg text-ink-900">
              <Icon size={17} className="text-ink-500" aria-hidden="true" />
              {channel === "email"
                ? "Email"
                : channel === "reminder"
                  ? "Reminders"
                  : "Notifications"}
            </h2>

            <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-surface">
              {items.map((a) => (
                <li key={a.id} className="flex items-start gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink-900">{a.name}</p>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={a.isEnabled ? "success" : "default"}
                      >
                        {a.isEnabled ? "Enabled" : "Disabled"}
                      </Chip>
                    </div>
                    {a.description ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                        {a.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ink-400">
                      updated {formatRelative(a.updatedAt)}
                    </p>
                  </div>

                  {/*
                    A plain form rather than a Switch: the toggle is a server
                    mutation, and this keeps it working without JavaScript.
                  */}
                  <form action={toggleAutomation} className="shrink-0">
                    <input type="hidden" name="automationId" value={a.id} />
                    <input type="hidden" name="isEnabled" value={String(!a.isEnabled)} />
                    <button
                      type="submit"
                      role="switch"
                      aria-checked={a.isEnabled}
                      aria-label={`${a.isEnabled ? "Disable" : "Enable"} ${a.name}`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        a.isEnabled ? "bg-pumpkin-500" : "bg-ink-300"
                      }`}
                    >
                      <span
                        className={`inline-block size-4.5 transform rounded-full bg-ink-0 shadow transition-transform ${
                          a.isEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
