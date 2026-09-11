import type { Metadata } from "next";

import { AccentRule } from "@/components/brand";
import { PageTitle } from "@/components/ui/page-title";
import { FUNCTION_LABELS, TEAM_LABELS } from "@/lib/permissions";
import { listRoleTemplates } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

import { RoleForm, RoleVisibilityButton } from "./role-form";

export const metadata: Metadata = { title: "Roles & Checklists" };

/**
 * The roles on offer to joiners, and the checklist each one carries.
 *
 * This is the piece the Yatra team's flow turns on: the panel holds the roles
 * in advance, a joiner picks one while signing up and can see what it involves,
 * and on approval that checklist becomes their own work to report against.
 */
export default async function AdminRolesPage() {
  await requireAdmin();
  const templates = await listRoleTemplates({ includeInactive: true });

  const committee = templates.filter((t) => t.postingKind === "committee");
  const volunteer = templates.filter((t) => t.postingKind === "volunteer");

  return (
    <div className="space-y-6">
      <PageTitle
        title="Roles & Checklists"
        description="What someone can sign up as, and the checklist they take on. Active roles appear on the signup form; approving someone copies the checklist onto their own dashboard."
      />

      {[
        ["Organizing Team Member", committee] as const,
        ["Volunteer", volunteer] as const,
      ].map(([label, list]) => (
        <section key={label}>
          <h2 className="font-display text-lg text-ink-900">{label}</h2>
          <AccentRule className="mt-2 max-w-[7rem]" />

          {list.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-ink-300 bg-surface p-4 text-sm text-ink-500">
              No roles defined for this route in yet. Anyone signing up this way
              will be asked for their team and responsibility directly.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-ink-200 bg-surface p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base text-ink-900">{t.name}</p>
                      <p className="mt-1 text-xs text-ink-500">
                        {TEAM_LABELS[t.level]} · {FUNCTION_LABELS[t.functionArea]} ·{" "}
                        {t.items.length} checklist{" "}
                        {t.items.length === 1 ? "point" : "points"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          t.isActive
                            ? "bg-pumpkin-50 text-pumpkin-700"
                            : "bg-ink-100 text-ink-500"
                        }`}
                      >
                        {t.isActive ? "On the signup form" : "Hidden"}
                      </span>
                      <RoleVisibilityButton templateId={t.id} isActive={t.isActive} />
                    </div>
                  </div>

                  {t.description ? (
                    <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-ink-600">
                      {t.description}
                    </p>
                  ) : null}

                  {t.items.length > 0 ? (
                    <ol className="mt-3 space-y-1.5">
                      {t.items.map((item, i) => (
                        <li key={item} className="flex gap-2.5 text-sm text-ink-700">
                          <span className="w-4 shrink-0 text-right text-xs tabular-nums text-ink-400">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium text-pumpkin-600">
                      Edit this role
                    </summary>
                    <div className="mt-4 border-t border-ink-200 pt-4">
                      <RoleForm template={t} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="rounded-xl border border-ink-200 bg-surface p-4 sm:p-5">
        <h2 className="font-display text-lg text-ink-900">Add a role</h2>
        <p className="mt-1 text-sm text-ink-500">
          One checklist point per line. It appears on the signup form straight
          away.
        </p>
        <div className="mt-4">
          <RoleForm />
        </div>
      </section>
    </div>
  );
}
