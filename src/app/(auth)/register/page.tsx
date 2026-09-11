import type { Metadata } from "next";
import Link from "next/link";

import { listDistrictsByState, listStates } from "@/lib/queries";

import { RegisterUserForm } from "./register-form";

/**
 * Rendered per request: it reads the states/districts reference tables, and we
 * do not want to require database access at build time (nor bake in a stale
 * geography list).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  const [states, districtsByState] = await Promise.all([
    listStates(),
    listDistrictsByState(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Join the Yatra</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Explore the journey, follow the route, and see what is happening near you.
      </p>

      <div className="mt-6">
        <RegisterUserForm states={states} districtsByState={districtsByState} />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pumpkin-500 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
