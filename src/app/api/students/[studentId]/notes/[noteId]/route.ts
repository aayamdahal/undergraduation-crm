import { NextRequest, NextResponse } from "next/server";

import { removeStudentNote, updateStudentNote } from "@/server/students";

type RouteParams = {
  params: { studentId: string; noteId: string };
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { studentId, noteId } = params;

  try {
    const body = await request.json();
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 }
      );
    }

    const student = await updateStudentNote(studentId, noteId, {
      content,
    });

    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to update note ${noteId} for student ${studentId}`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to update note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { studentId, noteId } = params;

  try {
    const student = await removeStudentNote(studentId, noteId);
    return NextResponse.json({
      data: student,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(`Failed to delete note ${noteId} for student ${studentId}`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to delete note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
