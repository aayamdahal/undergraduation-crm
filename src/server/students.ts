import type { CommunicationChannel, Student } from "@/data/students";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { createId } from "@/lib/utils";

const toISOString = (value: unknown): string => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const result = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(result.getTime())
      ? new Date().toISOString()
      : result.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const isTimelineType = (value: unknown) =>
  value === "activity" ||
  value === "document" ||
  value === "milestone" ||
  value === "message";

const isApplicationStatus = (value: unknown) =>
  value === "Exploring" ||
  value === "Shortlisting" ||
  value === "Applying" ||
  value === "Submitted";

const isCommunicationChannel = (value: unknown): value is CommunicationChannel =>
  value === "Email" ||
  value === "SMS" ||
  value === "Call" ||
  value === "WhatsApp";

type TimelineEvent = Student["timeline"][number];
type CommunicationEntry = Student["communications"][number];
type Note = Student["notes"][number];
type Reminder = Student["reminders"][number];

type FirestoreDoc = FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>;

const mapTimelineDoc = (snapshot: FirestoreDoc): TimelineEvent => {
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

const mapCommunicationDoc = (snapshot: FirestoreDoc): CommunicationEntry => {
  const data = snapshot.data();
  const channel = isCommunicationChannel(data.channel) ? data.channel : "Email";
  return {
    id: snapshot.id,
    channel,
    subject: String(data.subject ?? ""),
    date: toISOString(data.date),
    owner: String(data.owner ?? "Advising Team"),
    notes: String(data.notes ?? ""),
  } satisfies CommunicationEntry;
};

const mapNoteDoc = (snapshot: FirestoreDoc): Note => {
  const data = snapshot.data();
  const note: Note = {
    id: snapshot.id,
    author: String(data.author ?? "Admissions Team"),
    date: toISOString(data.date),
    content: String(data.content ?? ""),
  } satisfies Note;

  if (data.updatedAt) {
    note.updatedAt = toISOString(data.updatedAt);
  }

  return note;
};

const mapReminderDoc = (snapshot: FirestoreDoc): Reminder => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    dueDate: toISOString(data.dueDate),
    description: String(data.description ?? ""),
    owner: String(data.owner ?? "Advising Team"),
    completed: Boolean(data.completed),
  } satisfies Reminder;
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
    .filter((item): item is TimelineEvent => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mapCommunicationsFromArray = (value: unknown): CommunicationEntry[] => {
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
    .filter((item): item is CommunicationEntry => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        date: toISOString(data.date),
        content: String(data.content ?? ""),
      } satisfies Note;

      if (data.updatedAt) {
        note.updatedAt = toISOString(data.updatedAt);
      }

      return note;
    })
    .filter((item): item is Note => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        completed: Boolean(data.completed),
      } satisfies Reminder;
    })
    .filter((item): item is Reminder => item !== null)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

const mergeArrays = <T>(primary: T[], fallback: T[]): T[] =>
  primary.length > 0 ? primary : fallback;

const mapStudentSnapshot = async (
  snapshot: FirestoreDoc
): Promise<Student> => {
  const data = snapshot.data();
  const ref = snapshot.ref;

  const [timelineSnap, communicationsSnap, notesSnap, remindersSnap] =
    await Promise.all([
      ref.collection("timeline").get(),
      ref.collection("communications").get(),
      ref.collection("notes").get(),
      ref.collection("reminders").get(),
    ]);

  const timeline = mergeArrays(
    timelineSnap.docs
      .map(mapTimelineDoc)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    mapTimelineFromArray(data.timeline)
  );

  const communications = mergeArrays(
    communicationsSnap.docs
      .map(mapCommunicationDoc)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    mapCommunicationsFromArray(data.communications)
  );

  const notes = mergeArrays(
    notesSnap.docs
      .map(mapNoteDoc)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    mapNotesFromArray(data.notes)
  );

  const reminders = mergeArrays(
    remindersSnap.docs
      .map(mapReminderDoc)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    mapRemindersFromArray(data.reminders)
  );

  const status = isApplicationStatus(data.status) ? data.status : "Exploring";

  return {
    id: snapshot.id,
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
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag))
      : [],
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
  } satisfies Student;
};

const sortByName = (a: Student, b: Student) => a.name.localeCompare(b.name);

const toHandledError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return new Error(error);
  }

  if (error) {
    return new Error(`${fallbackMessage}: ${String(error)}`);
  }

  return new Error(fallbackMessage);
};

const getStudentRef = (studentId: string) =>
  getAdminDb().collection("students").doc(studentId);

export const listStudents = async (): Promise<Student[]> => {
  try {
    const snapshot = await getAdminDb().collection("students").get();
    const students = await Promise.all(snapshot.docs.map(mapStudentSnapshot));
    return students.sort(sortByName);
  } catch (error) {
    console.error("Failed to fetch students from Firestore", error);
    throw toHandledError(error, "Failed to fetch students from Firestore");
  }
};

