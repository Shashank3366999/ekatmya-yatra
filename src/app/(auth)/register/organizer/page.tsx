import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@heroui/react";

import { listDistrictsByState, listRoleTemplates, listStates } from "@/lib/queries";

import { RegisterOrganizerForm } from "./organizer-form";

/**
 * Rendered per request: it reads the states/districts reference tables and the
 * roles an admin has defined, and we do not want to require database access at
 * build time (nor bake in a stale list of either).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Join the organising team" };

/**
 * The two ways in, as the landing page offers them.
 *
 * `?as=volunteer` and `?as=committee` only change the framing and which
 * predefined roles are listed; both go to the same table and both wait for an
 * admin. Anything else falls back to the committee flow rather than erroring,
 * because this link gets shared.
 */
const COPY = {
  committee: {
    heading: "Join as an Organizing Team Member",
    lead: "A seat on the organising committee at national, state or district level, with a responsibility of your own.",
  },
  volunteer: {
    heading: "Join as a Volunteer",
    lead: "Give time on the ground as the Yatra moves through your area. Choose what you can help with and for how long.",
  },
} as const;

export default async function RegisterOrganizerPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const postingKind = as === "volunteer" ? "volunteer" : "committee";

  const [states, districtsByState, allTemplates] = await Promise.all([
    listStates(),
    listDistrictsByState(),
    listRoleTemplates(),
  ]);

  const roleTemplates = allTemplates.filter((t) => t.postingKind === postingKind);
  const copy = COPY[postingKind];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">{copy.heading}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{copy.lead}</p>

      <Alert status="accent" className="mt-5">
        <Alert.Content>
          <Alert.Title>Your access needs approval</Alert.Title>
          <Alert.Description>
            When you submit this, the Yatra team is notified and reviews your
            details. You can sign in straight away; your dashboard and checklist
            unlock once an admin approves you.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="mt-6">
        <RegisterOrganizerForm
          states={states}
          districtsByState={districtsByState}
          postingKind={postingKind}
          roleTemplates={roleTemplates}
        />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        {postingKind === "committee" ? (
          <>
            Would rather help on the ground?{" "}
            <Link
              href="/register/organizer?as=volunteer"
              className="font-medium text-pumpkin-500 underline"
            >
              Join as a volunteer
            </Link>
          </>
        ) : (
          <>
            Taking a seat on the committee?{" "}
            <Link
              href="/register/organizer?as=committee"
              className="font-medium text-pumpkin-500 underline"
            >
              Join as an organizing team member
            </Link>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Just following the Yatra?{" "}
        <Link href="/register" className="font-medium text-pumpkin-500 underline">
          Create a regular account
        </Link>
      </p>
    </div>
  );
}
