export type ApplicationStatus =
  | "Exploring"
  | "Shortlisting"
  | "Applying"
  | "Submitted";

export type TimelineEvent = {
  id: string;
  date: string;
  type: "activity" | "document" | "milestone" | "message";
  label: string;
  details: string;
};

export type CommunicationChannel = "Email" | "SMS" | "Call" | "WhatsApp";

export type CommunicationEntry = {
  id: string;
  channel: CommunicationChannel;
  subject: string;
  date: string;
  owner: string;
  notes: string;
};

export type Note = {
  id: string;
  author: string;
  date: string;
  content: string;
  updatedAt?: string;
};

export type Reminder = {
  id: string;
  dueDate: string;
  description: string;
  owner: string;
  completed: boolean;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  grade: string;
  status: ApplicationStatus;
  lastActive: string;
  lastContacted: string;
  highIntent: boolean;
  needsEssayHelp: boolean;
  programInterests: string[];
  tags: string[];
  engagementScore: number;
  essayDrafts: number;
  documentsUploaded: number;
  openApplications: number;
  timeline: TimelineEvent[];
  communications: CommunicationEntry[];
  notes: Note[];
  reminders: Reminder[];
  aiSummary: string;
};

// Anchor the mock timeline around the current runtime so the relative spacing
// between events remains realistic (for example, "3 days ago" or "in 2 days")
// regardless of when the dashboard is opened. We use a fixed point in the
// original dataset (15 Sep 2025) as the baseline and shift every timestamp by
// the difference between "now" and that anchor.
const referenceTimelineAnchor = new Date("2025-09-15T12:00:00Z").getTime();
const referenceNow = Date.now();

const createDate = (value: string) => {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }

  const offsetFromAnchor = parsed - referenceTimelineAnchor;
  return new Date(referenceNow + offsetFromAnchor).toISOString();
};

