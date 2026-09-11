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

export const metadata: Metadata = { title: "Become a Shankardoot" };

/**
 * Joining the organising team.
 *
 * This is the route in that needs approval, because it is a posting: a seat at
 * a level with a responsibility attached. Volunteering is not this — a
 * volunteer is an ordinary account at /register, with nothing to approve.
 */
export default async function RegisterOrganizerPage() {
  const [states, districtsByState, roleTemplates] = await Promise.all([
    listStates(),
    listDistrictsByState(),
    listRoleTemplates(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">
        Become a Shankardoot
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        A seat on the organising team at national, state or district level, with
        a responsibility of your own. Choose the role you are taking on.
      </p>

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
          roleTemplates={roleTemplates}
        />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Want to volunteer or simply follow the Yatra?{" "}
        <Link href="/register" className="font-medium text-pumpkin-700 underline">
          Create an account
        </Link>
        . No approval needed.
      </p>
    </div>
  );
}
