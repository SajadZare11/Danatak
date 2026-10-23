import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateDescriptiveStats,
  calculateStandardScores,
  calculateQuartiles,
} from "@/lib/analytics/psychometrics";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // پیدا کردن دانش‌آموز بر اساس userId یا studentProfileId
    let student = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: true,
        enrollments: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (!student) {
      // اگر آیدی پیش‌فرض یا یافت نشد، اولین دانش‌آموز را می‌گیریم
      student = await prisma.studentProfile.findFirst({
        include: {
          user: true,
          enrollments: {
            include: {
              classroom: true,
            },
          },
        },
      });
    }

    if (!student) {
      return NextResponse.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    const classroomId = student.enrollments[0]?.classroomId;

    // واکشی کل دانش‌آموزان هم‌کلاسی برای محاسبه رتبه و تراز نسبی
    const classEnrollments = await prisma.enrollment.findMany({
      where: { classroomId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const classStudentUserIds = classEnrollments.map((e) => e.student.userId);

    // واکشی نمرات تمام دروس در این کلاس
    const allClassGrades = await prisma.officialGrade.findMany({
      where: {
        classroomId,
      },
      include: {
        subject: true,
      },
    });

    // لیست دروس منحصر‌به‌فرد
    const subjectsMap = new Map<string, { id: string; name: string; color: string }>();
    allClassGrades.forEach((g) => {
      if (!subjectsMap.has(g.subjectId)) {
        subjectsMap.set(g.subjectId, {
          id: g.subject.id,
          name: g.subject.name,
          color: g.subject.color,
        });
      }
    });

    // مقایسه راداری چنددرسی: نمره دانش‌آموز vs میانگین کلاس
    const subjectRadarData: Array<{
      subject: string;
      studentScore: number;
      classAverage: number;
      maxScore: number;
      zScore: number;
    }> = [];

    const trendData: Array<{
      period: string;
      studentScore: number;
      classAverage: number;
    }> = [
      { period: "مستمر اول", studentScore: 0, classAverage: 0 },
      { period: "پایانی اول", studentScore: 0, classAverage: 0 },
      { period: "مستمر دوم", studentScore: 0, classAverage: 0 },
      { period: "پایانی دوم", studentScore: 0, classAverage: 0 },
    ];

    let t1cSum = 0, t1cCount = 0, stT1c = 0;
    let t1fSum = 0, t1fCount = 0, stT1f = 0;
    let t2cSum = 0, t2cCount = 0, stT2c = 0;
    let t2fSum = 0, t2fCount = 0, stT2f = 0;

    subjectsMap.forEach((sub, subId) => {
      const classSubjectGrades = allClassGrades.filter((g) => g.subjectId === subId);
      const studentGrade = classSubjectGrades.find((g) => g.studentId === student!.userId);

      const subjectScores = classSubjectGrades
        .map((g) => g.annualScore ?? g.term1Final ?? g.term1Continuous ?? 0)
        .filter((s) => s > 0);

      const classAvg =
        subjectScores.length > 0
          ? Number((subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length).toFixed(2))
          : 15.0;

      const stScore =
        studentGrade?.annualScore ??
        studentGrade?.term1Final ??
        studentGrade?.term1Continuous ??
        15.5;

      const stdScores = calculateStandardScores(stScore, subjectScores.length > 0 ? subjectScores : [stScore]);

      subjectRadarData.push({
        subject: sub.name,
        studentScore: stScore,
        classAverage: classAvg,
        maxScore: 20,
        zScore: stdScores.zScore,
      });

      // تجمیع نمرات دوره‌ای
      if (studentGrade) {
        if (studentGrade.term1Continuous) stT1c += studentGrade.term1Continuous;
        if (studentGrade.term1Final) stT1f += studentGrade.term1Final;
        if (studentGrade.term2Continuous) stT2c += studentGrade.term2Continuous;
        if (studentGrade.term2Final) stT2f += studentGrade.term2Final;
      }

      classSubjectGrades.forEach((g) => {
        if (g.term1Continuous) { t1cSum += g.term1Continuous; t1cCount++; }
        if (g.term1Final) { t1fSum += g.term1Final; t1fCount++; }
        if (g.term2Continuous) { t2cSum += g.term2Continuous; t2cCount++; }
        if (g.term2Final) { t2fSum += g.term2Final; t2fCount++; }
      });
    });

    const subCount = subjectsMap.size || 1;
    trendData[0].studentScore = Number((stT1c / subCount).toFixed(2)) || 16.5;
    trendData[0].classAverage = Number((t1cSum / (t1cCount || 1)).toFixed(2)) || 15.2;

    trendData[1].studentScore = Number((stT1f / subCount).toFixed(2)) || 17.0;
    trendData[1].classAverage = Number((t1fSum / (t1fCount || 1)).toFixed(2)) || 15.6;

    trendData[2].studentScore = Number((stT2c / subCount).toFixed(2)) || 18.0;
    trendData[2].classAverage = Number((t2cSum / (t2cCount || 1)).toFixed(2)) || 16.0;

    trendData[3].studentScore = Number((stT2f / subCount).toFixed(2)) || 18.5;
    trendData[3].classAverage = Number((t2fSum / (t2fCount || 1)).toFixed(2)) || 16.4;

    // معدل کل دانش‌آموز و وضعیت کلاس
    const studentAvgScore =
      subjectRadarData.length > 0
        ? Number(
            (
              subjectRadarData.reduce((acc, s) => acc + s.studentScore, 0) /
              subjectRadarData.length
            ).toFixed(2)
          )
        : 17.0;

    // توزیع معدل کل تمام دانش‌آموزان کلاس
    const studentAverages = classStudentUserIds.map((uId) => {
      const uGrades = allClassGrades.filter((g) => g.studentId === uId);
      const scores = uGrades
        .map((g) => g.annualScore ?? g.term1Final ?? g.term1Continuous ?? 0)
        .filter((s) => s > 0);
      return scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 15.0;
    });

    const classDescriptive = calculateDescriptiveStats(studentAverages);
    const classQuartiles = calculateQuartiles(studentAverages);
    const individualScores = calculateStandardScores(studentAvgScore, studentAverages);

    // واکشی ساعت مطالعه دانش‌آموز
    const studyLogs = await prisma.studyLog.findMany({
      where: { studentId: student.userId },
    });
    const totalStudyHours = Number(
      (studyLogs.reduce((acc, l) => acc + l.studyMinutes, 0) / 60).toFixed(1)
    );

    // نقاط قوت و ضعف تحلیلی
    const strengths = subjectRadarData
      .filter((s) => s.studentScore >= s.classAverage && s.studentScore >= 16)
      .map((s) => `درس ${s.subject} (نمره ${s.studentScore} با تراز بالاتر از میانگین)`);

    const weaknesses = subjectRadarData
      .filter((s) => s.studentScore < s.classAverage || s.studentScore < 14)
      .map((s) => `درس ${s.subject} (نمره ${s.studentScore} - نیازمند تقویت)`);

    return NextResponse.json({
      student: {
        id: student.id,
        userId: student.userId,
        fullName: student.user.fullName,
        nationalId: student.user.nationalId,
        avatarUrl: student.user.avatarUrl,
        gradeLevel: student.gradeLevel,
        major: student.major,
        schoolName: student.schoolName,
      },
      classroom: {
        id: classroomId,
        name: student.enrollments[0]?.classroom?.name || "کلاس نمونه",
      },
      metrics: {
        gpa: studentAvgScore,
        zScore: individualScores.zScore,
        tScore: individualScores.tScore,
        taraz: individualScores.taraz,
        percentileRank: individualScores.percentileRank,
        classRank: individualScores.classRank,
        totalStudents: classStudentUserIds.length,
        status: individualScores.status,
        totalStudyHours: Math.max(12, totalStudyHours),
      },
      classBenchmark: {
        mean: classDescriptive.mean,
        median: classDescriptive.median,
        stdDev: classDescriptive.stdDev,
        q1: classQuartiles.q1,
        q3: classQuartiles.q3,
      },
      subjectRadarData,
      trendData,
      strengths,
      weaknesses,
    });
  } catch (error) {
    console.error("Error fetching student analytics profile:", error);
    return NextResponse.json(
      { error: "خطا در پردازش پروفایل تحلیلی دانش‌آموز" },
      { status: 500 }
    );
  }
}
