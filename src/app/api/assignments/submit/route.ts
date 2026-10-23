import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignmentId, studentId, answers, isPrintSheet } = body;

    if (!assignmentId || !studentId || !answers) {
      return NextResponse.json({ error: "اطلاعات ارسالی برای ثبت پاسخنامه ناقص است" }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: "تکلیف یافت نشد" }, { status: 404 });
    }

    let questionIds: string[] = [];
    try {
      questionIds = JSON.parse(assignment.questionsJson);
    } catch {
      questionIds = [];
    }

    // واکشی سوالات برای تصحیح خودکار تستی‌ها
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    let correctCount = 0;
    let autoGradableCount = 0;

    questions.forEach((q) => {
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        autoGradableCount++;
        const chosen = answers[q.id];
        const correctOpt = q.options.find((o) => o.isCorrect);

        if (chosen && correctOpt) {
          // اگر آیدی گزینه تطابق داشته باشد یا متن آن
          if (chosen === correctOpt.id || chosen === String(correctOpt.orderIndex)) {
            correctCount++;
          }
        }
      }
    });

    // محاسبه نمره اولیه
    const totalScoreMax = assignment.maxScore;
    const scorePerQuestion = autoGradableCount > 0 ? totalScoreMax / questions.length : 0;
    const initialScore = Number((correctCount * scorePerQuestion).toFixed(2));
    const percentage = autoGradableCount > 0 ? Math.round((correctCount / autoGradableCount) * 100) : 100;

    // ثبت یا به‌روزرسانی در دیتابیس
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        id: body.submissionId || "temp-new-sub",
      },
      update: {
        submittedAt: new Date(),
        status: autoGradableCount === questions.length ? "GRADED" : "SUBMITTED",
        score: initialScore,
        answersJson: JSON.stringify(answers),
      },
      create: {
        assignmentId,
        studentId,
        submittedAt: new Date(),
        status: autoGradableCount === questions.length ? "GRADED" : "SUBMITTED",
        score: initialScore,
        answersJson: JSON.stringify(answers),
      },
    });

    // اعطای امتیاز تجربه (XP) به دانش‌آموز بابت تحویل تکلیف
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true },
    });

    if (studentUser?.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          totalXP: { increment: 30 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      submission,
      score: initialScore,
      percentage,
      correctCount,
      totalAutoGradable: autoGradableCount,
      awardedXP: 30,
      message: `تکلیف با موفقیت ارسال شد. نتیجه تصحیح خودکار: ${correctCount} از ${autoGradableCount} پاسخ صحیح (نمره: ${initialScore} از ${totalScoreMax}).`,
    });
  } catch (error) {
    console.error("Assignment Submit error:", error);
    return NextResponse.json({ error: "خطا در ثبت پاسخنامه تکلیف" }, { status: 500 });
  }
}
