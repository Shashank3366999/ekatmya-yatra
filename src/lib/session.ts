/**
 * Session handling: a signed JWT in an httpOnly cookie.
 *
 * Chosen over a full auth framework because the app is small, self-hosted, and
 * uses one credential provider. The token carries only the user id; everything
 * else is read fresh from the database each request, so an admin revoking access
 * or changing a role takes effect immediately rather than at token expiry.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";

import { getDb } from "@/db";
import { districts, organizerProfiles, states, users } from "@/db/schema";

import type { FunctionArea, SessionUser } from "./types";
import { canAccessOrganizerArea, isAdmin } from "./permissions";

const COOKIE_NAME = "yatra_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short (needs >= 32 chars). Copy .env.example to .env.local.",
    );
  }
  /*
    The example secret is in the repository, so in production it is a published
    signing key: anyone could mint a session cookie for any account, including
    an admin. Refusing to start is the only safe response.
  */
  if (process.env.APP_ENV === "production" && value.includes("dev-only-insecure")) {
    throw new Error(
      "AUTH_SECRET is still the example value from .env.example, which is public. " +
        "Generate one with `openssl rand -base64 32` and restart.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * The current user, or null. Wrapped in React's `cache` so the several
 * components that need it in one render share a single query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    return null; // expired, tampered, or signed with a rotated secret
  }

  const db = await getDb();

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      accountType: users.accountType,
      stateId: users.stateId,
      districtId: users.districtId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || !row.isActive) return null;

  // Load the organiser posting, resolving scope names for display.
  const [posting] = await db
    .select({
      id: organizerProfiles.id,
      level: organizerProfiles.level,
      stateId: organizerProfiles.stateId,
      districtId: organizerProfiles.districtId,
      primaryFunction: organizerProfiles.primaryFunction,
      additionalFunctions: organizerProfiles.additionalFunctions,
      designation: organizerProfiles.designation,
      isSpiritualRepresentative: organizerProfiles.isSpiritualRepresentative,
      availability: organizerProfiles.availability,
      availabilityNote: organizerProfiles.availabilityNote,
      status: organizerProfiles.status,
      reviewNote: organizerProfiles.reviewNote,
      stateName: states.name,
      districtName: districts.name,
    })
    .from(organizerProfiles)
    .leftJoin(states, eq(states.id, organizerProfiles.stateId))
    .leftJoin(districts, eq(districts.id, organizerProfiles.districtId))
    .where(eq(organizerProfiles.userId, userId))
    .limit(1);

  return {
    ...row,
    organizer: posting
      ? {
          ...posting,
          additionalFunctions: (posting.additionalFunctions ?? []) as FunctionArea[],
        }
      : null,
  };
});

/* -------------------------------------------------------------------------- */
/* Route guards                                                              */
/* -------------------------------------------------------------------------- */

/** Require any signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an operational organiser (or an admin). Sends pending/rejected
 * organisers to the status page rather than a bare 403.
 */
export async function requireOrganizer(): Promise<SessionUser> {
  const user = await requireUser();

  if (!canAccessOrganizerArea(user)) {
    if (user.accountType === "organizer") redirect("/pending");
    redirect("/home");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/home");
  return user;
}
