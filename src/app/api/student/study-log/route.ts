import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    let student = studentId
      ? await prisma.user.findUnique({
          where: { id: studentId },
          include: {
            studentProfile: true,
            studyLogs: {
              include: { subject: true, topic: true },
              orderBy: { date: "desc" },
              take: 14,
            },
            studyPlansReceived: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : await prisma.user.findFirst({
          where: { role: "STUDENT" },
          include: {
            studentProfile: true,
            studyLogs: {
              include: { subject: true, topic: true },
              orderBy: { date: "desc" },
              take: 14,
            },
            studyPlansReceived: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const logs = student.studyLogs || [];
    const totalMinutes = logs.reduce((acc, l) => acc + l.studyMinutes, 0);
    const weeklyHours = Number((totalMinutes / 60).toFixed(1));
    const totalTests = logs.reduce((acc, l) => acc + l.testCount, 0);

    const activePlan = student.studyPlansReceived && student.studyPlansReceived.length > 0 ? student.studyPlansReceived[0] : null;

    let schedule = [];
    try {
      if (activePlan?.scheduleJson) {
        schedule = JSON.parse(activePlan.scheduleJson);
      }
    } catch {
      schedule = [];
    }

    // لیست دروس برای فرم ثبت گزارش
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, color: true },
    });

    return NextResponse.json({
      studentId: student.id,
      stats: {
        weeklyHours,
        totalTests,
        streakDays: student.studentProfile?.currentStreakDays || 0,
        totalXP: student.studentProfile?.totalXP || 0,
      },
      logs: logs.map((l) => ({
        id: l.id,
        subjectName: l.subject.name,
        dateFa: new Date(l.date).toLocaleDateString("fa-IR"),
        studyMinutes: l.studyMinutes,
        testCount: l.testCount,
        note: l.note,
      })),
      activePlan: activePlan
        ? {
            id: activePlan.id,
            isApproved: activePlan.isApproved,
            counselorNote: activePlan.counselorNote,
            schedule,
          }
        : null,
      subjects,
    });
  } catch (error: any) {
    console.error("Error in GET /api/student/study-log:", error);
    return NextResponse.json({ error: error.message || "Failed to load study logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, subjectId, studyMinutes, testCount, note } = body as {
      studentId: string;
      subjectId: string;
      studyMinutes: number;
      testCount?: number;
      note?: string;
    };

    if (!studentId || !subjectId || !studyMinutes) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true },
    });

    if (!student || !student.studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ایجاد لاگ مطالعه جدید
    const log = await prisma.studyLog.create({
      data: {
        studentId: student.id,
        subjectId,
        studyMinutes: parseInt(String(studyMinutes)),
        testCount: testCount ? parseInt(String(testCount)) : 0,
        note: note || "",
        date: new Date(),
      },
    });

    // ارتقای امتیاز دانش‌آموز: +۱۰ XP بابت ثبت گزارش مطالعه روزانه و افزایش استمرار
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: student.studentProfile.id },
      data: {
        totalXP: { increment: 10 },
        currentStreakDays: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: "گزارش مطالعه روزانه با موفقیت ثبت شد و ۱۰ XP به شما تعلق گرفت!",
      log,
      newXP: updatedProfile.totalXP,
      newStreak: updatedProfile.currentStreakDays,
    });
  } catch (error: any) {
    console.error("Error in POST /api/student/study-log:", error);
    return NextResponse.json({ error: error.message || "Failed to save study log" }, { status: 500 });
  }
}
