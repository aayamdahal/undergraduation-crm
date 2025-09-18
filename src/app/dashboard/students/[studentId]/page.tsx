import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudentDetailClient } from "@/components/dashboard/StudentDetailClient";
import { getStudent } from "@/server/students";

type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

export async function generateMetadata({
  params,
}: StudentDetailPageProps): Promise<Metadata> {
  const { studentId } = await params;

  try {
    const student = await getStudent(studentId);
    return {
      title: `${student.name} · Student Profile | Undergraduation Admin`,
    } satisfies Metadata;
  } catch {
    return {
      title: "Student not found · Undergraduation Admin",
    } satisfies Metadata;
  }
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { studentId } = await params;

  try {
    const student = await getStudent(studentId);
    return <StudentDetailClient initialStudent={student} />;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Failed to load student ${studentId}`, error);
    }
    notFound();
  }
}
