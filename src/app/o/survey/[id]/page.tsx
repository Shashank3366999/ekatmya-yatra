import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert } from "@heroui/react";

import { canViewSurvey } from "@/actions/survey";
import { SurveyDetail } from "@/components/survey-detail";
import { PageTitle } from "@/components/ui/page-title";
import { getSurvey } from "@/lib/queries";
import { requireOrganizer } from "@/lib/session";

export const metadata: Metadata = { title: "Survey entry" };

export default async function SurveyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const user = await requireOrganizer();
  const row = await getSurvey(id);
  if (!row) notFound();

  const allowed = await canViewSurvey(user, {
    submittedById: row.survey.submittedById,
    stateId: row.survey.stateId,
    districtId: row.survey.districtId,
  });
  if (!allowed) notFound();

  return (
    <div className="space-y-5">
      <PageTitle title="Survey entry" backHref="/o/survey" />

      {created ? (
        <Alert status="success">
          <Alert.Content>
            <Alert.Title>
              {row.survey.status === "draft"
                ? "Saved as a draft"
                : "Submitted to the Yatra administration"}
            </Alert.Title>
            <Alert.Description>
              Reference {row.survey.reference}. You can share this number with the
              team.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <SurveyDetail
        survey={row.survey}
        stateName={row.stateName}
        districtName={row.districtName}
        submittedByName={row.submittedByName}
      />
    </div>
  );
}
