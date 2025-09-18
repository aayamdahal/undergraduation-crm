// students.store.ts (resolved)
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import {
  initialStudents,
  type ApplicationStatus,
  type CommunicationChannel,
  type CommunicationEntry,
  type Note,
  type Reminder,
  type Student,
  type TimelineEvent,
} from "@/data/students";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { createId } from "@/lib/utils";

// Public listener types
export type StudentsListener = (students: Student[]) => void;
export type StudentsErrorListener = (error: Error) => void;

// ---------- Helpers ----------

const toISOString = (v: unknown): string => {
  if (!v) return new Date().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Timestamp) return v.toDate().toISOString();
  const s = String(v);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const TIMELINE_TYPES: readonly TimelineEvent["type"][] = [
  "activity",
  "document",
  "milestone",
  "message",
];
const isTimelineType = (t: unknown): t is TimelineEvent["type"] =>
  typeof t === "string" && TIMELINE_TYPES.some((type) => type === t);

const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "Exploring",
  "Shortlisting",
  "Applying",
  "Submitted",
];
const isApplicationStatus = (value: unknown): value is ApplicationStatus =>
  typeof value === "string" && APPLICATION_STATUSES.some((status) => status === value);

const COMMUNICATION_CHANNELS: readonly CommunicationChannel[] = [
  "Email",
  "SMS",
  "Call",
  "WhatsApp",
];
const isCommunicationChannel = (value: unknown): value is CommunicationChannel =>
  typeof value === "string" && COMMUNICATION_CHANNELS.some((channel) => channel === value);

const compareByDateDesc = (a: { date: string }, b: { date: string }) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

const compareByDueDateAsc = (a: { dueDate: string }, b: { dueDate: string }) =>
  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

const mergeUniqueById = <T extends { id: string }>(
  primary: T[],
  secondary: T[],
  sorter: (a: T, b: T) => number
): T[] => {
  const byId = new Map<string, T>();
  primary.forEach((item) => {
    byId.set(item.id, item);
  });
  secondary.forEach((item) => {
    byId.set(item.id, item);
  });
  return Array.from(byId.values()).sort(sorter);
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const sortStudentCollections = (student: Student) => {
  student.timeline?.sort(compareByDateDesc);
  student.communications?.sort(compareByDateDesc);
  student.notes?.sort(compareByDateDesc);
  student.reminders?.sort(compareByDueDateAsc);
};

const mapTimelineFromArray = (value: unknown): TimelineEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      const type = isTimelineType(data.type) ? data.type : "activity";

      return {
        id: String(data.id ?? createId()),
        date: toISOString(data.date),
        type,
        label: String(data.label ?? ""),
        details: String(data.details ?? ""),
      } satisfies TimelineEvent;
    })
    .filter((entry): entry is TimelineEvent => entry !== null)
    .sort(compareByDateDesc);
};

const mapCommunicationsFromArray = (
  value: unknown
): CommunicationEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      const channel = isCommunicationChannel(data.channel)
        ? data.channel
        : "Email";

      return {
        id: String(data.id ?? createId()),
        channel,
        subject: String(data.subject ?? ""),
        date: toISOString(data.date),
        owner: String(data.owner ?? "Advising Team"),
        notes: String(data.notes ?? ""),
      } satisfies CommunicationEntry;
    })
    .filter((entry): entry is CommunicationEntry => entry !== null)
    .sort(compareByDateDesc);
};

const mapNotesFromArray = (value: unknown): Note[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      const note: Note = {
        id: String(data.id ?? createId()),
        author: String(data.author ?? "Admissions Team"),
        content: String(data.content ?? ""),
        date: toISOString(data.date),
      } satisfies Note;

      if (data.updatedAt) {
        note.updatedAt = toISOString(data.updatedAt);
      }

      return note;
    })
    .filter((entry): entry is Note => entry !== null)
    .sort(compareByDateDesc);
};

const mapRemindersFromArray = (value: unknown): Reminder[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      return {
        id: String(data.id ?? createId()),
        dueDate: toISOString(data.dueDate),
        description: String(data.description ?? ""),
        owner: String(data.owner ?? "Advising Team"),
        completed: Boolean(data.completed ?? false),
      } satisfies Reminder;
    })
    .filter((entry): entry is Reminder => entry !== null)
    .sort(compareByDueDateAsc);
};

const serializeTimeline = (timeline: TimelineEvent[]) =>
  timeline.map((event) => ({
    id: event.id,
    date: event.date,
    type: event.type,
    label: event.label,
    details: event.details,
  }));

