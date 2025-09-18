import { NextResponse } from "next/server";

import { normalizeStudentSummaryPayload } from "@/lib/studentSummary";
import {
  SummarizerError,
  summarizeStudent,
} from "@/server/ai/summarizer";
import type { StudentSummaryRequestBody } from "@/types/studentSummary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  let body: StudentSummaryRequestBody;

  try {
    body = (await request.json()) as StudentSummaryRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !body.student) {
    return NextResponse.json(
      { error: "Request body must include a student payload." },
      { status: 400 }
    );
  }

  const normalized = normalizeStudentSummaryPayload(body.student);

  if (!normalized.id) {
    return NextResponse.json(
      { error: "Student payload must include an id." },
      { status: 400 }
    );
  }

  if (studentId && normalized.id !== studentId) {
    return NextResponse.json(
      { error: "Student id in path and payload do not match." },
      { status: 400 }
    );
  }

  try {
    const { summary, cached } = await summarizeStudent(normalized);
    return NextResponse.json({ summary, cached });
  } catch (error) {
    if (error instanceof SummarizerError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while generating AI summary.";

    return NextResponse.json(
      { error: `Unable to generate AI summary: ${message}` },
      { status: 500 }
    );
  }
}
