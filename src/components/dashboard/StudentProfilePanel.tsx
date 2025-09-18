"use client";

import type { FormEvent } from "react";

import type { CommunicationChannel, Note, Student } from "@/data/students";
import { formatDateTime, formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  CommunicationFormState,
  Feedback,
  ReminderFormState,
} from "@/hooks/useDashboardState";
import { useStudentSummary } from "@/hooks/useStudentSummary";

import {
  channelBadgeStyles,
  stageProgress,
  statusBadgeStyles,
  timelineAccent,
} from "./styles";

export type StudentProfilePanelProps = {
  student: Student | null;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  editingNoteId: string | null;
  onStartNoteEdit: (note: Note) => void;
  onCancelNoteEdit: () => void;
  onSaveNote: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  communicationForm: CommunicationFormState;
  onCommunicationFormChange: (updates: Partial<CommunicationFormState>) => void;
  onLogCommunication: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onTriggerFollowUp: () => Promise<void>;
  reminderForm: ReminderFormState;
  onReminderFormChange: (updates: Partial<ReminderFormState>) => void;
  onCreateReminder: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleReminderStatus: (reminderId: string) => Promise<void>;
  feedback: Feedback | null;
  onDismissFeedback: () => void;
};

export const StudentProfilePanel = ({
  student,
  noteDraft,
  onNoteDraftChange,
  editingNoteId,
  onStartNoteEdit,
  onCancelNoteEdit,
  onSaveNote,
  onDeleteNote,
  communicationForm,
  onCommunicationFormChange,
  onLogCommunication,
  onTriggerFollowUp,
  reminderForm,
  onReminderFormChange,
  onCreateReminder,
  onToggleReminderStatus,
  feedback,
  onDismissFeedback,
}: StudentProfilePanelProps) => {
  const {
    summary: summaryText,
    isLoading: isSummaryLoading,
    error: summaryError,
    refresh: refreshSummary,
  } = useStudentSummary(student);

  if (!student) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors">
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
          Select a student from the directory to view their journey.
        </div>
      </section>
    );
  }

  const tags = student.tags ?? [];
  const programInterests = student.programInterests ?? [];
  const timeline = student.timeline ?? [];
  const reminders = student.reminders ?? [];
  const notes = student.notes ?? [];
  const communications = student.communications ?? [];
  const stagePercent = stageProgress(student.status);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {student.name}
              </h2>
              <p className="text-sm text-slate-500">
                {student.email} · {student.phone}
              </p>
              <p className="text-xs text-slate-400">
                {student.country} · Grade {student.grade}
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    statusBadgeStyles[student.status]
                  )}
                >
                  {student.status}
                </span>
                <span>{stagePercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${stagePercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors">
              <p className="text-xs text-slate-500">Engagement score</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {student.engagementScore}/100
              </p>
              <p className="text-xs text-slate-400">
                Last active {formatRelative(student.lastActive)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors">
              <p className="text-xs text-slate-500">Essay drafts</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {student.essayDrafts}
              </p>
              <p className="text-xs text-slate-400">
                Needs essay help? {student.needsEssayHelp ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors">
              <p className="text-xs text-slate-500">Documents uploaded</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {student.documentsUploaded}
              </p>
              <p className="text-xs text-slate-400">
                Open applications: {student.openApplications}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors">
              <p className="text-xs text-slate-500">Program interests</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {programInterests.join(", ")}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                AI summary snapshot
              </p>
              {/* <button
                type="button"
                onClick={() => {
                  refreshSummary();
                }}
                disabled={!student || isSummaryLoading}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSummaryLoading ? "Generating..." : "Refresh"}
              </button> */}
            </div>
            <div className="mt-2 space-y-3 text-sm leading-6 text-slate-700">
              {isSummaryLoading ? (
                <p className="text-slate-500">
                  Generating personalized insight based on the latest
                  activity...
                </p>
              ) : summaryText ? (
                <p>{summaryText}</p>
              ) : summaryError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 shadow-sm transition-colors">
                  <p>{summaryError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      refreshSummary();
                    }}
                    className="mt-2 inline-flex items-center justify-center rounded-full border border-rose-500 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">
                  AI summary will appear once enough context is available for
                  this student.
                </p>
              )}
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden>{feedback.type === "success" ? "✔" : "ℹ"}</span>
              <p>{feedback.message}</p>
            </div>
            <button
              type="button"
              onClick={onDismissFeedback}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Log communication
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    void onTriggerFollowUp();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-500 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Trigger follow-up email
                </button>
              </div>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  void onLogCommunication(event);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col text-xs font-medium text-slate-600">
                    Channel
                    <select
                      value={communicationForm.channel}
                      onChange={(event) =>
                        onCommunicationFormChange({
                          channel: event.target.value as CommunicationChannel,
                        })
                      }
                      className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </label>
                  <label className="flex flex-col text-xs font-medium text-slate-600">
                    Owner
                    <input
                      value={communicationForm.owner}
                      onChange={(event) =>
                        onCommunicationFormChange({ owner: event.target.value })
                      }
                      placeholder="Team member"
                      className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col text-xs font-medium text-slate-600">
                  Summary
                  <input
                    value={communicationForm.subject}
                    onChange={(event) =>
                      onCommunicationFormChange({ subject: event.target.value })
                    }
                    placeholder="e.g. Called to discuss essay outline"
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col text-xs font-medium text-slate-600">
                  Internal notes
                  <textarea
                    value={communicationForm.notes}
                    onChange={(event) =>
                      onCommunicationFormChange({ notes: event.target.value })
                    }
                    rows={3}
                    placeholder="Capture key outcomes or next steps"
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Log communication
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors">
              <h3 className="text-base font-semibold text-slate-900">
                Interaction timeline
              </h3>
              <ul className="mt-4 space-y-4">
                {timeline.map((event) => (
                  <li key={event.id} className="relative pl-6">
                    <span
                      className={cn(
                        "absolute left-0 top-1.5 h-3 w-3 rounded-full",
                        timelineAccent[event.type]
                      )}
                      aria-hidden
                    />
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {event.label}
                          </span>
                        </span>
                        <span>{formatDateTime(event.date)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {event.details}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors">
              <h3 className="text-base font-semibold text-slate-900">
                Team reminders &amp; tasks
              </h3>
              <ul className="mt-3 space-y-3">
                {reminders.map((reminder) => {
                  const dueTime = new Date(reminder.dueDate).getTime();
                  const isOverdue = !reminder.completed && dueTime < Date.now();

                  return (
                    <li
                      key={reminder.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        reminder.completed
                          ? "border-emerald-200 bg-emerald-50"
                          : isOverdue
                          ? "border-rose-200 bg-rose-50"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              reminder.completed
                                ? "text-emerald-700 line-through"
                                : isOverdue
                                ? "text-rose-700"
                                : "text-slate-800"
                            )}
                          >
                            {reminder.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            Owner: {reminder.owner} · Due{" "}
                            {formatDateTime(reminder.dueDate)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void onToggleReminderStatus(reminder.id);
                          }}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                            reminder.completed
                              ? "bg-white text-emerald-600 hover:bg-slate-100"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          )}
                        >
                          {reminder.completed ? "Reopen" : "Mark done"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  void onCreateReminder(event);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col text-xs font-medium text-slate-600">
                    Due date &amp; time
                    <input
                      type="datetime-local"
                      value={reminderForm.dueDate}
                      onChange={(event) =>
                        onReminderFormChange({ dueDate: event.target.value })
                      }
                      className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col text-xs font-medium text-slate-600">
                    Owner
                    <input
                      value={reminderForm.owner}
                      onChange={(event) =>
                        onReminderFormChange({ owner: event.target.value })
                      }
                      placeholder="Team or teammate"
                      className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col text-xs font-medium text-slate-600">
                  Task
                  <input
                    value={reminderForm.description}
                    onChange={(event) =>
                      onReminderFormChange({ description: event.target.value })
                    }
                    placeholder="e.g. Prep essay review feedback"
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Schedule reminder
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Internal notes
                </h3>
                {editingNoteId && (
                  <button
                    type="button"
                    onClick={onCancelNoteEdit}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {note.author}
                      </span>
                      <span>
                        {formatDateTime(note.updatedAt ?? note.date)}
                        {note.updatedAt && " · updated"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {note.content}
                    </p>
                    <div className="mt-3 flex gap-3 text-xs font-medium text-indigo-600">
                      <button
                        type="button"
                        onClick={() => onStartNoteEdit(note)}
                        className="hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void onDeleteNote(note.id);
                        }}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  void onSaveNote(event);
                }}
              >
                <label className="flex flex-col text-xs font-medium text-slate-600">
                  Add a note
                  <textarea
                    value={noteDraft}
                    onChange={(event) => onNoteDraftChange(event.target.value)}
                    rows={4}
                    placeholder="Capture context, blockers, or handover notes"
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {editingNoteId ? "Save changes" : "Add note"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors">
              <h3 className="text-base font-semibold text-slate-900">
                Communication log
              </h3>
              <ul className="mt-3 space-y-3">
                {communications.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                          channelBadgeStyles[item.channel]
                        )}
                      >
                        {item.channel}
                      </span>
                      <span>{formatDateTime(item.date)}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {item.subject}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-sm text-slate-600">
                        {item.notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Handled by {item.owner}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
};