const serializeCommunications = (communications: CommunicationEntry[]) =>
  communications.map((entry) => ({
    id: entry.id,
    channel: entry.channel,
    subject: entry.subject,
    date: entry.date,
    owner: entry.owner,
    notes: entry.notes,
  }));

const serializeNotes = (notes: Note[]) =>
  notes.map((note) => {
    const base = {
      id: note.id,
      author: note.author,
      content: note.content,
      date: note.date,
    } as Record<string, string>;
    if (note.updatedAt) {
      base.updatedAt = note.updatedAt;
    }
    return base;
  });

const serializeReminders = (reminders: Reminder[]) =>
  reminders.map((reminder) => ({
    id: reminder.id,
    dueDate: reminder.dueDate,
    description: reminder.description,
    owner: reminder.owner,
    completed: reminder.completed,
  }));

const readStudentDocData = async (
  studentId: string
): Promise<Record<string, unknown>> => {
  const snapshot = await getDoc(getStudentDoc(studentId));
  if (!snapshot.exists()) {
    return {};
  }
  const data = snapshot.data();
  return data ? { ...data } : {};
};

const loadStudentCollection = async <T extends { id: string }>(
  studentId: string,
  {
    docField,
    subcollection,
    fromArray,
    mapDocument,
    sorter,
    docData,
  }: {
    docField: string;
    subcollection: string;
    fromArray: (value: unknown) => T[];
    mapDocument: (snapshot: QueryDocumentSnapshot<DocumentData>) => T;
    sorter: (a: T, b: T) => number;
    docData?: Record<string, unknown>;
  }
): Promise<T[]> => {
  const data = docData ?? (await readStudentDocData(studentId));
  const docItems = fromArray(data?.[docField]);
  const snapshot = await getDocs(collection(getStudentDoc(studentId), subcollection));
  const subcollectionItems = snapshot.docs.map(mapDocument);
  return mergeUniqueById(docItems, subcollectionItems, sorter);
};

const loadStudentNotes = (
  studentId: string,
  docData?: Record<string, unknown>
) =>
  loadStudentCollection(studentId, {
    docField: "notes",
    subcollection: "notes",
    fromArray: mapNotesFromArray,
    mapDocument: mapNoteDoc,
    sorter: compareByDateDesc,
    docData,
  });

const loadStudentReminders = (
  studentId: string,
  docData?: Record<string, unknown>
) =>
  loadStudentCollection(studentId, {
    docField: "reminders",
    subcollection: "reminders",
    fromArray: mapRemindersFromArray,
    mapDocument: mapReminderDoc,
    sorter: compareByDueDateAsc,
    docData,
  });

const loadStudentCommunications = (
  studentId: string,
  docData?: Record<string, unknown>
) =>
  loadStudentCollection(studentId, {
    docField: "communications",
    subcollection: "communications",
    fromArray: mapCommunicationsFromArray,
    mapDocument: mapCommunicationDoc,
    sorter: compareByDateDesc,
    docData,
  });

const loadStudentTimeline = (
  studentId: string,
  docData?: Record<string, unknown>
) =>
  loadStudentCollection(studentId, {
    docField: "timeline",
    subcollection: "timeline",
    fromArray: mapTimelineFromArray,
    mapDocument: mapTimelineDoc,
    sorter: compareByDateDesc,
    docData,
  });

// ---------- Fallback (Mock) Store ----------

const fallbackStore = new Map<string, Student>(
  initialStudents.map((s) => [s.id, clone(s)])
);
fallbackStore.forEach(sortStudentCollections);

let usingFallbackStore = !isFirebaseConfigured();

const markUsingFallback = () => {
  usingFallbackStore = true;
};
const markUsingFirestore = () => {
  usingFallbackStore = false;
};

export const isUsingMockStudentStore = () => usingFallbackStore;

const readFallbackStudents = (): Student[] =>
  Array.from(fallbackStore.values())
    .map((s) => clone(s))
    .sort((a, b) => a.name.localeCompare(b.name));

const fallbackSubscribers = new Set<StudentsListener>();

const notifyFallbackSubscribers = () => {
  const snapshot = readFallbackStudents();
  fallbackSubscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.error("Failed to notify fallback subscriber", err);
    }
  });
};

const updateFallbackStudent = (
  studentId: string,
  updater: (student: Student) => boolean | void
) => {
  markUsingFallback();
  const student = fallbackStore.get(studentId);
  if (!student) return;

  const didMutate = updater(student);
  if (didMutate === false) return;

  sortStudentCollections(student);
  notifyFallbackSubscribers();
};

