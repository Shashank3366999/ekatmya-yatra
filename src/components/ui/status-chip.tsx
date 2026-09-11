import { Chip } from "@heroui/react";

import {
  APPROVAL_STATUS_COLOR,
  APPROVAL_STATUS_LABELS,
  RECOMMENDATION_COLOR,
  RECOMMENDATION_LABELS,
  SURVEY_STATUS_COLOR,
  SURVEY_STATUS_LABELS,
} from "@/lib/labels";
import type { ApprovalStatus, Recommendation, SurveyStatus } from "@/lib/types";

/** Survey review status. */
export function SurveyStatusChip({
  status,
  size = "sm",
}: {
  status: SurveyStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Chip color={SURVEY_STATUS_COLOR[status]} variant="soft" size={size}>
      {SURVEY_STATUS_LABELS[status]}
    </Chip>
  );
}

/** Organiser approval status. */
export function ApprovalStatusChip({
  status,
  size = "sm",
}: {
  status: ApprovalStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Chip color={APPROVAL_STATUS_COLOR[status]} variant="soft" size={size}>
      {APPROVAL_STATUS_LABELS[status]}
    </Chip>
  );
}

/** Surveyor's recommendation strength. */
export function RecommendationChip({
  recommendation,
  size = "sm",
}: {
  recommendation: Recommendation;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Chip color={RECOMMENDATION_COLOR[recommendation]} variant="soft" size={size}>
      {RECOMMENDATION_LABELS[recommendation]}
    </Chip>
  );
}
