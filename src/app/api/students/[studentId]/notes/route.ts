import { NextRequest, NextResponse } from "next/server";

import { addStudentNote } from "@/server/students";

type RouteParams = {
  params: { studentId: string };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { studentId } = params;

  try {
    const body = await request.json();
    const author = String(body.author ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!author || !content) {
      return NextResponse.json(
        { error: "Author and content are required." },
        { status: 400 }
      );
    }

    const student = await addStudentNote(studentId, {
      author,
      content,
    });

    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to create note for student ${studentId}`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to save note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