// ---------- Firestore mappers ----------

const getStudentsCollection = () => collection(getDb(), "students");
const getStudentDoc = (studentId: string) => doc(getStudentsCollection(), studentId);
const getSubcollectionDoc = (studentId: string, sub: string, id: string) =>
  doc(collection(getStudentDoc(studentId), sub), id);

const touchStudentDoc = (
  studentId: string,
  updates: Record<string, unknown> = {}
) => {
  const now = new Date().toISOString();
  return updateDoc(getStudentDoc(studentId), { ...updates, updatedAt: now });
};

const mapTimelineDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): TimelineEvent => {
  const data = snapshot.data();
  const type = isTimelineType(data.type) ? data.type : "activity";
  return {
    id: snapshot.id,
    date: toISOString(data.date),
    type,
    label: String(data.label ?? ""),
    details: String(data.details ?? ""),
  } satisfies TimelineEvent;
};

const mapNoteDoc = (snap: QueryDocumentSnapshot<DocumentData>): Note => {
  const data = snap.data();
  const note: Note = {
    id: snap.id,
    author: String(data.author ?? "Admissions Team"),
    content: String(data.content ?? ""),
    date: toISOString(data.date),
  };

  if (data.updatedAt) {
    note.updatedAt = toISOString(data.updatedAt);
  }

  return note;
};

const mapReminderDoc = (snap: QueryDocumentSnapshot<DocumentData>): Reminder => {
  const data = snap.data();
  return {
    id: snap.id,
    dueDate: toISOString(data.dueDate),
    description: String(data.description ?? ""),
    owner: String(data.owner ?? "Advising Team"),
    completed: Boolean(data.completed ?? false),
  } satisfies Reminder;
};

const mapCommunicationDoc = (
  snap: QueryDocumentSnapshot<DocumentData>
): CommunicationEntry => {
  const data = snap.data();
  const channel = isCommunicationChannel(data.channel) ? data.channel : "Email";
  return {
    id: snap.id,
    channel,
    subject: String(data.subject ?? ""),
    notes: String(data.notes ?? ""),
    owner: String(data.owner ?? "Advising Team"),
    date: toISOString(data.date),
  } satisfies CommunicationEntry;
};

// Maps top-level student doc plus selectively loads subcollections
const mapStudentSnapshot = async (
  snap: QueryDocumentSnapshot<DocumentData>
): Promise<Student> => {
  const data = snap.data();

  let timeline = mapTimelineFromArray(data.timeline);
  let notes = mapNotesFromArray(data.notes);
  let reminders = mapRemindersFromArray(data.reminders);
  let communications = mapCommunicationsFromArray(data.communications);

  const fetches: Promise<void>[] = [];

  if (timeline.length === 0) {
    fetches.push(
      getDocs(collection(snap.ref, "timeline")).then((snapshot) => {
        timeline = snapshot.docs
          .map(mapTimelineDoc)
          .sort(compareByDateDesc);
      })
    );
  }

  if (notes.length === 0) {
    fetches.push(
      getDocs(collection(snap.ref, "notes")).then((snapshot) => {
        notes = snapshot.docs.map(mapNoteDoc).sort(compareByDateDesc);
      })
    );
  }

  if (reminders.length === 0) {
    fetches.push(
      getDocs(collection(snap.ref, "reminders")).then((snapshot) => {
        reminders = snapshot.docs
          .map(mapReminderDoc)
          .sort(compareByDueDateAsc);
      })
    );
  }

  if (communications.length === 0) {
    fetches.push(
      getDocs(collection(snap.ref, "communications")).then((snapshot) => {
        communications = snapshot.docs
          .map(mapCommunicationDoc)
          .sort(compareByDateDesc);
      })
    );
  }

  if (fetches.length > 0) {
    await Promise.all(fetches);
  }

  const status = isApplicationStatus(data.status) ? data.status : "Exploring";

  const student: Student = {
    id: snap.id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    country: String(data.country ?? ""),
    grade: String(data.grade ?? ""),
    status,
    lastActive: toISOString(data.lastActive),
    lastContacted: toISOString(data.lastContacted),
    highIntent: Boolean(data.highIntent),
    needsEssayHelp: Boolean(data.needsEssayHelp),
    programInterests: Array.isArray(data.programInterests)
      ? data.programInterests.map((interest) => String(interest))
      : [],
    tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
    engagementScore:
      typeof data.engagementScore === "number"
        ? data.engagementScore
        : Number.parseInt(String(data.engagementScore ?? 0), 10) || 0,
    essayDrafts:
      typeof data.essayDrafts === "number"
        ? data.essayDrafts
        : Number.parseInt(String(data.essayDrafts ?? 0), 10) || 0,
    documentsUploaded:
      typeof data.documentsUploaded === "number"
        ? data.documentsUploaded
        : Number.parseInt(String(data.documentsUploaded ?? 0), 10) || 0,
    openApplications:
      typeof data.openApplications === "number"
        ? data.openApplications
        : Number.parseInt(String(data.openApplications ?? 0), 10) || 0,
    timeline,
    communications,
    notes,
    reminders,
    aiSummary: String(data.aiSummary ?? ""),
  };

  sortStudentCollections(student);
  return student;
};

