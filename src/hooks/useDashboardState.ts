import { type FormEvent, useEffect, useMemo, useState } from "react";

import type {
  ApplicationStatus,
  CommunicationChannel,
  Note,
  Student,
} from "@/data/students";
import { daysSince } from "@/lib/dates";
import {
  createStudentNote,
  createStudentReminder,
  deleteStudentNote,
  logStudentCommunication,
  toggleStudentReminderCompletion,
  triggerStudentFollowUp,
  updateStudentNote,
} from "@/services/students";

export type QuickFilterKey =
  | "notContacted"
  | "highIntent"
  | "needsEssayHelp";

export type QuickFilterDefinition = {
  key: QuickFilterKey;
  label: string;
  count: number;
};

export type Feedback = {
  type: "success" | "info";
  message: string;
};

export type CommunicationFormState = {
  channel: CommunicationChannel;
  subject: string;
  notes: string;
  owner: string;
};

export type ReminderFormState = {
  dueDate: string;
  description: string;
  owner: string;
};

export type SummaryStats = {
  total: number;
  active: number;
  needsEssaySupport: number;
  highIntent: number;
  overdue: number;
};

type UseDashboardStateReturn = {
  summaryStats: SummaryStats;
  filteredStudents: Student[];
  selectedStudent: Student | null;
  selectedStudentId: string | null;
  selectStudent: (studentId: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: ApplicationStatus | "All";
  setStatusFilter: (value: ApplicationStatus | "All") => void;
  activeQuickFilters: QuickFilterKey[];
  toggleQuickFilter: (filter: QuickFilterKey) => void;
  quickFilters: QuickFilterDefinition[];
  noteDraft: string;
  updateNoteDraft: (value: string) => void;
  editingNoteId: string | null;
  startNoteEdit: (note: Note) => void;
  cancelNoteEdit: () => void;
  saveNote: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  communicationForm: CommunicationFormState;
  updateCommunicationForm: (updates: Partial<CommunicationFormState>) => void;
  logCommunication: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  triggerFollowUp: () => Promise<void>;
  reminderForm: ReminderFormState;
  updateReminderForm: (updates: Partial<ReminderFormState>) => void;
  createReminder: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  toggleReminderStatus: (reminderId: string) => Promise<void>;
  feedback: Feedback | null;
  dismissFeedback: () => void;
};

const DEFAULT_NOTE_AUTHOR = "Admissions Team";
const DEFAULT_OWNER = "Advising Team";

export const useDashboardState = (
  students: Student[]
): UseDashboardStateReturn => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null
  );
  const [searchTerm, setSearchTermState] = useState("");
  const [statusFilter, setStatusFilterState] =
    useState<ApplicationStatus | "All">("All");
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilterKey[]>(
    []
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [optimisticDeletedNotes, setOptimisticDeletedNotes] = useState<
    Record<string, string[]>
  >({});
  const [communicationForm, setCommunicationForm] =
    useState<CommunicationFormState>({
      channel: "Call",
      subject: "",
      notes: "",
      owner: DEFAULT_OWNER,
    });
  const [reminderForm, setReminderForm] = useState<ReminderFormState>({
    dueDate: "",
    description: "",
    owner: DEFAULT_OWNER,
  });
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const trimmedSearch = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = trimmedSearch
        ? [student.name, student.email, student.country]
            .join(" ")
            .toLowerCase()
            .includes(trimmedSearch)
        : true;

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      const satisfiesQuickFilters = activeQuickFilters.every((filterKey) => {
        switch (filterKey) {
          case "notContacted":
            return daysSince(student.lastContacted) > 7;
          case "highIntent":
            return student.highIntent;
          case "needsEssayHelp":
            return student.needsEssayHelp;
          default:
            return true;
        }
      });

      return matchesSearch && matchesStatus && satisfiesQuickFilters;
    });
  }, [students, trimmedSearch, statusFilter, activeQuickFilters]);

  const selectedStudent = useMemo(() => {
    const baseStudent = students.find(
      (student) => student.id === selectedStudentId
    );
    if (!baseStudent) {
      return null;
    }

    const pendingDeletions = optimisticDeletedNotes[baseStudent.id] ?? [];
    if (pendingDeletions.length === 0) {
      return baseStudent;
    }

    return {
      ...baseStudent,
      notes:
        baseStudent.notes?.filter(
          (note) => !pendingDeletions.includes(note.id)
        ) ?? [],
    } satisfies Student;
  }, [students, selectedStudentId, optimisticDeletedNotes]);

  useEffect(() => {
    setOptimisticDeletedNotes((current) => {
      let didChange = false;
      const next: Record<string, string[]> = {};

      for (const [studentId, noteIds] of Object.entries(current)) {
        const student = students.find((item) => item.id === studentId);
        if (!student) {
          didChange = true;
          continue;
        }

        const remaining = noteIds.filter((noteId) =>
          (student.notes ?? []).some((note) => note.id === noteId)
        );

        if (remaining.length > 0) {
          next[studentId] = remaining;
          if (remaining.length !== noteIds.length) {
            didChange = true;
          }
        } else if (noteIds.length > 0) {
          didChange = true;
        }
      }

      return didChange ? next : current;
    });
  }, [students]);

  useEffect(() => {
    if (filteredStudents.length === 0) {
      if (selectedStudentId !== null) {
        setSelectedStudentId(null);
      }
      return;
    }

    if (!filteredStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    setNoteDraft("");
    setEditingNoteId(null);
  }, [selectedStudentId]);

  const summaryStats = useMemo<SummaryStats>(() => {
    const total = students.length;
    const active = students.filter((student) => student.status !== "Submitted")
      .length;
    const needsEssaySupport = students.filter(
      (student) => student.needsEssayHelp
    ).length;
    const highIntent = students.filter((student) => student.highIntent).length;
    const overdue = students.filter(
      (student) => daysSince(student.lastContacted) > 7
    ).length;

    return {
      total,
      active,
      needsEssaySupport,
      highIntent,
      overdue,
    };
  }, [students]);

  const quickFilterCounts = useMemo(
    () => ({
      notContacted: summaryStats.overdue,
      highIntent: summaryStats.highIntent,
      needsEssayHelp: summaryStats.needsEssaySupport,
    }),
    [summaryStats]
  );

  const quickFilters = useMemo<QuickFilterDefinition[]>(
    () => [
      {
        key: "notContacted",
        label: "Not contacted in 7 days",
        count: quickFilterCounts.notContacted,
      },
      {
        key: "highIntent",
        label: "High intent",
        count: quickFilterCounts.highIntent,
      },
      {
        key: "needsEssayHelp",
        label: "Needs essay help",
        count: quickFilterCounts.needsEssayHelp,
      },
    ],
    [quickFilterCounts]
  );

  const updateNoteDraft = (value: string) => {
    setNoteDraft(value);
  };

  const startNoteEdit = (note: Note) => {
    setNoteDraft(note.content);
    setEditingNoteId(note.id);
  };

  const cancelNoteEdit = () => {
    setNoteDraft("");
    setEditingNoteId(null);
  };

  const saveNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudent) {
      return;
    }

    const content = noteDraft.trim();
    if (!content) {
      return;
    }

    try {
      if (editingNoteId) {
        await updateStudentNote(selectedStudent.id, editingNoteId, { content });
        setFeedback({ type: "success", message: "Note updated." });
      } else {
        await createStudentNote(selectedStudent.id, {
          author: DEFAULT_NOTE_AUTHOR,
          content,
        });
        setFeedback({
          type: "success",
          message: "Note added to the student record.",
        });
      }
      cancelNoteEdit();
    } catch (error) {
      console.error("Failed to save note", error);
      setFeedback({
        type: "info",
        message: "We couldn't save that note. Please try again.",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!selectedStudent) {
      return;
    }

    try {
      await deleteStudentNote(selectedStudent.id, noteId);
      setOptimisticDeletedNotes((current) => {
        const existing = current[selectedStudent.id] ?? [];
        if (existing.includes(noteId)) {
          return current;
        }
        return {
          ...current,
          [selectedStudent.id]: [...existing, noteId],
        };
      });
      cancelNoteEdit();
      setFeedback({ type: "info", message: "Note removed." });
    } catch (error) {
      console.error("Failed to delete note", error);
      setFeedback({
        type: "info",
        message: "We couldn't remove that note. Please try again.",
      });
    }
  };

  const updateCommunicationForm = (updates: Partial<CommunicationFormState>) => {
    setCommunicationForm((prev) => ({ ...prev, ...updates }));
  };

  const logCommunication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudent || !communicationForm.subject.trim()) {
      return;
    }

    const subject = communicationForm.subject.trim();
    const owner = communicationForm.owner.trim() || DEFAULT_OWNER;

    try {
      await logStudentCommunication(selectedStudent.id, {
        channel: communicationForm.channel,
        subject,
        notes: communicationForm.notes.trim(),
        owner,
      });

      setCommunicationForm((prev) => ({
        ...prev,
        subject: "",
        notes: "",
      }));

      setFeedback({
        type: "success",
        message: "Communication logged and follow-up timeline updated.",
      });
    } catch (error) {
      console.error("Failed to log communication", error);
      setFeedback({
        type: "info",
        message: "Unable to log communication. Please try again.",
      });
    }
  };

  const triggerFollowUp = async () => {
    if (!selectedStudent) {
      return;
    }

    try {
      await triggerStudentFollowUp(selectedStudent.id);
      setFeedback({
        type: "success",
        message: `Follow-up email queued for ${selectedStudent.name}.`,
      });
    } catch (error) {
      console.error("Failed to trigger follow up", error);
      setFeedback({
        type: "info",
        message: "Unable to trigger follow-up right now. Please try again.",
      });
    }
  };

  const updateReminderForm = (updates: Partial<ReminderFormState>) => {
    setReminderForm((prev) => ({ ...prev, ...updates }));
  };

  const createReminder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !selectedStudent ||
      !reminderForm.dueDate ||
      !reminderForm.description.trim()
    ) {
      return;
    }

    const dueDate = new Date(reminderForm.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      setFeedback({
        type: "info",
        message: "Please provide a valid due date for the reminder.",
      });
      return;
    }

    try {
      await createStudentReminder(selectedStudent.id, {
        dueDate: dueDate.toISOString(),
        description: reminderForm.description.trim(),
        owner: reminderForm.owner.trim() || DEFAULT_OWNER,
      });

      setReminderForm((prev) => ({
        ...prev,
        dueDate: "",
        description: "",
      }));

      setFeedback({
        type: "success",
        message: "Reminder scheduled for the internal team.",
      });
    } catch (error) {
      console.error("Failed to create reminder", error);
      setFeedback({
        type: "info",
        message: "Unable to create reminder. Please try again.",
      });
    }
  };

  const toggleReminderStatus = async (reminderId: string) => {
    if (!selectedStudent) {
      return;
    }

    const reminder = selectedStudent.reminders.find(
      (item) => item.id === reminderId
    );

    if (!reminder) {
      return;
    }

    try {
      await toggleStudentReminderCompletion(
        selectedStudent.id,
        reminderId,
        !reminder.completed
      );
    } catch (error) {
      console.error("Failed to toggle reminder", error);
      setFeedback({
        type: "info",
        message: "Unable to update reminder status. Please try again.",
      });
    }
  };

  const dismissFeedback = () => setFeedback(null);

  const selectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  return {
    summaryStats,
    filteredStudents,
    selectedStudent,
    selectedStudentId,
    selectStudent,
    searchTerm,
    setSearchTerm: (value: string) => setSearchTermState(value),
    statusFilter,
    setStatusFilter: (value: ApplicationStatus | "All") =>
      setStatusFilterState(value),
    activeQuickFilters,
    toggleQuickFilter: (filter: QuickFilterKey) =>
      setActiveQuickFilters((prev) =>
        prev.includes(filter)
          ? prev.filter((item) => item !== filter)
          : [...prev, filter]
      ),
    quickFilters,
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
  };
};