export const initialStudents: Student[] = [
  {
    id: "s-aanya",
    name: "Aanya Patel",
    email: "aanya.patel@example.com",
    phone: "+91 98200 12345",
    country: "India",
    grade: "11",
    status: "Shortlisting",
    lastActive: createDate("2025-09-12T15:45:00"),
    lastContacted: createDate("2025-09-12T09:00:00"),
    highIntent: true,
    needsEssayHelp: true,
    programInterests: ["Computer Science", "Data Science"],
    tags: ["STEM", "US Universities", "Scholarship Focus"],
    engagementScore: 82,
    essayDrafts: 1,
    documentsUploaded: 4,
    openApplications: 3,
    timeline: [
      {
        id: "ev-aanya-1",
        date: createDate("2025-09-12T15:45:00"),
        type: "activity",
        label: "Completed campus fit quiz",
        details:
          "Scored highly for collaborative learning environments and mid-sized campuses.",
      },
      {
        id: "ev-aanya-2",
        date: createDate("2025-09-11T10:00:00"),
        type: "document",
        label: "Uploaded transcript",
        details: "CBSE grade 10 transcript with 94% aggregate.",
      },
      {
        id: "ev-aanya-3",
        date: createDate("2025-09-09T18:10:00"),
        type: "message",
        label: "Asked AI about essay hooks",
        details: "Requested examples for MIT application essay introduction.",
      },
      {
        id: "ev-aanya-4",
        date: createDate("2025-09-07T12:15:00"),
        type: "milestone",
        label: "Shortlist draft completed",
        details: "Identified 8 target schools across US and Singapore.",
      },
    ],
    communications: [
      {
        id: "com-aanya-1",
        channel: "Email",
        subject: "Shared shortlist workbook",
        date: createDate("2025-09-12T09:00:00"),
        owner: "Meera Kapoor",
        notes: "Sent curated shortlist and invited her to strategy session.",
      },
      {
        id: "com-aanya-2",
        channel: "Call",
        subject: "Essay brainstorming call",
        date: createDate("2025-09-05T14:30:00"),
        owner: "Rahul Mehta",
        notes: "Aligned on MIT and NUS essay narratives.",
      },
    ],
    notes: [
      {
        id: "note-aanya-1",
        author: "Meera Kapoor",
        date: createDate("2025-09-12T09:15:00"),
        content:
          "Highly engaged with AI planner. Needs accountability on essay drafting cadence.",
      },
      {
        id: "note-aanya-2",
        author: "Rahul Mehta",
        date: createDate("2025-09-05T15:10:00"),
        content:
          "Family prioritizing US STEM programs with strong co-op options.",
      },
    ],
    reminders: [
      {
        id: "rem-aanya-1",
        dueDate: createDate("2025-09-16T11:00:00"),
        description: "Review revised MIT essay draft and add comments.",
        owner: "Essay Team",
        completed: false,
      },
      {
        id: "rem-aanya-2",
        dueDate: createDate("2025-09-19T09:30:00"),
        description: "Schedule portfolio review with design mentor.",
        owner: "Advising Team",
        completed: false,
      },
    ],
    aiSummary:
      "Aanya is a high-intent STEM candidate exploring US and Singapore options. She is actively engaging with planning tools, has uploaded core academics, and needs structured support to complete essay drafts before October deadlines.",
  },
  {
    id: "s-diego",
    name: "Diego Alvarez",
    email: "diego.alvarez@example.com",
    phone: "+34 612 334 908",
    country: "Spain",
    grade: "12",
    status: "Applying",
    lastActive: createDate("2025-09-13T08:20:00"),
    lastContacted: createDate("2025-09-08T16:40:00"),
    highIntent: true,
    needsEssayHelp: false,
    programInterests: ["Business", "Economics"],
    tags: ["Europe", "Scholarship", "Financial Aid"],
    engagementScore: 91,
    essayDrafts: 3,
    documentsUploaded: 6,
    openApplications: 5,
    timeline: [
      {
        id: "ev-diego-1",
        date: createDate("2025-09-13T08:20:00"),
        type: "activity",
        label: "Completed London Business School virtual tour",
        details: "Added post-tour reflections to application workspace.",
      },
      {
        id: "ev-diego-2",
        date: createDate("2025-09-10T11:00:00"),
        type: "document",
        label: "Uploaded TOEFL score report",
        details: "Scored 110 with 28+ in each section.",
      },
      {
        id: "ev-diego-3",
        date: createDate("2025-09-08T13:20:00"),
        type: "milestone",
        label: "ESADE application moved to review",
        details: "All recommendation letters received.",
      },
    ],
    communications: [
      {
        id: "com-diego-1",
        channel: "Email",
        subject: "Reviewed Common App activities section",
        date: createDate("2025-09-08T16:40:00"),
        owner: "Laura Chen",
        notes: "Provided feedback on leadership impact narratives.",
      },
      {
        id: "com-diego-2",
        channel: "SMS",
        subject: "Reminder: upload scholarship essays",
        date: createDate("2025-09-03T10:15:00"),
        owner: "Platform Automation",
        notes: "Automated reminder for IE University scholarship portal.",
      },
    ],
    notes: [
      {
        id: "note-diego-1",
        author: "Laura Chen",
        date: createDate("2025-09-08T17:00:00"),
        content:
          "Financial aid forms ready; awaiting parental signatures by Friday.",
      },
    ],
    reminders: [
      {
        id: "rem-diego-1",
        dueDate: createDate("2025-09-14T14:00:00"),
        description: "Double-check IE University video essay upload.",
        owner: "Student Success",
        completed: false,
      },
      {
        id: "rem-diego-2",
        dueDate: createDate("2025-09-18T10:00:00"),
        description: "Send financial documents checklist to parents.",
        owner: "Finance Desk",
        completed: false,
      },
    ],
    aiSummary:
      "Diego is in the application submission phase with five European business schools. Essays and recommendations are strong; main risk is financial aid paperwork delays.",
  },
  {
    id: "s-lina",
    name: "Lina Zhang",
    email: "lina.zhang@example.com",
    phone: "+1 (415) 654-8890",
    country: "United States",
    grade: "11",
    status: "Exploring",
    lastActive: createDate("2025-09-06T20:05:00"),
    lastContacted: createDate("2025-08-28T09:30:00"),
    highIntent: false,
    needsEssayHelp: false,
    programInterests: ["Design", "Human-Computer Interaction"],
    tags: ["UX", "Early Research", "Summer Programs"],
    engagementScore: 58,
    essayDrafts: 0,
    documentsUploaded: 1,
    openApplications: 0,
    timeline: [
      {
        id: "ev-lina-1",
        date: createDate("2025-09-06T20:05:00"),
        type: "message",
        label: "Asked AI about UI portfolio tips",
        details: "Requested examples of strong UX case studies.",
      },
      {
        id: "ev-lina-2",
        date: createDate("2025-09-02T18:45:00"),
        type: "activity",
        label: "Explored Canadian design programs",
        details: "Saved OCAD and Waterloo to favorites.",
      },
    ],
    communications: [
      {
        id: "com-lina-1",
        channel: "Email",
        subject: "Welcome orientation recap",
        date: createDate("2025-08-28T09:30:00"),
        owner: "Alex Morgan",
        notes: "Shared orientation recording and discovery worksheet.",
      },
    ],
    notes: [
      {
        id: "note-lina-1",
        author: "Alex Morgan",
        date: createDate("2025-08-28T10:00:00"),
        content:
          "Interested in summer research; encourage attendance at design webinar.",
      },
    ],
    reminders: [
      {
        id: "rem-lina-1",
        dueDate: createDate("2025-09-20T17:00:00"),
        description: "Invite Lina to portfolio storytelling workshop.",
        owner: "Community Team",
        completed: false,
      },
    ],
    aiSummary:
      "Lina is exploring design-focused programs. Engagement is sporadic; re-engage with creative portfolio resources and highlight upcoming community events.",
  },
  {
    id: "s-oluwatobi",
    name: "Oluwatobi Adeyemi",
    email: "oluwatobi.adeyemi@example.com",
    phone: "+234 803 555 9921",
    country: "Nigeria",
    grade: "12",
    status: "Applying",
    lastActive: createDate("2025-09-11T21:30:00"),
    lastContacted: createDate("2025-09-03T13:20:00"),
    highIntent: true,
    needsEssayHelp: true,
    programInterests: ["Mechanical Engineering", "Robotics"],
    tags: ["STEM", "Leadership", "Essay Support"],
    engagementScore: 76,
    essayDrafts: 2,
    documentsUploaded: 5,
    openApplications: 4,
    timeline: [
      {
        id: "ev-oluwatobi-1",
        date: createDate("2025-09-11T21:30:00"),
        type: "activity",
        label: "Completed robotics challenge reflection",
        details: "Updated project impact statements for Common App.",
      },
      {
        id: "ev-oluwatobi-2",
        date: createDate("2025-09-04T08:00:00"),
        type: "document",
        label: "Uploaded recommendation letter",
        details: "Physics teacher recommendation finalized.",
      },
      {
        id: "ev-oluwatobi-3",
        date: createDate("2025-09-03T13:20:00"),
        type: "milestone",
        label: "Essay draft feedback shared",
        details: "Essay coach added comments on narrative arc.",
      },
    ],
    communications: [
      {
        id: "com-oluwatobi-1",
        channel: "Call",
        subject: "Interview preparation planning",
        date: createDate("2025-09-03T13:20:00"),
        owner: "Nia Roberts",
        notes: "Scheduled mock interview for September 22.",
      },
    ],
    notes: [
      {
        id: "note-oluwatobi-1",
        author: "Nia Roberts",
        date: createDate("2025-09-03T14:00:00"),
        content:
          "Needs more examples demonstrating leadership impact in essays.",
      },
    ],
    reminders: [
      {
        id: "rem-oluwatobi-1",
        dueDate: createDate("2025-09-15T12:00:00"),
        description: "Send targeted scholarship list for robotics students.",
        owner: "Scholarship Team",
        completed: false,
      },
      {
        id: "rem-oluwatobi-2",
        dueDate: createDate("2025-09-22T16:00:00"),
        description: "Host mock interview session.",
        owner: "Interview Pod",
        completed: false,
      },
    ],
    aiSummary:
      "Oluwatobi is progressing through application drafts with strong extracurriculars. Focus next on scholarship strategy and interview preparation milestones.",
  },
  {
    id: "s-sophia",
    name: "Sophia Martins",
    email: "sophia.martins@example.com",
    phone: "+55 21 98012 4455",
    country: "Brazil",
    grade: "12",
    status: "Submitted",
    lastActive: createDate("2025-09-02T10:10:00"),
    lastContacted: createDate("2025-09-01T15:00:00"),
    highIntent: true,
    needsEssayHelp: false,
    programInterests: ["Architecture", "Urban Design"],
    tags: ["Portfolio", "Scholarship", "Campus Visit"],
    engagementScore: 88,
    essayDrafts: 5,
    documentsUploaded: 8,
    openApplications: 1,
    timeline: [
      {
        id: "ev-sophia-1",
        date: createDate("2025-09-01T15:00:00"),
        type: "milestone",
        label: "Submitted Parsons application",
        details: "Uploaded final portfolio and video statement.",
      },
      {
        id: "ev-sophia-2",
        date: createDate("2025-08-28T19:45:00"),
        type: "document",
        label: "Uploaded design portfolio",
        details: "12-piece portfolio with annotations.",
      },
      {
        id: "ev-sophia-3",
        date: createDate("2025-08-25T08:30:00"),
        type: "activity",
        label: "Completed visa preparation checklist",
        details: "Family ready for I-20 request once offer arrives.",
      },
    ],
    communications: [
      {
        id: "com-sophia-1",
        channel: "Email",
        subject: "Celebrated Parsons submission",
        date: createDate("2025-09-01T15:00:00"),
        owner: "Isabela Costa",
        notes: "Congratulated and outlined scholarship follow-ups.",
      },
      {
        id: "com-sophia-2",
        channel: "WhatsApp",
        subject: "Shared campus visit photos",
        date: createDate("2025-08-26T12:20:00"),
        owner: "Isabela Costa",
        notes: "Family enthusiastic; awaiting merit decision.",
      },
    ],
    notes: [
      {
        id: "note-sophia-1",
        author: "Isabela Costa",
        date: createDate("2025-09-01T15:20:00"),
        content:
          "Track scholarship interview windows and prepare portfolio walkthrough.",
      },
    ],
    reminders: [
      {
        id: "rem-sophia-1",
        dueDate: createDate("2025-09-25T10:00:00"),
        description: "Send scholarship interview practice prompts.",
        owner: "Scholarship Team",
        completed: false,
      },
    ],
    aiSummary:
      "Sophia has submitted her primary applications and is awaiting scholarship updates. Keep momentum with portfolio storytelling prep and visa readiness.",
  },
];

export const applicationStages: ApplicationStatus[] = [
  "Exploring",
  "Shortlisting",
  "Applying",
  "Submitted",
];
