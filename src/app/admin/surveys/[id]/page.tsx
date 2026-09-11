import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SurveyDetail } from "@/components/survey-detail";
import { PageTitle } from "@/components/ui/page-title";
import { getSurvey } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

import { ReviewPanel } from "./review-panel";

export const metadata: Metadata = { title: "Review survey" };

export default async function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  const row = await getSurvey(id);
  if (!row) notFound();

  return (
    <div className="space-y-5">
      <PageTitle title="Survey entry" backHref="/admin/surveys" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SurveyDetail
            survey={row.survey}
            stateName={row.stateName}
            districtName={row.districtName}
            submittedByName={row.submittedByName}
            submittedByEmail={row.submittedByEmail}
            showSubmitter
          />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <ReviewPanel
              surveyId={row.survey.id}
              currentStatus={row.survey.status}
              currentNote={row.survey.adminNote}
              alreadyOnRoute={Boolean(row.survey.linkedPlaceId)}
              hasCoordinates={
                row.survey.latitude !== null && row.survey.longitude !== null
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
