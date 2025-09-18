"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import type { Student } from "@/data/students";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardState } from "@/hooks/useDashboardState";
import { subscribeToStudents } from "@/services/students";

import { Loader } from "@/components/Loader";
import { StudentProfilePanelSkeleton } from "./StudentProfilePanelSkeleton";
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

type StudentDetailClientProps = {
  initialStudent: Student;
};

export const StudentDetailClient = ({
  initialStudent,
}: StudentDetailClientProps) => {
  const router = useRouter();
  const { user, isAuthenticated, isRestoring, logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([initialStudent]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isRestoring, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const ensureStudentPresent = (collection: Student[]) => {
      const match = collection.find((student) => student.id === initialStudent.id);
      if (!match) {
        setStudents([]);
        setError("Student is no longer available.");
        return;
      }
      setStudents([match]);
      setError(null);
    };

    const unsubscribe = subscribeToStudents(
      (latestStudents) => {
        if (cancelled) {
          return;
        }

        ensureStudentPresent(latestStudents);
        setIsLoading(false);
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
            : "Unable to subscribe to student updates.";

        setError(message);
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [initialStudent.id, isAuthenticated]);

  const {
    selectedStudent,
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
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm transition-colors">
            <Loader label="Loading student workspace..." />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16 transition-colors">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              ← Back to dashboard
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 transition">
              Signed in as {user.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-sm transition-colors">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm transition-colors">
            <Loader label="Refreshing student record..." size="sm" />
          </div>
        )}

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
    </div>
  );
};
