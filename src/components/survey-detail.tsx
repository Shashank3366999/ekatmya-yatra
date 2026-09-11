import { Chip } from "@heroui/react";
import { MapPin, Phone, User } from "lucide-react";

import { AccentRule } from "@/components/brand";
import { RecommendationChip, SurveyStatusChip } from "@/components/ui/status-chip";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PLACE_CATEGORY_LABELS, YATRA_KIND_LABELS } from "@/lib/labels";
import type { surveySubmissions } from "@/db/schema";

type Survey = typeof surveySubmissions.$inferSelect;

/** Renders a tri-state boolean the way the field recorded it. */
function YesNo({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-ink-400">Not known</span>;
  return <span>{value ? "Yes" : "No"}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm text-ink-900">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Read-only presentation of a survey submission. Used by both the organiser's
 * own view and the admin review screen so the two can never drift apart.
 */
export function SurveyDetail({
  survey,
  stateName,
  districtName,
  submittedByName,
  submittedByEmail,
  showSubmitter = false,
}: {
  survey: Survey;
  stateName: string | null;
  districtName: string | null;
  submittedByName: string | null;
  submittedByEmail?: string | null;
  showSubmitter?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Headline */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <SurveyStatusChip status={survey.status} size="md" />
          <RecommendationChip recommendation={survey.recommendation} size="md" />
          <Chip size="md" variant="soft">
            {YATRA_KIND_LABELS[survey.proposedFor]}
          </Chip>
        </div>

        <h1 className="mt-3 font-display text-2xl leading-tight text-ink-900">
          {survey.placeName}
        </h1>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={14} aria-hidden="true" />
          {[districtName, stateName].filter(Boolean).join(", ") || "Location not set"}
        </p>

        <p className="mt-1 text-xs text-ink-400">
          {survey.reference} · filed {formatDateTime(survey.submittedAt)}
          {showSubmitter && submittedByName ? ` by ${submittedByName}` : ""}
        </p>
      </section>

      <AccentRule />

      {/* Significance — the most important field */}
      {survey.significance ? (
        <Block title="Significance to the Yatra">
          <p className="rounded-xl border border-ink-200 bg-surface p-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
            {survey.significance}
          </p>
        </Block>
      ) : null}

      {/* Location detail */}
      <Block title="Location">
        <dl className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-surface">
          <Row label="Type">{PLACE_CATEGORY_LABELS[survey.category]}</Row>
          {survey.addressNotes ? (
            <Row label="Address">{survey.addressNotes}</Row>
          ) : null}
          {survey.latitude !== null && survey.longitude !== null ? (
            <Row label="Coordinates">
              <a
                href={`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pumpkin-500 underline"
              >
                {survey.latitude.toFixed(5)}, {survey.longitude.toFixed(5)}
              </a>
            </Row>
          ) : (
            <Row label="Coordinates">
              <span className="text-ink-400">Not captured</span>
            </Row>
          )}
        </dl>
      </Block>

      {/* Capacity & facilities */}
      <Block title="Capacity & facilities">
        <dl className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-surface">
          <Row label="Expected gathering">
            {survey.expectedGathering !== null ? (
              `${formatNumber(survey.expectedGathering)} people`
            ) : (
              <span className="text-ink-400">Not estimated</span>
            )}
          </Row>
          <Row label="Vehicle access">
            <YesNo value={survey.isVehicleAccessible} />
          </Row>
          <Row label="Parking">
            <YesNo value={survey.hasParking} />
          </Row>
          <Row label="Stage or hall">
            <YesNo value={survey.hasStageOrHall} />
          </Row>
          <Row label="Accommodation nearby">
            <YesNo value={survey.hasAccommodation} />
          </Row>
        </dl>

        {survey.accessNotes ? (
          <p className="mt-2.5 rounded-lg bg-ink-50 px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line text-ink-600">
            {survey.accessNotes}
          </p>
        ) : null}
      </Block>

      {/* Contact */}
      {survey.contactName || survey.organizationsMet.length > 0 ? (
        <Block title="People & organisations met">
          <div className="rounded-xl border border-ink-200 bg-surface p-4">
            {survey.contactName ? (
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pumpkin-50 text-pumpkin-500">
                  <User size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{survey.contactName}</p>
                  {survey.contactRole ? (
                    <p className="text-xs text-ink-500">{survey.contactRole}</p>
                  ) : null}
                  {survey.contactPhone ? (
                    <a
                      href={`tel:${survey.contactPhone}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-pumpkin-500 underline"
                    >
                      <Phone size={12} aria-hidden="true" />
                      {survey.contactPhone}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {survey.organizationsMet.length > 0 ? (
              <div className={survey.contactName ? "mt-3.5 border-t border-ink-200 pt-3.5" : ""}>
                <p className="mb-1.5 text-xs text-ink-500">Organisations</p>
                <div className="flex flex-wrap gap-1.5">
                  {survey.organizationsMet.map((o) => (
                    <Chip key={o} size="sm" variant="soft">
                      {o}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Block>
      ) : null}

      {/* Observations */}
      {survey.observations ? (
        <Block title="Surveyor's observations">
          <p className="rounded-xl border border-ink-200 bg-surface p-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
            {survey.observations}
          </p>
        </Block>
      ) : null}

      {/* Submitter, for the admin view */}
      {showSubmitter && submittedByName ? (
        <Block title="Filed by">
          <dl className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-surface">
            <Row label="Name">{submittedByName}</Row>
            {submittedByEmail ? (
              <Row label="Email">
                <a href={`mailto:${submittedByEmail}`} className="text-pumpkin-500 underline">
                  {submittedByEmail}
                </a>
              </Row>
            ) : null}
          </dl>
        </Block>
      ) : null}

      {/* Admin's decision note, shown to the surveyor too */}
      {survey.adminNote ? (
        <Block title="Note from the administration">
          <p className="rounded-xl border border-pumpkin-200 bg-pumpkin-50 p-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
            {survey.adminNote}
          </p>
        </Block>
      ) : null}
    </div>
  );
}
