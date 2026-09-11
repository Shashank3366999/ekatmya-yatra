/**
 * Shared domain types. Derived from the Drizzle enums so the TypeScript union
 * and the Postgres enum can never drift apart.
 */
import type {
  accountTypeEnum,
  activityStatusEnum,
  availabilityEnum,
  approvalStatusEnum,
  audienceEnum,
  functionEnum,
  orgLevelEnum,
  placeCategoryEnum,
  postingKindEnum,
  recommendationEnum,
  surveyStatusEnum,
  yatraKindEnum,
} from "@/db/schema";

export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type Availability = (typeof availabilityEnum.enumValues)[number];
export type OrgLevel = (typeof orgLevelEnum.enumValues)[number];
export type FunctionArea = (typeof functionEnum.enumValues)[number];
export type ApprovalStatus = (typeof approvalStatusEnum.enumValues)[number];
export type PlaceCategory = (typeof placeCategoryEnum.enumValues)[number];
export type SurveyStatus = (typeof surveyStatusEnum.enumValues)[number];
export type Recommendation = (typeof recommendationEnum.enumValues)[number];
export type YatraKind = (typeof yatraKindEnum.enumValues)[number];
export type Audience = (typeof audienceEnum.enumValues)[number];
export type ActivityStatus = (typeof activityStatusEnum.enumValues)[number];
export type PostingKind = (typeof postingKindEnum.enumValues)[number];

/** The organiser posting attached to a session, if any. */
export type SessionOrganizer = {
  id: string;
  level: OrgLevel;
  stateId: string | null;
  districtId: string | null;
  stateName: string | null;
  districtName: string | null;
  primaryFunction: FunctionArea;
  additionalFunctions: FunctionArea[];
  designation: string | null;
  isSpiritualRepresentative: boolean;
  availability: Availability | null;
  availabilityNote: string | null;
  status: ApprovalStatus;
  /** Admin's note when rejecting or requesting changes. */
  reviewNote: string | null;
};

/**
 * The authenticated user as the app sees it. Assembled once per request in
 * src/lib/session.ts and passed down; pages never re-query identity.
 */
export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  stateId: string | null;
  districtId: string | null;
  isActive: boolean;
  organizer: SessionOrganizer | null;
};

/** Result shape returned by every Server Action, consumed by useActionState. */
export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
