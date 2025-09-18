import { NextRequest, NextResponse } from "next/server";

import { triggerStudentFollowUp } from "@/server/students";

type RouteParams = {
  params: { studentId: string };
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { studentId } = params;

  try {
    const student = await triggerStudentFollowUp(studentId);
    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to trigger follow-up for student ${studentId}`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to trigger follow-up.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
