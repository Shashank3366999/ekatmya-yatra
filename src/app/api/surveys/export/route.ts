/**
 * CSV export of the survey inbox.
 *
 * Route planning happens in spreadsheets and shared docs as much as in an app,
 * so the admin can pull the current (filtered) view straight out. Honours the
 * caller's scope via listSurveys, and is admin-gated.
 */
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/permissions";
import { listSurveys } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

/** RFC 4180 quoting: wrap in quotes and double any internal quote. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (Array.isArray(value)) text = value.join("; ");

  // Guard against spreadsheet formula injection from free-text fields.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
}

const COLUMNS = [
  "Reference",
  "Place",
  "State",
  "District",
  "Type",
  "Proposed For",
  "Expected Gathering",
  "Recommendation",
  "Status",
  "Latitude",
  "Longitude",
  "Filed By",
  "Filed At",
] as const;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;

  const surveys = await listSurveys(
    user!,
    {
      status: params.get("status") ?? undefined,
      stateId: params.get("stateId") ?? undefined,
      category: params.get("category") ?? undefined,
      proposedFor: params.get("proposedFor") ?? undefined,
      q: params.get("q") ?? undefined,
    },
    5000,
  );

  const rows = surveys.map((s) =>
    [
      s.reference,
      s.placeName,
      s.stateName,
      s.districtName,
      s.category,
      s.proposedFor,
      s.expectedGathering,
      s.recommendation,
      s.status,
      s.latitude,
      s.longitude,
      s.submittedByName,
      s.submittedAt ? new Date(s.submittedAt).toISOString() : null,
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM so Excel opens UTF-8 place names correctly.
  const csv = "﻿" + [COLUMNS.join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ekatmya-yatra-surveys-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
