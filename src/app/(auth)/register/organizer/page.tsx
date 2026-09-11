import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@heroui/react";

import { listDistrictsByState, listStates } from "@/lib/queries";

import { RegisterOrganizerForm } from "./organizer-form";

/**
 * Rendered per request: it reads the states/districts reference tables, and we
 * do not want to require database access at build time (nor bake in a stale
 * geography list).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Register as an organiser" };

export default async function RegisterOrganizerPage() {
  const [states, districtsByState] = await Promise.all([
    listStates(),
    listDistrictsByState(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">
        Join the organising team
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Tell us where you sit in the Yatra structure and what you will be working
        on. Contribute. Create impact.
      </p>

      <Alert status="accent" className="mt-5">
        <Alert.Content>
          <Alert.Title>Your access needs approval</Alert.Title>
          <Alert.Description>
            After you register, the Yatra team reviews your details. You will be
            able to sign in straight away, and your dashboard unlocks once approved.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="mt-6">
        <RegisterOrganizerForm states={states} districtsByState={districtsByState} />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Not part of the organising team?{" "}
        <Link href="/register" className="font-medium text-pumpkin-500 underline">
          Create a regular account
        </Link>
      </p>
    </div>
  );
}
