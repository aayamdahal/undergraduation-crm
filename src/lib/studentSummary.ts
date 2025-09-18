import type {
  CommunicationEntry,
  Note,
  Reminder,
  Student,
  TimelineEvent,
} from "@/data/students";
import type { StudentSummaryPayload } from "@/types/studentSummary";

const MAX_TIMELINE_EVENTS = 6;
const MAX_COMMUNICATIONS = 4;
const MAX_NOTES = 4;
const MAX_REMINDERS = 4;

const sanitizeText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.replace(/\s+/g, " ").trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const sanitizeBoolean = (value: unknown): boolean => Boolean(value);

const sanitizeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const sanitizeDate = (value: unknown): string => {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
};

const sanitizeStringArray = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((item) => sanitizeText(item))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

const byDueDateAsc = (a: { dueDate: string }, b: { dueDate: string }) =>
  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

const mapTimeline = (timeline: TimelineEvent[] | undefined): TimelineEvent[] => {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline
    .map((event) => ({
      ...event,
      id: sanitizeText(event.id),
      date: sanitizeDate(event.date),
      type: event.type,
      label: sanitizeText(event.label),
      details: sanitizeText(event.details),
    }))
    .filter((event) => event.id.length > 0 && event.date.length > 0)
    .sort(byDateDesc)
    .slice(0, MAX_TIMELINE_EVENTS);
};

const mapCommunications = (
  communications: CommunicationEntry[] | undefined
): CommunicationEntry[] => {
  if (!Array.isArray(communications)) {
    return [];
  }

  return communications
    .map((entry) => ({
      ...entry,
      id: sanitizeText(entry.id),
      channel: entry.channel,
      subject: sanitizeText(entry.subject),
      date: sanitizeDate(entry.date),
      owner: sanitizeText(entry.owner),
      notes: sanitizeText(entry.notes),
    }))
    .filter((entry) => entry.id.length > 0 && entry.date.length > 0)
    .sort(byDateDesc)
    .slice(0, MAX_COMMUNICATIONS);
};

const mapNotes = (notes: Note[] | undefined): Note[] => {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes
    .map((note) => ({
      ...note,
      id: sanitizeText(note.id),
      author: sanitizeText(note.author),
      date: sanitizeDate(note.date),
      content: sanitizeText(note.content),
      updatedAt: note.updatedAt ? sanitizeDate(note.updatedAt) : undefined,
    }))
    .filter((note) => note.id.length > 0 && note.date.length > 0)
    .sort(byDateDesc)
    .slice(0, MAX_NOTES);
};

const mapReminders = (reminders: Reminder[] | undefined): Reminder[] => {
  if (!Array.isArray(reminders)) {
    return [];
  }

  return reminders
    .map((reminder) => ({
      ...reminder,
      id: sanitizeText(reminder.id),
      dueDate: sanitizeDate(reminder.dueDate),
      description: sanitizeText(reminder.description),
      owner: sanitizeText(reminder.owner),
      completed: sanitizeBoolean(reminder.completed),
    }))
    .filter((reminder) => reminder.id.length > 0 && reminder.dueDate.length > 0)
    .sort(byDueDateAsc)
    .slice(0, MAX_REMINDERS);
};

const coerceSummaryPayload = (
  source: StudentSummaryPayload | Student
): StudentSummaryPayload => ({
  id: sanitizeText(source.id),
  name: sanitizeText(source.name),
  status: source.status,
  engagementScore: sanitizeNumber(source.engagementScore),
  highIntent: sanitizeBoolean(source.highIntent),
  needsEssayHelp: sanitizeBoolean(source.needsEssayHelp),
  lastActive: sanitizeDate(source.lastActive),
  lastContacted: sanitizeDate(source.lastContacted),
  tags: sanitizeStringArray(source.tags),
  programInterests: sanitizeStringArray(source.programInterests),
  timeline: mapTimeline(source.timeline),
  communications: mapCommunications(source.communications),
  notes: mapNotes(source.notes),
  reminders: mapReminders(source.reminders),
});

export const buildStudentSummaryPayload = (
  student: Student
): StudentSummaryPayload => coerceSummaryPayload(student);

export const normalizeStudentSummaryPayload = (
  payload: StudentSummaryPayload
): StudentSummaryPayload => coerceSummaryPayload(payload);
