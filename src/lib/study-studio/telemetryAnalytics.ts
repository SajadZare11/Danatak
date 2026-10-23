import { prisma } from "@/lib/prisma";

export interface StudentTelemetryReport {
  studentId: string;
  studentName: string;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  totalActiveMinutes: number;
  focusRatio: number; // ۰ تا ۱۰۰ درصد
  cardsReviewedCount: number;
  totalCardLapses: number;
  quizAttemptsCount: number;
  avgQuizPercentage: number;
  isStruggling: boolean;
  strugglingReasons: string[];
  topicHeatmap: Array<{
    topicTag: string;
    masteryPercentage: number;
    status: "GOOD" | "MEDIUM" | "WEAK";
    activeMinutes: number;
    quizCount: number;
  }>;
  recentLogs: Array<{
    id: string;
    eventType: string;
    topicTag?: string | null;
    activeSeconds: number;
    idleSeconds: number;
    createdAt: Date;
  }>;
  assignments: Array<{
    id: string;
    studyPackTitle: string;
    topicTag?: string | null;
    dueDate: Date;
    minMasteryScore: number;
    bestPercentage: number;
    isCompleted: boolean;
    status: string;
  }>;
}

export class TelemetryAnalyticsService {
  /**
   * محاسبه جامع شاخص‌های تمرکز، تسلط و وضعیت دانش‌آموزان لب مرز
   */
  static async getStudentReport(studentId: string): Promise<StudentTelemetryReport> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            enrollments: true,
            masteryRecords: {
              include: { topic: true },
            },
          },
        },
        cardProgresses: true,
        studyQuizAttempts: true,
        studyTelemetryLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!student) {
      throw new Error("دانش‌آموز یافت نشد.");
    }

    // ۱. محاسبه مجموع زمان‌های فعال و غیرفعال از لاگ‌های دورسنجی
    const allTelemetry = await prisma.studyTelemetryLog.findMany({
      where: { studentId },
    });

    let totalActiveSeconds = 0;
    let totalIdleSeconds = 0;

    for (const log of allTelemetry) {
      totalActiveSeconds += log.activeDurationSeconds || 0;
      totalIdleSeconds += log.idleDurationSeconds || 0;
    }

    const totalSeconds = totalActiveSeconds + totalIdleSeconds;
    const focusRatio = totalSeconds > 0 ? Math.round((totalActiveSeconds / totalSeconds) * 100) : 100;
    const idleRatio = totalSeconds > 0 ? Math.round((totalIdleSeconds / totalSeconds) * 100) : 0;

    // ۲. تحلیل وضعیت فلش‌کارت‌های SM-2
    const cardsReviewedCount = student.cardProgresses.length;
    let totalCardLapses = 0;
    for (const cp of student.cardProgresses) {
      totalCardLapses += cp.lapseCount || 0;
    }

    // ۳. تحلیل نتایج کوییزها
    const quizAttempts = student.studyQuizAttempts;
    const quizAttemptsCount = quizAttempts.length;
    const avgQuizPercentage =
      quizAttemptsCount > 0
        ? Math.round(
            quizAttempts.reduce((acc, q) => acc + (q.percentage || 0), 0) / quizAttemptsCount
          )
        : 80;

    // ۴. تشخیص وضعیت دانش‌آموزان لب مرز افت (Struggling Student Alert)
    const strugglingReasons: string[] = [];

    if (quizAttemptsCount > 0 && avgQuizPercentage < 60) {
      strugglingReasons.push(`میانگین نمره آزمون‌های تشخیصی زیر ۶۰٪ است (${avgQuizPercentage}٪)`);
    }

    if (totalCardLapses >= 2) {
      strugglingReasons.push(`تکرار فراموشی و افت کارت‌ها در الگوریتم SM-2 (${totalCardLapses} بار)`);
    }

    if (totalSeconds >= 60 && idleRatio > 35) {
      strugglingReasons.push(`نسبت بالای زمان غیرفعال و عدم تمرکز در برگه استودیو (${idleRatio}٪ زمان غیرفعال)`);
    }

    const isStruggling = strugglingReasons.length > 0;

    // ۵. ساخت نقشه حرارتی سرفصل‌ها (Topic Heatmap)
    const topicMap: Record<string, { activeSeconds: number; quizScores: number[] }> = {};

    for (const log of allTelemetry) {
      const tag = log.topicTag || "مفاهیم تحلیلی";
      if (!topicMap[tag]) topicMap[tag] = { activeSeconds: 0, quizScores: [] };
      topicMap[tag].activeSeconds += log.activeDurationSeconds || 0;
    }

    for (const qa of quizAttempts) {
      const pack = await prisma.studyQuiz.findUnique({
        where: { id: qa.quizId },
        include: { studyPack: true },
      });
      const tag = pack?.studyPack?.topicTag || "مفاهیم تحلیلی";
      if (!topicMap[tag]) topicMap[tag] = { activeSeconds: 0, quizScores: [] };
      if (qa.percentage !== null) topicMap[tag].quizScores.push(qa.percentage);
    }

    const topicHeatmap = Object.entries(topicMap).map(([topicTag, data]) => {
      const avgScore =
        data.quizScores.length > 0
          ? Math.round(data.quizScores.reduce((a, b) => a + b, 0) / data.quizScores.length)
          : 75;

      const activeMinutes = Math.round(data.activeSeconds / 60);

      // فرمول تسلط: ترکیب نمره کوییز و استمرار
      let mastery = avgScore;
      if (activeMinutes > 15) mastery = Math.min(100, mastery + 5);

      const status: "GOOD" | "MEDIUM" | "WEAK" =
        mastery >= 75 ? "GOOD" : mastery >= 50 ? "MEDIUM" : "WEAK";

      return {
        topicTag,
        masteryPercentage: mastery,
        status,
        activeMinutes,
        quizCount: data.quizScores.length,
      };
    });

    if (topicHeatmap.length === 0) {
      topicHeatmap.push({
        topicTag: "مشتق و اکسترمم‌های تابع",
        masteryPercentage: avgQuizPercentage,
        status: avgQuizPercentage >= 75 ? "GOOD" : avgQuizPercentage >= 50 ? "MEDIUM" : "WEAK",
        activeMinutes: Math.round(totalActiveSeconds / 60),
        quizCount: quizAttemptsCount,
      });
    }

    // ۶. استخراج تکالیف ابلاغ‌شده استودیو برای این دانش‌آموز
    const classroomIds = student.studentProfile?.enrollments?.map((e) => e.classroomId) || [];
    const dbAssignments = await prisma.studyPackAssignment.findMany({
      where: {
        OR: [
          { studentId },
          { classroomId: { in: classroomIds } },
        ],
      },
      include: {
        studyPack: {
          include: {
            quizzes: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const studentAssignments = await Promise.all(
      dbAssignments.map(async (asgn) => {
        const quizIds = asgn.studyPack.quizzes.map((q) => q.id);
        const attempts = await prisma.studyQuizAttempt.findMany({
          where: {
            studentId,
            quizId: { in: quizIds },
          },
          orderBy: { percentage: "desc" },
        });

        const bestPercentage = attempts.length > 0 ? (attempts[0].percentage || 0) : 0;
        const isCompleted = bestPercentage >= asgn.minMasteryScore;

        return {
          id: asgn.id,
          studyPackTitle: asgn.studyPack.title,
          topicTag: asgn.studyPack.topicTag || "عمومی",
          dueDate: asgn.dueDate,
          minMasteryScore: asgn.minMasteryScore,
          bestPercentage,
          isCompleted,
          status: isCompleted ? "COMPLETED" : attempts.length > 0 ? "IN_PROGRESS" : "PENDING",
        };
      })
    );

    return {
      studentId,
      studentName: student.fullName,
      totalActiveSeconds,
      totalIdleSeconds,
      totalActiveMinutes: Math.round(totalActiveSeconds / 60),
      focusRatio,
      cardsReviewedCount,
      totalCardLapses,
      quizAttemptsCount,
      avgQuizPercentage,
      isStruggling,
      strugglingReasons,
      topicHeatmap,
      recentLogs: student.studyTelemetryLogs.map((l) => ({
        id: l.id,
        eventType: l.eventType,
        topicTag: l.topicTag,
        activeSeconds: l.activeDurationSeconds,
        idleSeconds: l.idleDurationSeconds,
        createdAt: l.createdAt,
      })),
      assignments: studentAssignments,
    };
  }
}
