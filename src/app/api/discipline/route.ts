import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: دریافت سوابق انضباطی (کارت‌های تشویقی و تذکری)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classroomId = searchParams.get("classroomId");

    const whereClause: any = {};
    if (studentId) {
      whereClause.studentId = studentId;
    } else if (classroomId) {
      // دانش‌آموزان این کلاس
      const enrollments = await prisma.enrollment.findMany({
        where: { classroomId },
        select: { student: { select: { userId: true } } },
      });
      const userIds = enrollments.map((e) => e.student.userId);
      whereClause.studentId = { in: userIds };
    }

    const records = await prisma.disciplineRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            avatarUrl: true,
            studentProfile: {
              select: {
                gradeLevel: true,
                major: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const positiveRecords = records.filter((r) => r.type === "POSITIVE");
    const negativeRecords = records.filter((r) => r.type === "NEGATIVE");

    const totalPositivePoints = positiveRecords.reduce((acc, r) => acc + Math.abs(r.points), 0);
    const totalNegativePoints = negativeRecords.reduce((acc, r) => acc + Math.abs(r.points), 0);
    const netPoints = totalPositivePoints - totalNegativePoints;

    return NextResponse.json({
      records,
      stats: {
        totalRecords: records.length,
        positiveCount: positiveRecords.length,
        negativeCount: negativeRecords.length,
        totalPositivePoints,
        totalNegativePoints,
        netPoints,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/discipline:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch discipline records" }, { status: 500 });
  }
}

// POST: ثبت کارت مثبت یا منفی جدید برای دانش‌آموز
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, type, title, points, recordedBy, note } = body as {
      studentId: string;
      type: "POSITIVE" | "NEGATIVE";
      title: string;
      points?: number;
      recordedBy?: string;
      note?: string;
    };

    if (!studentId || !type || !title) {
      return NextResponse.json({ error: "Missing required fields: studentId, type, title" }, { status: 400 });
    }

    const assignedPoints = points ?? (type === "POSITIVE" ? 1 : -1);

    const record = await prisma.disciplineRecord.create({
      data: {
        studentId,
        type,
        title,
        points: Math.abs(assignedPoints) * (type === "POSITIVE" ? 1 : -1),
        recordedBy: recordedBy || "کادر اجرایی مدرسه",
        note: note || "",
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentProfile: true,
          },
        },
      },
    });

    // اگر تشویقی بود، به امتیاز XP دانش‌آموز هم اضافه شود (+15 XP به ازای هر امتیاز مثبت)
    if (type === "POSITIVE" && record.student.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: record.student.studentProfile.id },
        data: {
          totalXP: {
            increment: Math.abs(assignedPoints) * 15,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${type === "POSITIVE" ? "کارت تشویقی" : "کارت انضباطی"} با موفقیت برای ${record.student.fullName} ثبت گردید.`,
      record,
    });
  } catch (error: any) {
    console.error("Error in POST /api/discipline:", error);
    return NextResponse.json({ error: error.message || "Failed to record discipline" }, { status: 500 });
  }
}
