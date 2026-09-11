"use server";

/**
 * Authentication Server Actions.
 *
 * All of these are reachable as public endpoints, so each one re-validates its
 * input with Zod and never trusts a client-supplied role or scope.
 */
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLog, organizerProfiles, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSessionUser } from "@/lib/session";
import type { ActionResult, FunctionArea } from "@/lib/types";
import {
  fieldErrors,
  firstError,
  loginSchema,
  registerOrganizerSchema,
  registerUserSchema,
} from "@/lib/validation";

/** Where to send someone after they sign in, based on what they are. */
function landingFor(accountType: string, organizerStatus?: string | null): string {
  if (accountType === "admin" || accountType === "super_admin") return "/admin";
  if (accountType === "organizer") {
    return organizerStatus === "approved" ? "/o" : "/pending";
  }
  return "/home";
}

export async function login(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const db = await getDb();
  const [account] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      accountType: users.accountType,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Same message either way — never reveal whether an email is registered.
  const invalid: ActionResult = { ok: false, error: "Email or password is incorrect." };
  if (!account) return invalid;

  const valid = await verifyPassword(parsed.data.password, account.passwordHash);
  if (!valid) return invalid;

  if (!account.isActive) {
    return {
      ok: false,
      error: "This account has been deactivated. Please contact the Yatra team.",
    };
  }

  const [posting] = await db
    .select({ status: organizerProfiles.status })
    .from(organizerProfiles)
    .where(eq(organizerProfiles.userId, account.id))
    .limit(1);

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, account.id));
  await createSession(account.id);

  redirect(landingFor(account.accountType, posting?.status));
}

export async function registerUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    stateId: formData.get("stateId") ?? "",
    districtId: formData.get("districtId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const db = await getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "An account with this email already exists. Try signing in." };
  }

  const [created] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      accountType: "user",
      stateId: parsed.data.stateId,
      districtId: parsed.data.districtId,
    })
    .returning({ id: users.id });

  await createSession(created.id);
  redirect("/home");
}

/**
 * Organiser signup. Creates the account AND a pending posting — access stays
 * inert until an admin approves it, per the approval flow in the brief.
 */
export async function registerOrganizer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerOrganizerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    stateId: formData.get("stateId") ?? "",
    districtId: formData.get("districtId") ?? "",
    postingKind: formData.get("postingKind") ?? "committee",
    roleTemplateId: formData.get("roleTemplateId") ?? "",
    level: formData.get("level"),
    primaryFunction: formData.get("primaryFunction"),
    additionalFunctions: formData.getAll("additionalFunctions") as string[],
    designation: formData.get("designation") ?? "",
    isSpiritualRepresentative: formData.get("isSpiritualRepresentative") === "on",
    availability: formData.get("availability"),
    availabilityNote: formData.get("availabilityNote") ?? "",
    motivation: formData.get("motivation") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = await getDb();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "An account with this email already exists. Try signing in." };
  }

  // Scope must agree with the declared level, so strip anything inconsistent.
  const stateId = data.level === "national" ? null : data.stateId;
  const districtId = data.level === "district" ? data.districtId : null;

  const [created] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: await hashPassword(data.password),
      fullName: data.fullName,
      phone: data.phone || null,
      accountType: "organizer",
      stateId,
      districtId,
    })
    .returning({ id: users.id });

  const additional = (data.additionalFunctions as FunctionArea[]).filter(
    (f) => f !== data.primaryFunction,
  );

  await db.insert(organizerProfiles).values({
    userId: created.id,
    postingKind: data.postingKind,
    roleTemplateId: data.roleTemplateId,
    level: data.level,
    stateId,
    districtId,
    primaryFunction: data.primaryFunction,
    additionalFunctions: additional,
    designation: data.designation,
    isSpiritualRepresentative: data.isSpiritualRepresentative,
    availability: data.availability,
    availabilityNote: data.availabilityNote,
    intake: data.motivation ? { motivation: data.motivation } : null,
    status: "pending",
  });

  await db.insert(auditLog).values({
    actorId: created.id,
    action: "organizer.signup",
    entityType: "organizer_profile",
    detail: {
      postingKind: data.postingKind,
      roleTemplateId: data.roleTemplateId,
      level: data.level,
      primaryFunction: data.primaryFunction,
    },
  });

  await createSession(created.id);
  redirect("/pending");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Used by the landing page to bounce an already-signed-in visitor onward. */
export async function redirectIfSignedIn(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  redirect(landingFor(user.accountType, user.organizer?.status));
}
