import type { Metadata } from "next";
import { Alert } from "@heroui/react";

import { PageTitle } from "@/components/ui/page-title";
import { canSubmitSurvey } from "@/lib/permissions";
import { listDistrictsByState, listStates } from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

import { SurveyForm } from "./survey-form";

export const metadata: Metadata = { title: "New survey entry" };

export default async function NewSurveyPage() {
  const user = await requireOrganizer();

  if (!canSubmitSurvey(user)) {
    return (
      <div className="space-y-5">
        <PageTitle title="Survey entry" backHref="/o" />
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>Survey is not part of your approved role</Alert.Title>
            <Alert.Description>
              Ask the Yatra administration team to add the Survey or Route
              Planning responsibility to your posting.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );
  }

  const [states, districtsByState] = await Promise.all([
    listStates(),
    listDistrictsByState(),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="New survey entry"
        description="Record a place the Yatra should consider. Only the name and state are required — fill in the rest as you learn it."
        backHref="/o/survey"
      />
      <SurveyForm user={user} states={states} districtsByState={districtsByState} />
    </div>
  );
}
