import { NextResponse } from "next/server";

import { listStudents } from "@/server/students";

export async function GET() {
  try {
    const students = await listStudents();
    return NextResponse.json({
      data: students,
    });
  } catch (error) {
    console.error("Failed to load students", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to load students.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
