"use client";

import type { AuthenticatedUser } from "@/hooks/useAuth";
import type { SummaryStats } from "@/hooks/useDashboardState";

const formatTime = (value: Date) =>
  value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

type DashboardHeaderProps = {
  summary: SummaryStats;
  filteredCount: number;
  lastUpdatedAt: Date;
  user: AuthenticatedUser;
  onSignOut: () => void | Promise<void>;
};

export const DashboardHeader = ({
  summary,
  filteredCount,
  lastUpdatedAt,
  user,
  onSignOut,
}: DashboardHeaderProps) => {
  return (
    <>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Undergraduation.com
          </p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Student Success Command Center
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Monitor student engagement, keep application milestones on track,
            and coordinate outreach across the advising team.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-end">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              {user.initials}
            </span>
            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-slate-700">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">{user.role}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign out
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              Data refreshed {formatTime(lastUpdatedAt)}
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">Total students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.total}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {filteredCount} showing with current filters
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">Active pipeline</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.active}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            In Exploring, Shortlisting, or Applying stages
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">
            Needs essay support
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.needsEssaySupport}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Students flagged for essay coaching help
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">
            Follow-ups overdue
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.overdue}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Last contact more than 7 days ago
          </p>
        </div>
      </section>
    </>
  );
};
