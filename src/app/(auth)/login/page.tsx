import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Continue to the Yatra. Small steps, a greater journey.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-pumpkin-500 underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Joining the organising team?{" "}
        <Link href="/register/organizer" className="font-medium text-pumpkin-500 underline">
          Register as an organiser
        </Link>
      </p>
    </div>
  );
}
