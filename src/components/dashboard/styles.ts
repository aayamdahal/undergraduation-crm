import {
  type ApplicationStatus,
  type CommunicationChannel,
  type TimelineEvent,
} from "@/data/students";

export const statusBadgeStyles: Record<ApplicationStatus, string> = {
  Exploring:
    "bg-slate-100 text-slate-700 border-slate-200",
  Shortlisting:
    "bg-sky-100 text-sky-700 border-sky-200",
  Applying:
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  Submitted:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const channelBadgeStyles: Record<CommunicationChannel, string> = {
  Email:
    "bg-sky-100 text-sky-700 border-sky-200",
  SMS:
    "bg-amber-100 text-amber-700 border-amber-200",
  Call:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  WhatsApp:
    "bg-green-100 text-green-700 border-green-200",
};

export const timelineAccent: Record<TimelineEvent["type"], string> = {
  activity: "bg-sky-500",
  document: "bg-amber-500",
  milestone: "bg-emerald-500",
  message: "bg-indigo-500",
};

const stageProgressMap: Record<ApplicationStatus, number> = {
  Exploring: 25,
  Shortlisting: 50,
  Applying: 75,
  Submitted: 100,
};

export const stageProgress = (status: ApplicationStatus): number =>
  stageProgressMap[status] ?? 0;