// ---------- Public API ----------

export const fetchStudents = async (): Promise<Student[]> => {
  if (!isFirebaseConfigured()) {
    markUsingFallback();
    return readFallbackStudents();
  }

  try {
    const snapshot = await getDocs(getStudentsCollection());
    const students = await Promise.all(snapshot.docs.map(mapStudentSnapshot));
    markUsingFirestore();
    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch students from Firestore", error);
    markUsingFallback();
    return readFallbackStudents();
  }
};

export const subscribeToStudents = (
  onData: StudentsListener,
  onError?: StudentsErrorListener
): Unsubscribe => {
  if (!isFirebaseConfigured()) {
    markUsingFallback();
    onData(readFallbackStudents());
    fallbackSubscribers.add(onData);
    return () => {
      fallbackSubscribers.delete(onData);
    };
  }

  return onSnapshot(
    getStudentsCollection(),
    (snapshot) => {
      void (async () => {
        try {
          const students = await Promise.all(snapshot.docs.map(mapStudentSnapshot));
          markUsingFirestore();
          onData(students.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
          console.error("Failed to process Firestore snapshot", err);
          onError?.(err as Error);
          markUsingFallback();
          onData(readFallbackStudents());
        }
      })();
    },
    (err) => {
      onError?.(err as Error);
      markUsingFallback();
      onData(readFallbackStudents());
    }
  );
};

// ---------- Mutations ----------

type CommunicationPayload = {
  channel: CommunicationChannel;
  subject: string;
  notes: string;
  owner: string;
};

type ReminderPayload = {
  dueDate: string;
  description: string;
  owner: string;
};

type NotePayload = { content: string };
type CreateNotePayload = NotePayload & { author: string };

export const createStudentNote = async (
  studentId: string,
  payload: CreateNotePayload
) => {
  if (!isFirebaseConfigured()) {
    updateFallbackStudent(studentId, (s) => {
      const now = new Date().toISOString();
      s.notes.push({ id: createId(), author: payload.author, content: payload.content, date: now });
    });
    return;
  }

  const now = new Date().toISOString();
  await addDoc(collection(getStudentDoc(studentId), "notes"), {
    author: payload.author,
    content: payload.content,
    date: now,
  });
  const docData = await readStudentDocData(studentId);
  const notes = await loadStudentNotes(studentId, docData);
  await touchStudentDoc(studentId, {
    notes: serializeNotes(notes),
  });
};

export const updateStudentNote = async (
  studentId: string,
  noteId: string,
  payload: NotePayload
) => {
  if (!isFirebaseConfigured()) {
    updateFallbackStudent(studentId, (s) => {
      const note = s.notes.find((n) => n.id === noteId);
      if (!note) return false;
      note.content = payload.content;
      note.updatedAt = new Date().toISOString();
      return true;
    });
    return;
  }

  await updateDoc(getSubcollectionDoc(studentId, "notes", noteId), {
    content: payload.content,
    updatedAt: new Date().toISOString(),
  });
  const docData = await readStudentDocData(studentId);
  const notes = await loadStudentNotes(studentId, docData);
  await touchStudentDoc(studentId, {
    notes: serializeNotes(notes),
  });
};

export const deleteStudentNote = async (studentId: string, noteId: string) => {
  if (!isFirebaseConfigured()) {
    updateFallbackStudent(studentId, (s) => {
      const idx = s.notes.findIndex((n) => n.id === noteId);
      if (idx === -1) return false;
      s.notes.splice(idx, 1);
      return true;
    });
    return;
  }

  await deleteDoc(getSubcollectionDoc(studentId, "notes", noteId));
  const docData = await readStudentDocData(studentId);
  const notes = await loadStudentNotes(studentId, docData);
  await touchStudentDoc(studentId, {
    notes: serializeNotes(notes),
  });
};

export const logStudentCommunication = async (
  studentId: string,
  payload: CommunicationPayload
) => {
  if (!isFirebaseConfigured()) {
    const now = new Date().toISOString();
    updateFallbackStudent(studentId, (s) => {
      const communication: CommunicationEntry = {
        id: createId(),
        channel: payload.channel,
        subject: payload.subject,
        date: now,
        owner: payload.owner,
        notes: payload.notes,
      };
      const timelineEvent: TimelineEvent = {
        id: createId(),
        date: now,
        type: "message",
        label: `Logged ${payload.channel.toLowerCase()} outreach`,
        details: payload.subject,
      };
      s.communications.push(communication);
      s.timeline.push(timelineEvent);
      s.lastContacted = now;
    });
    return;
  }

  const now = new Date().toISOString();
  const studentDoc = getStudentDoc(studentId);
  await addDoc(collection(studentDoc, "communications"), {
    channel: payload.channel,
    subject: payload.subject,
    notes: payload.notes,
    owner: payload.owner,
    date: now,
  });

  await addDoc(collection(studentDoc, "timeline"), {
    date: now,
    type: "message",
    label: `Logged ${payload.channel.toLowerCase()} outreach`,
    details: payload.subject,
  });

  const docData = await readStudentDocData(studentId);
  const [communications, timeline] = await Promise.all([
    loadStudentCommunications(studentId, docData),
    loadStudentTimeline(studentId, docData),
  ]);

  await touchStudentDoc(studentId, {
    communications: serializeCommunications(communications),
    timeline: serializeTimeline(timeline),
    lastContacted: now,
  });
};

export const triggerStudentFollowUp = async (studentId: string) => {
  if (!isFirebaseConfigured()) {
    const now = new Date().toISOString();
    updateFallbackStudent(studentId, (s) => {
      s.communications.push({
        id: createId(),
        channel: "Email",
        subject: "Automated follow-up email scheduled",
        date: now,
        owner: "Workflow Automation",
        notes: "Mock action recorded for visibility. No email is sent in this demo.",
      });
      s.timeline.push({
        id: createId(),
        date: now,
        type: "message",
        label: "Follow-up email triggered",
        details: "Automation will send reminder within 24 hours.",
      });
      s.lastContacted = now;
    });
    return;
  }

  const now = new Date().toISOString();
  const studentDoc = getStudentDoc(studentId);
  await Promise.all([
    addDoc(collection(studentDoc, "communications"), {
      channel: "Email",
      subject: "Automated follow-up email scheduled",
      date: now,
      owner: "Workflow Automation",
      notes: "Mock action recorded for visibility. No email is sent in this demo.",
    }),
    addDoc(collection(studentDoc, "timeline"), {
      date: now,
      type: "message",
      label: "Follow-up email triggered",
      details: "Automation will send reminder within 24 hours.",
    }),
  ]);

  const docData = await readStudentDocData(studentId);
  const [communications, timeline] = await Promise.all([
    loadStudentCommunications(studentId, docData),
    loadStudentTimeline(studentId, docData),
  ]);

  await touchStudentDoc(studentId, {
    communications: serializeCommunications(communications),
    timeline: serializeTimeline(timeline),
    lastContacted: now,
  });
};

export const createStudentReminder = async (
  studentId: string,
  payload: ReminderPayload
) => {
  if (!isFirebaseConfigured()) {
    updateFallbackStudent(studentId, (s) => {
      s.reminders.push({
        id: createId(),
        dueDate: payload.dueDate,
        description: payload.description,
        owner: payload.owner,
        completed: false,
      });
    });
    return;
  }

  await addDoc(collection(getStudentDoc(studentId), "reminders"), {
    ...payload,
    dueDate: payload.dueDate,
    completed: false,
  });
  const docData = await readStudentDocData(studentId);
  const reminders = await loadStudentReminders(studentId, docData);
  await touchStudentDoc(studentId, {
    reminders: serializeReminders(reminders),
  });
};

export const toggleStudentReminderCompletion = async (
  studentId: string,
  reminderId: string,
  completed: boolean
) => {
  if (!isFirebaseConfigured()) {
    updateFallbackStudent(studentId, (s) => {
      const r = s.reminders.find((x) => x.id === reminderId);
      if (!r) return false;
      r.completed = completed;
      return true;
    });
    return;
  }

  await updateDoc(getSubcollectionDoc(studentId, "reminders", reminderId), {
    completed,
  });
  const docData = await readStudentDocData(studentId);
  const reminders = await loadStudentReminders(studentId, docData);
  await touchStudentDoc(studentId, {
    reminders: serializeReminders(reminders),
  });
};
