import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@heroui/react";
import { ClipboardCheck, HandHeart, ShieldCheck } from "lucide-react";

import { AccentRule } from "@/components/brand";
import { PageTitle } from "@/components/ui/page-title";
import { listDistrictsByState, listStates } from "@/lib/queries";
import { requireUser } from "@/lib/session";

import { PostingRequestForm } from "./posting-form";

export const metadata: Metadata = { title: "Contribute" };

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Tell us your role",
    body: "Your level, your area, and what you want to work on.",
  },
  {
    icon: ShieldCheck,
    title: "The team reviews it",
    body: "The Yatra administration approves your posting.",
  },
  {
    icon: HandHeart,
    title: "Start contributing",
    body: "Your checklists and survey tools unlock straight away.",
  },
];

export default async function JoinPage() {
  const user = await requireUser();

  // Someone who already has a posting belongs on their own status screen.
  if (user.organizer) {
    redirect(user.organizer.status === "approved" ? "/o" : "/pending");
  }

  const [states, districtsByState] = await Promise.all([
    listStates(),
    listDistrictsByState(),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Be a part of the Yatra"
        description="Your contribution matters. Offer your time to the organising team."
        backHref="/home"
      />

      <Alert status="accent">
        <Alert.Content>
          <Alert.Title>How contributing works</Alert.Title>
          <Alert.Description>
            The organising team is structured by level (National, State and
            District) and by responsibility. You choose both, and the Yatra team
            confirms your posting.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <ol className="space-y-2.5">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex items-start gap-3.5 rounded-xl border border-ink-200 bg-surface p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pumpkin-50 text-pumpkin-500">
              <s.icon size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <AccentRule />

      <section>
        <h2 className="mb-1 font-display text-lg text-ink-900">Your posting</h2>
        <p className="mb-4 text-xs leading-relaxed text-ink-500">
          This is added to your existing account ({user.email}), so you will not need
          to sign in again.
        </p>
        <PostingRequestForm
          states={states}
          districtsByState={districtsByState}
          defaultStateId={user.stateId}
          defaultDistrictId={user.districtId}
        />
      </section>
    </div>
  );
}
