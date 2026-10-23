import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    // دریافت خلاصه‌های ارزشیابی دبیران
    const summaries = await prisma.teacherEvaluationSummary.findMany({
      orderBy: { overallScore: "desc" },
    });

    // دریافت رکوردهای بازخورد ناشناس
    const whereClause: any = {};
    if (teacherId && teacherId !== "ALL") {
      whereClause.teacherId = teacherId;
    }

    const records = await prisma.teacherEvaluationRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // محاسبات میانگین کل مدرسه
    const totalForms = summaries.reduce((acc, s) => acc + s.totalEvaluations, 0);
    const schoolAverageScore =
      summaries.length > 0
        ? (summaries.reduce((acc, s) => acc + s.overallScore, 0) / summaries.length).toFixed(1)
        : "90.5";

    const topTeacher = summaries[0] || null;

    return NextResponse.json({
      success: true,
      stats: {
        totalEvaluations: totalForms,
        schoolAverageScore: Number(schoolAverageScore),
        teachersCount: summaries.length,
        topTeacherName: topTeacher?.teacherName || "استاد احسان محمدی",
        topTeacherScore: topTeacher?.overallScore || 94.6,
      },
      summaries,
      recentFeedbacks: records,
    });
  } catch (error: any) {
    console.error("Evaluation API GET error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت نتایج ارزشیابی" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      teacherId = "teacher-demo",
      teacherName = "استاد احسان محمدی",
      subjectName = "حسابان ۲",
      evaluatorRole = "STUDENT",
      className = "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      academicMastery = 5.0,
      gradingFairness = 5.0,
      professionalEthics = 5.0,
      classroomDiscipline = 5.0,
      inspiration = 5.0,
      parentEngagement = 5.0,
      strengthsText = "",
      improvementSuggestions = "",
    } = body;

    // محاسبه درصد میانگین وزنی
    const sumPoints =
      academicMastery +
      gradingFairness +
      professionalEthics +
      classroomDiscipline +
      inspiration +
      parentEngagement;
    const overallScore = Number(((sumPoints / 30) * 100).toFixed(1));

    // ذخیره رکورد ناشناس
    const newRecord = await prisma.teacherEvaluationRecord.create({
      data: {
        teacherId,
        teacherName,
        subjectName,
        evaluatorRole,
        className,
        academicMastery,
        gradingFairness,
        professionalEthics,
        classroomDiscipline,
        inspiration,
        parentEngagement,
        overallScore,
        strengthsText,
        improvementSuggestions,
      },
    });

    // به‌روزرسانی خلاصه تجمیعی دبیر
    const summary = await prisma.teacherEvaluationSummary.findUnique({
      where: { teacherId },
    });

    if (summary) {
      const nextTotal = summary.totalEvaluations + 1;
      const nextScore = Number(((summary.overallScore * summary.totalEvaluations + overallScore) / nextTotal).toFixed(1));

      await prisma.teacherEvaluationSummary.update({
        where: { teacherId },
        data: {
          totalEvaluations: nextTotal,
          overallScore: nextScore,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "ارزشیابی محرمانه شما با موفقیت ثبت و در تحلیل‌های کیفی مدرسه اعمال گردید.",
      record: newRecord,
    });
  } catch (error: any) {
    console.error("Evaluation API POST error:", error);
    return NextResponse.json({ success: false, error: "خطا در ثبت ارزشیابی" }, { status: 500 });
  }
}
