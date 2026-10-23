import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentProfileId, topicId, correctCount, totalQuestions } = body;

    if (!studentProfileId || !topicId || totalQuestions === undefined) {
      return NextResponse.json({ error: "اطلاعات ارسالی ناقص است" }, { status: 400 });
    }

    const calculatedPercentage = Math.round((Number(correctCount) / Number(totalQuestions)) * 100);

    // به‌روزرسانی رکورد تسلط برای مبحث پیش‌نیاز
    const updated = await prisma.topicMastery.upsert({
      where: {
        studentProfileId_topicId: {
          studentProfileId,
          topicId,
        },
      },
      update: {
        masteryPercentage: calculatedPercentage,
        lastEvaluatedAt: new Date(),
        evaluatedBy: "DIAGNOSTIC_TEST",
      },
      create: {
        studentProfileId,
        topicId,
        masteryPercentage: calculatedPercentage,
        evaluatedBy: "DIAGNOSTIC_TEST",
      },
    });

    // افزایش امتیاز تجربه (XP) برای دانش‌آموز بابت عارضه‌یابی
    await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        totalXP: { increment: 45 },
      },
    });

    return NextResponse.json({
      success: true,
      masteryPercentage: calculatedPercentage,
      awardedXP: 45,
      record: updated,
      message: `آزمون تشخیصی ثبت شد: تسلط جدید در مبحث پیش‌نیاز برابر ${calculatedPercentage}٪ شد.`,
    });
  } catch (error) {
    console.error("Diagnostic submit error:", error);
    return NextResponse.json({ error: "خطا در ثبت نتایج تست تشخیصی" }, { status: 500 });
  }
}