const fetchStudentFromFirestore = async (
  studentId: string
): Promise<Student | null> => {
  try {
    const doc = await getStudentRef(studentId).get();
    if (!doc.exists) {
      return null;
    }
    return mapStudentSnapshot(doc as FirestoreDoc);
  } catch (error) {
    console.error(`Failed to fetch student ${studentId} from Firestore`, error);
    throw toHandledError(
      error,
      `Failed to fetch student ${studentId} from Firestore`
    );
  }
};

const ensureStudent = async (studentId: string): Promise<Student> => {
  const student = await fetchStudentFromFirestore(studentId);
  if (!student) {
    throw new Error("Student not found");
  }
  return student;
};

export const getStudent = async (studentId: string): Promise<Student> =>
  ensureStudent(studentId);

type NotePayload = { author: string; content: string };

type NoteUpdatePayload = { content: string };

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

export const addStudentNote = async (
  studentId: string,
  payload: NotePayload
): Promise<Student> => {
  try {
    const now = new Date().toISOString();
    await getStudentRef(studentId)
      .collection("notes")
      .add({
        author: payload.author,
        content: payload.content,
        date: now,
      });

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(`Failed to create note for student ${studentId}`, error);
    throw toHandledError(
      error,
      `Failed to create note for student ${studentId}`
    );
  }
};

export const updateStudentNote = async (
  studentId: string,
  noteId: string,
  payload: NoteUpdatePayload
): Promise<Student> => {
  try {
    const now = new Date().toISOString();
    await getStudentRef(studentId)
      .collection("notes")
      .doc(noteId)
      .update({
        content: payload.content,
        updatedAt: now,
      });

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(`Failed to update note ${noteId} for student ${studentId}`, error);
    throw toHandledError(
      error,
      `Failed to update note ${noteId} for student ${studentId}`
    );
  }
};

export const removeStudentNote = async (
  studentId: string,
  noteId: string
): Promise<Student> => {
  try {
    await getStudentRef(studentId)
      .collection("notes")
      .doc(noteId)
      .delete();

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(`Failed to delete note ${noteId} for student ${studentId}`, error);
    throw toHandledError(
      error,
      `Failed to delete note ${noteId} for student ${studentId}`
    );
  }
};

export const logStudentCommunication = async (
  studentId: string,
  payload: CommunicationPayload
): Promise<Student> => {
  try {
    const now = new Date().toISOString();
    const studentRef = getStudentRef(studentId);

    await Promise.all([
      studentRef.collection("communications").add({
        channel: payload.channel,
        subject: payload.subject,
        notes: payload.notes,
        owner: payload.owner,
        date: now,
      }),
      studentRef.collection("timeline").add({
        date: now,
        type: "message",
        label: `Logged ${payload.channel.toLowerCase()} outreach`,
        details: payload.subject,
      }),
      studentRef.update({
        lastContacted: now,
      }),
    ]);

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(
      `Failed to log communication for student ${studentId}`,
      error
    );
    throw toHandledError(
      error,
      `Failed to log communication for student ${studentId}`
    );
  }
};

export const triggerStudentFollowUp = async (
  studentId: string
): Promise<Student> => {
  try {
    const now = new Date().toISOString();
    const studentRef = getStudentRef(studentId);

    await Promise.all([
      studentRef.collection("communications").add({
        channel: "Email",
        subject: "Automated follow-up email scheduled",
        date: now,
        owner: "Workflow Automation",
        notes:
          "Mock action recorded for visibility. No email is sent in this demo.",
      }),
      studentRef.collection("timeline").add({
        date: now,
        type: "message",
        label: "Follow-up email triggered",
        details: "Automation will send reminder within 24 hours.",
      }),
      studentRef.update({
        lastContacted: now,
      }),
    ]);

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(
      `Failed to trigger follow-up for student ${studentId}`,
      error
    );
    throw toHandledError(
      error,
      `Failed to trigger follow-up for student ${studentId}`
    );
  }
};

export const createStudentReminder = async (
  studentId: string,
  payload: ReminderPayload
): Promise<Student> => {
  try {
    await getStudentRef(studentId)
      .collection("reminders")
      .add({
        dueDate: payload.dueDate,
        description: payload.description,
        owner: payload.owner,
        completed: false,
      });

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(`Failed to create reminder for student ${studentId}`, error);
    throw toHandledError(
      error,
      `Failed to create reminder for student ${studentId}`
    );
  }
};

export const toggleStudentReminder = async (
  studentId: string,
  reminderId: string,
  completed: boolean
): Promise<Student> => {
  try {
    await getStudentRef(studentId)
      .collection("reminders")
      .doc(reminderId)
      .update({
        completed,
      });

    return await ensureStudent(studentId);
  } catch (error) {
    console.error(
      `Failed to update reminder ${reminderId} for student ${studentId}`,
      error
    );
    throw toHandledError(
      error,
      `Failed to update reminder ${reminderId} for student ${studentId}`
    );
  }
};
