import { NextRequest, NextResponse } from "next/server";

import { logStudentCommunication } from "@/server/students";

const validChannels = new Set(["Email", "SMS", "Call", "WhatsApp"]);

type RouteParams = {
  params: { studentId: string };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { studentId } = params;

  try {
    const body = await request.json();
    const channel = String(body.channel ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const owner = String(body.owner ?? "").trim();

    if (!validChannels.has(channel)) {
      return NextResponse.json(
        { error: "Invalid communication channel." },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    const student = await logStudentCommunication(studentId, {
      channel: channel as typeof body.channel,
      subject,
      notes,
      owner,
    });

    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(
      `Failed to log communication for student ${studentId}`,
      error
    );
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to log communication.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
