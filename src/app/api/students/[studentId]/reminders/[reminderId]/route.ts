import { NextRequest, NextResponse } from "next/server";

import { toggleStudentReminder } from "@/server/students";

type RouteParams = {
  params: { studentId: string; reminderId: string };
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { studentId, reminderId } = params;

  try {
    const body = await request.json();
    const completed = Boolean(body.completed);

    const student = await toggleStudentReminder(
      studentId,
      reminderId,
      completed
    );

    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(
      `Failed to update reminder ${reminderId} for student ${studentId}`,
      error
    );
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to update reminder.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
