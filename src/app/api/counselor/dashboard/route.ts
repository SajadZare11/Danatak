import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const counselor = await prisma.user.findFirst({
      where: { role: "COUNSELOR" },
    });

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        studentProfile: {
          include: {
            masteryRecords: { include: { topic: true } },
            enrollments: { include: { classroom: true } },
          },
        },
        studyLogs: {
          orderBy: { date: "desc" },
          take: 14,
        },
        studyPlansReceived: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        disciplineRecords: true,
        attendanceRecords: true,
      },
    });

    // آمار هر دانش‌آموز برای مشاور
    const studentsSummary = students.map((s) => {
      const logs = s.studyLogs || [];
      const totalMinutes = logs.reduce((acc, l) => acc + l.studyMinutes, 0);
      const weeklyHours = Number((totalMinutes / 60).toFixed(1));
      const totalTests = logs.reduce((acc, l) => acc + l.testCount, 0);

      const masteries = s.studentProfile?.masteryRecords || [];
      const avgMastery =
        masteries.length > 0
          ? Math.round(masteries.reduce((acc, m) => acc + m.masteryPercentage, 0) / masteries.length)
          : 70;

      const weakTopics = masteries
        .filter((m) => m.masteryPercentage < 65)
        .map((m) => ({ title: m.topic.title, percentage: m.masteryPercentage }));

      const activePlan = s.studyPlansReceived && s.studyPlansReceived.length > 0 ? s.studyPlansReceived[0] : null;

      const isAtRisk = avgMastery < 55 || s.disciplineRecords.some((d) => d.type === "NEGATIVE" && d.points < -1);

      return {
        id: s.id,
        fullName: s.fullName,
        nationalId: s.nationalId,
        avatarUrl: s.avatarUrl,
        gradeLevel: s.studentProfile?.gradeLevel || 12,
        major: s.studentProfile?.major || "ریاضی و فیزیک",
        className: s.studentProfile?.enrollments[0]?.classroom?.name || "کلاس ۱۲/۱",
        weeklyHours,
        totalTests,
        avgMastery,
        weakTopics,
        streakDays: s.studentProfile?.currentStreakDays || 0,
        totalXP: s.studentProfile?.totalXP || 0,
        hasActivePlan: !!activePlan,
        isPlanApproved: activePlan?.isApproved || false,
        isAtRisk,
      };
    });

    const totalHoursAll = studentsSummary.reduce((acc, s) => acc + s.weeklyHours, 0);
    const avgWeeklyHoursSchool = studentsSummary.length > 0 ? Number((totalHoursAll / studentsSummary.length).toFixed(1)) : 14.5;

    return NextResponse.json({
      counselor: {
        id: counselor?.id || "counselor-1",
        fullName: counselor?.fullName || "خانم مریم صابری",
        title: "مشاور ارشد تحصیلی و کنکور",
        phoneNumber: counselor?.phoneNumber || "09128888888",
      },
      stats: {
        totalStudents: students.length,
        avgWeeklyHoursSchool,
        activePlansCount: studentsSummary.filter((s) => s.hasActivePlan).length,
        atRiskCount: studentsSummary.filter((s) => s.isAtRisk).length,
      },
      students: studentsSummary,
    });
  } catch (error: any) {
    console.error("Error in GET /api/counselor/dashboard:", error);
    return NextResponse.json({ error: error.message || "Failed to load counselor dashboard" }, { status: 500 });
  }
}
