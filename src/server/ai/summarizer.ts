import { createHash } from "crypto";

import { HfInference } from "@huggingface/inference";

import { normalizeStudentSummaryPayload } from "@/lib/studentSummary";
import type { StudentSummaryPayload } from "@/types/studentSummary";

const SUMMARY_MODEL =
  process.env.HUGGINGFACE_SUMMARY_MODEL ?? "facebook/bart-large-cnn";
const SUMMARY_TTL_MS = 1000 * 60 * 10; // 10 minutes

export class SummarizerError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "SummarizerError";
    this.statusCode = statusCode;
  }
}

export class SummarizerConfigurationError extends SummarizerError {
  constructor(message: string) {
    super(message, 503);
    this.name = "SummarizerConfigurationError";
  }
}

export class SummarizerInputError extends SummarizerError {
  constructor(message: string) {
    super(message, 400);
    this.name = "SummarizerInputError";
  }
}

export class SummarizerProviderError extends SummarizerError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
    this.name = "SummarizerProviderError";
  }
}

const summaryCache = new Map<
  string,
  { summary: string; signature: string; expiresAt: number }
>();

let client: HfInference | null = null;

const getInferenceClient = () => {
  if (client) {
    return client;
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new SummarizerConfigurationError(
      "Hugging Face API key is not configured. Set HUGGINGFACE_API_KEY to enable AI summaries."
    );
  }

  client = new HfInference(apiKey);
  return client;
};

const formatDate = (value: string) => {
  if (!value) {
    return "Unknown date";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatList = (items: string[]): string =>
  items.length > 0 ? items.join(", ") : "None recorded";

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const formatTimelineSection = (timeline: StudentSummaryPayload["timeline"]) => {
  if (!timeline || timeline.length === 0) {
    return "- No recent timeline events recorded.";
  }

  return timeline
    .map((event) => {
      const date = formatDate(event.date);
      const label = event.label || "No label";
      const details = event.details ? ` — ${event.details}` : "";
      return `- ${date} · ${capitalize(event.type)}: ${label}${details}`;
    })
    .join("\n");
};

const formatCommunicationsSection = (
  communications: StudentSummaryPayload["communications"]
) => {
  if (!communications || communications.length === 0) {
    return "- No recent communications logged.";
  }

  return communications
    .map((entry) => {
      const date = formatDate(entry.date);
      const owner = entry.owner || "Advising Team";
      const subject = entry.subject || "General outreach";
      const notes = entry.notes ? ` — ${entry.notes}` : "";
      return `- ${date} · ${entry.channel} by ${owner}: ${subject}${notes}`;
    })
    .join("\n");
};

const formatNotesSection = (notes: StudentSummaryPayload["notes"]) => {
  if (!notes || notes.length === 0) {
    return "- No internal notes captured.";
  }

  return notes
    .map((note) => {
      const date = formatDate(note.date);
      const author = note.author || "Admissions Team";
      const content = note.content || "";
      return `- ${date} · ${author}: ${content}`;
    })
    .join("\n");
};

const formatRemindersSection = (
  reminders: StudentSummaryPayload["reminders"]
) => {
  if (!reminders || reminders.length === 0) {
    return "- No upcoming reminders.";
  }

  return reminders
    .map((reminder) => {
      const dueDate = formatDate(reminder.dueDate);
      const owner = reminder.owner || "Advising Team";
      const status = reminder.completed ? "Completed" : "Pending";
      const description = reminder.description || "Task";
      return `- ${dueDate} · ${owner} (${status}): ${description}`;
    })
    .join("\n");
};

const buildPrompt = (student: StudentSummaryPayload) => {
  const facts = [
    `Student name: ${student.name}`,
    `Application status: ${student.status}`,
    `Engagement score: ${student.engagementScore}`,
    `High intent: ${student.highIntent ? "Yes" : "No"}`,
    `Needs essay help: ${student.needsEssayHelp ? "Yes" : "No"}`,
    `Last active: ${formatDate(student.lastActive)}`,
    `Last contacted: ${formatDate(student.lastContacted)}`,
  ];

  if (student.programInterests.length > 0) {
    facts.push(`Program interests: ${formatList(student.programInterests)}`);
  }

  if (student.tags.length > 0) {
    facts.push(`Tags: ${formatList(student.tags)}`);
  }

  const sections = [
    "You are assisting an admissions counselor. Summarize the student's current situation in 3-4 sentences, highlighting intent, risks, and the next recommended actions.",
    facts.join("\n"),
    "Recent timeline milestones:",
    formatTimelineSection(student.timeline),
    "Latest communications:",
    formatCommunicationsSection(student.communications),
    "Key internal notes:",
    formatNotesSection(student.notes),
    "Upcoming reminders or tasks:",
    formatRemindersSection(student.reminders),
    "Respond with a cohesive narrative paragraph in natural language without bullet points.",
  ];

  return sections.join("\n\n");
};

const createSignature = (payload: StudentSummaryPayload) =>
  createHash("sha1").update(JSON.stringify(payload)).digest("hex");

export const summarizeStudent = async (
  payload: StudentSummaryPayload
): Promise<{ summary: string; cached: boolean }> => {
  const normalized = normalizeStudentSummaryPayload(payload);

  if (!normalized.id) {
    throw new SummarizerInputError(
      "Student payload is missing an identifier for caching."
    );
  }

  const signature = createSignature(normalized);
  const cacheKey = normalized.id || signature;
  const cached = summaryCache.get(cacheKey);

  if (cached && cached.signature === signature && cached.expiresAt > Date.now()) {
    return { summary: cached.summary, cached: true };
  }

  const prompt = buildPrompt(normalized);

  if (!prompt.trim()) {
    throw new SummarizerInputError(
      "Insufficient context to generate an AI summary for this student."
    );
  }

  const inference = getInferenceClient();

  try {
    const response = await inference.summarization({
      model: SUMMARY_MODEL,
      inputs: prompt,
      parameters: {
        max_length: 220,
        min_length: 80,
      },
    });

    const summary =
      typeof response.summary_text === "string"
        ? response.summary_text.trim()
        : "";

    if (!summary) {
      throw new SummarizerProviderError(
        "Hugging Face summarizer returned an empty response."
      );
    }

    summaryCache.set(cacheKey, {
      summary,
      signature,
      expiresAt: Date.now() + SUMMARY_TTL_MS,
    });

    return { summary, cached: false };
  } catch (error) {
    if (error instanceof SummarizerError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error while calling Hugging Face summarizer.";

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("401") ||
      normalizedMessage.includes("unauthorized")
    ) {
      throw new SummarizerConfigurationError(
        "Hugging Face API request was unauthorized. Check the API key."
      );
    }

    if (normalizedMessage.includes("429")) {
      throw new SummarizerProviderError(
        "Hugging Face API rate limit reached. Please try again shortly.",
        429
      );
    }

    throw new SummarizerProviderError(
      `Failed to generate AI summary: ${message}`
    );
  }
};

export const clearSummaryCache = () => {
  summaryCache.clear();
};
