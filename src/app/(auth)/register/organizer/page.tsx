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

export const metadata: Metadata = { title: "Join as Volunteer" };

/**
 * Joining as a volunteer.
 *
 * A volunteer takes on a specific responsibility under a role the Yatra team
 * defines — survey, logistics, outreach, and whatever else an admin adds at
 * /admin/roles — which is why this needs approval and a checklist. It is not
 * the same thing as simply joining the Yatra, which is the ordinary account at
 * /register with nothing to approve; that is the site's main action, and this
 * is the secondary one.
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
        Join as Volunteer
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Take on a role the Yatra team has defined: at national, state or
        district level, with a checklist of its own. Choose the one that fits.
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
        Just want to follow the Yatra?{" "}
        <Link href="/register" className="font-medium text-pumpkin-700 underline">
          Join Ekatma Yatra
        </Link>
        . No approval needed.
      </p>
    </div>
  );
}
