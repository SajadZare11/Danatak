import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { gradeLevel: "asc" },
    });

    const subjects = await prisma.subject.findMany({
      include: {
        textbooks: {
          select: { id: true, title: true, gradeLevel: true },
        },
      },
    });

    return NextResponse.json({
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        major: c.major,
        teacherName: c.teacher?.user?.fullName || "نامشخص",
        studentCount: c._count.enrollments,
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color,
      })),
    });
  } catch (error) {
    console.error("Error fetching classrooms for analytics:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست کلاس‌ها و دروس" },
      { status: 500 }
    );
  }
}
