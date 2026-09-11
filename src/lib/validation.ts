/**
 * Zod schemas for every Server Action input.
 *
 * Server Actions are public HTTP endpoints, so validation lives here and runs
 * on the server regardless of what the client sent.
 */
import { z } from "zod";

import {
  accountTypeEnum,
  approvalStatusEnum,
  availabilityEnum,
  functionEnum,
  orgLevelEnum,
  placeCategoryEnum,
  postingKindEnum,
  recommendationEnum,
  surveyStatusEnum,
  yatraKindEnum,
} from "@/db/schema";

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(320)
  .email("Enter a valid email address")
  .toLowerCase();

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200, "That password is too long");

/** Indian mobile numbers, tolerant of spaces, +91 and leading 0. */
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => v === "" || /^(\+91)?0?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number");

const uuid = z.string().uuid("Select a valid option");
/**
 * An id that may be absent.
 *
 * It has to accept `undefined` as well as `""`: a field that is not rendered at
 * all is missing from FormData rather than empty, and this schema is shared by
 * forms that render different subsets of it. As a bare `z.string()` it failed
 * any such form with "expected string, received undefined", naming no field.
 */
const optionalUuid = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((v) => {
    const trimmed = typeof v === "string" ? v.trim() : "";
    return trimmed === "" ? null : trimmed;
  })
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, "Select a valid option");

/** Checkbox values arrive as "on"/absent; selects as "true"/"false"/"". */
const optionalBool = z
  .string()
  .trim()
  .transform((v) => {
    if (v === "" || v === "unknown") return null;
    return v === "true" || v === "on" || v === "yes";
  });

const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v));

const optionalInt = (max = 10_000_000) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isFinite(v) && Number.isInteger(v) && v >= 0 && v <= max),
      "Enter a whole number",
    );

const optionalLat = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= -90 && v <= 90), "Latitude must be between -90 and 90");

const optionalLng = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= -180 && v <= 180), "Longitude must be between -180 and 180");

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerUserSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(160),
  email,
  phone: phone.optional(),
  password,
  stateId: optionalUuid,
  districtId: optionalUuid,
});

/**
 * The organiser posting fields — where someone sits in the Yatra structure and
 * which functional stream they work in.
 *
 * Split out from the signup schema because it is used twice: at organiser
 * registration, and when an existing signed-in user requests a posting on their
 * own account (src/actions/organizer.ts).
 */
export const organizerPostingSchema = z.object({
  /**
   * Committee seat or volunteer, and which predefined role was picked.
   *
   * Both are chosen before the form proper: the landing page sends people here
   * with `?as=`, and the role comes from the list an admin maintains, so the
   * server takes the id and reads the role back rather than trusting any of its
   * details from the client.
   */
  postingKind: z.enum(postingKindEnum.enumValues).default("committee"),
  roleTemplateId: optionalUuid,
  stateId: optionalUuid,
  districtId: optionalUuid,
  level: z.enum(orgLevelEnum.enumValues),
  primaryFunction: z.enum(functionEnum.enumValues),
  additionalFunctions: z.array(z.enum(functionEnum.enumValues)).max(8).default([]),
  designation: optionalText(160),
  isSpiritualRepresentative: z.coerce.boolean().default(false),
  /** How many days they can give — asked for explicitly by the Yatra team. */
  availability: z.enum(availabilityEnum.enumValues),
  availabilityNote: optionalText(300),
  motivation: optionalText(1000),
});

/**
 * Geographic scope must agree with the declared level, or the permission tuple
 * is meaningless — a "state organiser" with no state can see nothing.
 */
function checkScopeMatchesLevel(
  val: { level: string; stateId: string | null; districtId: string | null },
  ctx: z.RefinementCtx,
): void {
  if (val.level !== "national" && !val.stateId) {
    ctx.addIssue({ code: "custom", path: ["stateId"], message: "Select your state" });
  }
  if (val.level === "district" && !val.districtId) {
    ctx.addIssue({ code: "custom", path: ["districtId"], message: "Select your district" });
  }
}

/** Organiser posting requested by an already-signed-in user. */
export const organizerPostingRequestSchema =
  organizerPostingSchema.superRefine(checkScopeMatchesLevel);

