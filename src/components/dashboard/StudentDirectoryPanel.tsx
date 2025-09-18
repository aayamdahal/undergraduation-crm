"use client";

import Link from "next/link";

import {
  applicationStages,
  type ApplicationStatus,
  type Student,
} from "@/data/students";
import { formatRelative, daysSince } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  QuickFilterDefinition,
  QuickFilterKey,
} from "@/hooks/useDashboardState";

import { statusBadgeStyles } from "./styles";

type StudentDirectoryPanelProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: ApplicationStatus | "All";
  onStatusFilterChange: (value: ApplicationStatus | "All") => void;
  quickFilters: QuickFilterDefinition[];
  activeQuickFilters: QuickFilterKey[];
  onToggleQuickFilter: (filter: QuickFilterKey) => void;
  filteredStudents: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
};

export const StudentDirectoryPanel = ({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  quickFilters,
  activeQuickFilters,
  onToggleQuickFilter,
  filteredStudents,
  selectedStudentId,
  onSelectStudent,
}: StudentDirectoryPanelProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors">
      <div className="mt-2 mb-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Student directory
          </h2>
          <p className="mb-3 text-sm text-slate-500">
            Search, filter, and jump into any student record.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search name, email, or country"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-500 focus:outline-none"
            />
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"
              aria-hidden
            >
              ⌕
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(
                event.target.value as ApplicationStatus | "All"
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none sm:w-48"
          >
            <option value="All">All stages</option>
            {applicationStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const isActive = activeQuickFilters.includes(filter.key);
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onToggleQuickFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                isActive
                  ? "border-indigo-500 bg-indigo-600 text-white shadow"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-slate-500"
                )}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 sm:grid sm:grid-cols-[1.1fr_1fr_1fr] sm:px-6 sm:py-3">
          <span>Name &amp; email</span>
          <span>Status</span>
          <span className="text-right">Engagement</span>
        </div>
        <ul className="divide-y divide-slate-200">
          {filteredStudents.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-slate-500">
              No students match these filters. Try adjusting your search or
              quick filters.
            </li>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = student.id === selectedStudentId;
              return (
                <li
                  key={student.id}
                  className={cn(
                    "cursor-pointer transition hover:bg-indigo-50/50",
                    isSelected && "bg-indigo-50/80"
                  )}
                  onClick={() => onSelectStudent(student.id)}
                >
                  <div className="flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[1.1fr_1fr_1fr] sm:items-start sm:gap-4">
                    <div>
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 font-medium text-slate-900 underline-offset-4 transition hover:text-indigo-600 hover:underline"
                      >
                        {student.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {student.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        {student.country} · Last active{" "}
                        {formatRelative(student.lastActive)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                          statusBadgeStyles[student.status]
                        )}
                      >
                        {student.status}
                      </span>
                      {student.highIntent && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          High intent
                        </span>
                      )}
                      {daysSince(student.lastContacted) > 7 && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                          Needs follow-up
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-500 sm:items-end sm:text-right">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex-col sm:items-end sm:gap-1">
                        <p className="text-base font-semibold text-slate-900 sm:text-lg">
                          {student.engagementScore}
                          <span className="ml-1 text-xs font-medium text-slate-500">/100</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Essays: {student.essayDrafts} · Docs: {student.documentsUploaded}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        Last contacted {formatRelative(student.lastContacted)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </section>
  );
};
