import type { Metadata } from "next";
import { Chip } from "@heroui/react";

import { PageTitle } from "@/components/ui/page-title";
import { formatDate, formatRelative, humanise } from "@/lib/format";
import { isSuperAdmin } from "@/lib/permissions";
import { listUsers } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

import { UserAccessForm } from "./access-form";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await listUsers(300);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Users & access"
        description="Everyone registered on the Yatra platform."
      />

      {/* Table from lg up; cards below, where a 7-column table is unusable. */}
      <div className="hidden overflow-x-auto rounded-xl border border-ink-200 bg-surface lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Area</Th>
              <Th>Account</Th>
              <Th>Active</Th>
              <Th>Last seen</Th>
              <Th>Access</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-ink-50">
                <Td>
                  <span className="font-medium text-ink-900">{u.fullName}</span>
                  <span className="block text-[11px] text-ink-400">
                    joined {formatDate(u.createdAt)}
                  </span>
                </Td>
                <Td className="text-ink-500">
                  {u.email}
                  {u.phone ? <span className="block">{u.phone}</span> : null}
                </Td>
                <Td className="text-ink-500">
                  {[u.districtName, u.stateName].filter(Boolean).join(", ") || "Not set"}
                </Td>
                <Td>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={
                      u.accountType === "super_admin" || u.accountType === "admin"
                        ? "warning"
                        : u.accountType === "organizer"
                          ? "accent"
                          : "default"
                    }
                  >
                    {humanise(u.accountType)}
                  </Chip>
                </Td>
                <Td>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={u.isActive ? "success" : "danger"}
                  >
                    {u.isActive ? "Active" : "Deactivated"}
                  </Chip>
                </Td>
                <Td className="whitespace-nowrap text-xs text-ink-400">
                  {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "never"}
                </Td>
                <Td>
                  {u.id === admin.id ? (
                    <span className="text-xs text-ink-400">You</span>
                  ) : (
                    <UserAccessForm
                      userId={u.id}
                      isActive={u.isActive}
                      accountType={u.accountType}
                      canGrantAdmin={isSuperAdmin(admin)}
                    />
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:hidden">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border border-ink-200 bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {u.fullName}
                </p>
                <p className="truncate text-xs text-ink-500">{u.email}</p>
                {u.phone ? (
                  <p className="truncate text-xs text-ink-500">{u.phone}</p>
                ) : null}
              </div>
              <Chip
                size="sm"
                variant="soft"
                color={u.isActive ? "success" : "danger"}
              >
                {u.isActive ? "Active" : "Off"}
              </Chip>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Chip
                size="sm"
                variant="soft"
                color={
                  u.accountType === "super_admin" || u.accountType === "admin"
                    ? "warning"
                    : u.accountType === "organizer"
                      ? "accent"
                      : "default"
                }
              >
                {humanise(u.accountType)}
              </Chip>
              <span className="text-[11px] text-ink-400">
                {[u.districtName, u.stateName].filter(Boolean).join(", ") || "No area"}
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-ink-400">
              joined {formatDate(u.createdAt)} · last seen{" "}
              {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "never"}
            </p>

            <div className="mt-3 border-t border-ink-200 pt-3">
              {u.id === admin.id ? (
                <span className="text-xs text-ink-400">This is your account</span>
              ) : (
                <UserAccessForm
                  userId={u.id}
                  isActive={u.isActive}
                  accountType={u.accountType}
                  canGrantAdmin={isSuperAdmin(admin)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] leading-relaxed text-ink-400">
        Deactivating an account signs the person out and blocks sign-in, but keeps
        everything they have filed. Only a super admin can grant admin access.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase"
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-3 align-top ${className}`}>{children}</td>;
}
