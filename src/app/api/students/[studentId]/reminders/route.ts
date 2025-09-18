import { NextRequest, NextResponse } from "next/server";

import { createStudentReminder } from "@/server/students";

type RouteParams = {
  params: { studentId: string };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { studentId } = params;

  try {
    const body = await request.json();
    const dueDate = String(body.dueDate ?? "").trim();
    const description = String(body.description ?? "").trim();
    const owner = String(body.owner ?? "").trim();

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return NextResponse.json(
        { error: "A valid due date is required." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    }

    const student = await createStudentReminder(studentId, {
      dueDate,
      description,
      owner,
    });

    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to create reminder for student ${studentId}`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to create reminder.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
