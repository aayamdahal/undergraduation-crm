"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentDirectoryPanel } from "@/components/dashboard/StudentDirectoryPanel";
import type { Student } from "@/data/students";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardState } from "@/hooks/useDashboardState";
import { subscribeToStudents } from "@/services/students";

import { StudentProfilePanelSkeleton } from "@/components/dashboard/StudentProfilePanelSkeleton";
import type { StudentProfilePanelProps } from "@/components/dashboard/StudentProfilePanel";

const StudentProfilePanel = dynamic<StudentProfilePanelProps>(
  () =>
    import("@/components/dashboard/StudentProfilePanel").then(
      (mod) => mod.StudentProfilePanel
    ),
  {
    ssr: false,
    loading: () => <StudentProfilePanelSkeleton />,
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isRestoring, logout } = useAuth();

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isRestoring, router]);

  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setStudents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const unsubscribe = subscribeToStudents(
      (latestStudents) => {
        if (cancelled) {
          return;
        }

        setStudents(latestStudents);
        setError(null);
        setIsLoading(false);
        setLastUpdatedAt(new Date());
      },
      (subscriptionError) => {
        if (cancelled) {
          return;
        }

        const message =
          subscriptionError instanceof Error
            ? subscriptionError.message
            : typeof subscriptionError === "string"
            ? subscriptionError
            : "Unable to fetch students.";

        setError(message);
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isAuthenticated]);

  const {
    summaryStats,
    filteredStudents,
    selectedStudent,
    selectedStudentId,
    selectStudent,
    searchTerm,
    setSearchTerm: updateSearchTerm,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    quickFilters,
    activeQuickFilters,
    toggleQuickFilter,
    noteDraft,
    updateNoteDraft,
    editingNoteId,
    startNoteEdit,
    cancelNoteEdit,
    saveNote,
    deleteNote,
    communicationForm,
    updateCommunicationForm,
    logCommunication,
    triggerFollowUp,
    reminderForm,
    updateReminderForm,
    createReminder,
    toggleReminderStatus,
    feedback,
    dismissFeedback,
  } = useDashboardState(students);

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-slate-100 pb-16 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm transition-colors">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 pb-16 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm transition-colors">
            Loading students...
          </div>
        </div>
      </div>
    );
  }

  const showEmptyState = students.length === 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-16 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12">
        <DashboardHeader
          summary={summaryStats}
          filteredCount={filteredStudents.length}
          lastUpdatedAt={lastUpdatedAt}
          user={user}
          onSignOut={logout}
        />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-sm transition-colors">
            {error}
          </div>
        )}

        {showEmptyState ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm transition-colors">
            {error
              ? "We couldn't load student records right now."
              : "No students available yet. Connect your Firebase project to start populating records."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,3fr)]">
            <StudentDirectoryPanel
              searchTerm={searchTerm}
              onSearchTermChange={updateSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={updateStatusFilter}
              quickFilters={quickFilters}
              activeQuickFilters={activeQuickFilters}
              onToggleQuickFilter={toggleQuickFilter}
              filteredStudents={filteredStudents}
              selectedStudentId={selectedStudentId}
              onSelectStudent={selectStudent}
            />

            <StudentProfilePanel
              student={selectedStudent}
              noteDraft={noteDraft}
              onNoteDraftChange={updateNoteDraft}
              editingNoteId={editingNoteId}
              onStartNoteEdit={startNoteEdit}
              onCancelNoteEdit={cancelNoteEdit}
              onSaveNote={saveNote}
              onDeleteNote={deleteNote}
              communicationForm={communicationForm}
              onCommunicationFormChange={updateCommunicationForm}
              onLogCommunication={logCommunication}
              onTriggerFollowUp={triggerFollowUp}
              reminderForm={reminderForm}
              onReminderFormChange={updateReminderForm}
              onCreateReminder={createReminder}
              onToggleReminderStatus={toggleReminderStatus}
              feedback={feedback}
              onDismissFeedback={dismissFeedback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
