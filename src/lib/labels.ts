/**
 * Display labels and option lists for the domain enums.
 *
 * Kept in one place because several of these are provisional — the Yatra team
 * has still to confirm official terminology (docs/TEAM-QUESTIONS.md). Changing
 * a label here changes it everywhere it appears.
 */
import type {
  ActivityStatus,
  ApprovalStatus,
  Availability,
  PlaceCategory,
  Recommendation,
  SurveyStatus,
  YatraKind,
} from "./types";

/**
 * How much time a Shankardoot can give. The Yatra team asks for this alongside
 * the responsibility — three days of survey work and the whole Yatra are very
 * different commitments to plan around.
 */
export const AVAILABILITY_LABELS: Record<Availability, string> = {
  few_days: "A few days",
  one_week: "About a week",
  two_weeks: "About two weeks",
  one_month: "About a month",
  full_yatra: "The full Yatra",
  flexible: "Flexible / as needed",
};

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  religious: "Religious / Temple",
  educational: "Educational",
  social: "Social",
  advaita_heritage: "Advaita / Shankaracharya Heritage",
  institution: "Institution",
  crowd_gathering: "Crowd Gathering Point",
  civic: "Civic / Government",
  other: "Other",
};

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  approved: "Approved",
  rejected: "Not Selected",
};

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  strongly_recommended: "Strongly Recommended",
  recommended: "Recommended",
  possible: "Possible",
  not_suitable: "Not Suitable",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

export const YATRA_KIND_LABELS: Record<YatraKind, string> = {
  main: "Main Yatra",
  sub: "Sub-Yatra / Upayatra",
};

/** Maps a status to a HeroUI Chip colour. */
/**
 * Status colours follow the Yatra team's mental model: a submitted item is
 * *pending* until an admin acts on it — "जब वो submit करेंगे तो yellow mark
 * होगा, जब approve होगा तो done mark" — so only `approved` is green.
 */
export const SURVEY_STATUS_COLOR: Record<
  SurveyStatus,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  draft: "default",
  submitted: "warning",
  under_review: "warning",
  shortlisted: "accent",
  approved: "success",
  rejected: "danger",
};

export const APPROVAL_STATUS_COLOR: Record<
  ApprovalStatus,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  changes_requested: "warning",
};

export const RECOMMENDATION_COLOR: Record<
  Recommendation,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  strongly_recommended: "success",
  recommended: "accent",
  possible: "warning",
  not_suitable: "danger",
};

/**
 * How an activity's progress reads to a person.
 *
 * The Yatra team's own convention for the states, from the voice note: yellow
 * while it is with someone, done once it is finished.
 */
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
};