/** Full organiser signup: identity plus posting. */
export const registerOrganizerSchema = registerUserSchema
  .extend(organizerPostingSchema.shape)
  .superRefine(checkScopeMatchesLevel);

/* -------------------------------------------------------------------------- */
/* Survey                                                                     */
/* -------------------------------------------------------------------------- */

export const surveySchema = z.object({
  placeName: z.string().trim().min(2, "Enter the name of the place").max(200),
  stateId: uuid,
  districtId: optionalUuid,
  addressNotes: optionalText(500),
  latitude: optionalLat,
  longitude: optionalLng,

  category: z.enum(placeCategoryEnum.enumValues),
  proposedFor: z.enum(yatraKindEnum.enumValues),
  significance: optionalText(2000),

  expectedGathering: optionalInt(5_000_000),
  hasParking: optionalBool,
  hasAccommodation: optionalBool,
  hasStageOrHall: optionalBool,
  isVehicleAccessible: optionalBool,
  accessNotes: optionalText(1000),

  contactName: optionalText(160),
  contactPhone: phone.optional(),
  contactRole: optionalText(160),
  organizationsMet: z
    .string()
    .trim()
    .transform((v) =>
      v === "" ? [] : v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    ),

  recommendation: z.enum(recommendationEnum.enumValues),
  observations: optionalText(4000),

  /** "draft" keeps it private to the surveyor; "submitted" sends it to the admin. */
  intent: z.enum(["draft", "submitted"]).default("submitted"),
});

export const surveyReviewSchema = z.object({
  surveyId: uuid,
  status: z.enum(surveyStatusEnum.enumValues),
  adminNote: optionalText(2000),
  /** When approving, optionally add the place to the Yatra route straight away. */
  addToRoute: z.coerce.boolean().default(false),
});

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Admin review of an organiser posting.
 *
 * The admin controls the whole posting, not just the verdict — "admin panel पे
 * सारे role control होते हैं". Someone may ask to join the national Survey team
 * and be placed in the Maharashtra chapter on Digital Media instead, so every
 * part of the posting is editable here.
 *
 * The team/role fields are optional so a plain approve or reject still works
 * without resubmitting the whole posting.
 */
export const organizerReviewSchema = z.object({
  profileId: uuid,
  status: z.enum(approvalStatusEnum.enumValues),
  reviewNote: optionalText(1000),

  /* -- the posting itself -- */
  level: z.enum(orgLevelEnum.enumValues).optional(),
  stateId: optionalUuid.optional(),
  districtId: optionalUuid.optional(),
  primaryFunction: z.enum(functionEnum.enumValues).optional(),
  additionalFunctions: z.array(z.enum(functionEnum.enumValues)).max(12).optional(),
  designation: optionalText(160).optional(),
  isSpiritualRepresentative: z.coerce.boolean().optional(),
});

export const userAccessSchema = z.object({
  userId: uuid,
  accountType: z.enum(accountTypeEnum.enumValues).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Give the announcement a title").max(200),
  body: z.string().trim().min(3, "Write the announcement").max(5000),
  audience: z.enum([
    "everyone",
    "users_only",
    "organizers_only",
    "national_organizers",
    "state_organizers",
    "district_organizers",
  ]),
  stateId: optionalUuid,
  districtId: optionalUuid,
});

export const automationToggleSchema = z.object({
  automationId: uuid,
  isEnabled: z.coerce.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Activities & journey                                                       */
/* -------------------------------------------------------------------------- */

export const checklistToggleSchema = z.object({
  itemId: uuid,
  isDone: z.coerce.boolean(),
});

export const activityReportSchema = z.object({
  activityId: uuid,
  body: z.string().trim().min(3, "Describe the update").max(4000),
  peopleMet: optionalText(1000),
  statusAtReport: z.enum(["not_started", "in_progress", "blocked", "completed"]),
});

export const journeyToggleSchema = z.object({
  placeId: uuid,
});

export const announcementLikeSchema = z.object({
  announcementId: uuid,
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Flatten a ZodError into the fieldErrors shape our forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** First error message, for a single-line form banner. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
