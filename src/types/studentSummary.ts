import type {
  ApplicationStatus,
  CommunicationEntry,
  Note,
  Reminder,
  TimelineEvent,
} from "@/data/students";

export type StudentSummaryPayload = {
  id: string;
  name: string;
  status: ApplicationStatus;
  engagementScore: number;
  highIntent: boolean;
  needsEssayHelp: boolean;
  lastActive: string;
  lastContacted: string;
  tags: string[];
  programInterests: string[];
  timeline: TimelineEvent[];
  communications: CommunicationEntry[];
  notes: Note[];
  reminders: Reminder[];
};

export type StudentSummaryRequestBody = {
  student: StudentSummaryPayload;
};

export type StudentSummaryResponse = {
  summary: string;
  cached?: boolean;
};
