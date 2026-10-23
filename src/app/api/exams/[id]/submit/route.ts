import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await req.json();
    const {
      studentId: studentIdParam,
      answers,
      tabSwitchCount = 0,
      warningLogs = [],
    } = body;

    let studentId = studentIdParam;
    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT", nationalId: "0022334455" },
      });
      studentId = defaultStudent?.id || "";
    }

    if (!examId || !studentId || !answers) {
      return NextResponse.json({ error: "اطلاعات ارسالی برای ثبت آزمون ناقص است" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "آزمون یافت نشد" }, { status: 404 });
    }

    let questionIds: string[] = [];
    try {
      questionIds = JSON.parse(exam.questionsJson);
    } catch {
      questionIds = [];
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true, topic: true },
    });

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    // بررسی گزینه‌ها و تصحیح خودکار
    questions.forEach((q) => {
      const chosen = answers[q.id];
      if (!chosen) {
        unansweredCount++;
        return;
      }

      const correctOpt = q.options.find((o) => o.isCorrect);
      if (correctOpt) {
        if (chosen === correctOpt.id || chosen === String(correctOpt.orderIndex)) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const totalQuestions = questions.length || 1;

    // فرمول درصد کنکور با احتساب نمره منفی ۱/۳: ((۳ * درست - غلط) / (۳ * کل)) * ۱۰۰
    const rawPercentage =
      totalQuestions > 0
        ? ((3 * correctCount - wrongCount) / (3 * totalQuestions)) * 100
        : 0;
    const percentage = Number(rawPercentage.toFixed(2));

    // نمره از ۲۰
    const scoreFrom20 = Number(Math.max(0, (percentage * 0.2)).toFixed(2));

    // محاسبه تراز استاندارد کنکوری (میانگین ۵۰۰۰، انحراف معیار ۱۰۰۰)
    const taraz = Math.max(3000, Math.min(8500, Math.round(5000 + (percentage - 50) * 45)));

    // ثبت کارنامه در دیتابیس
    const attempt = await prisma.examAttempt.upsert({
      where: {
        id: body.attemptId || "temp-new-attempt",
      },
      update: {
        submittedAt: new Date(),
        score: scoreFrom20,
        percentage,
        taraz,
        tabSwitchCount: Number(tabSwitchCount),
        answersJson: JSON.stringify(answers),
        warningLogsJson: JSON.stringify(warningLogs),
      },
      create: {
        examId,
        studentId,
        submittedAt: new Date(),
        score: scoreFrom20,
        percentage,
        taraz,
        tabSwitchCount: Number(tabSwitchCount),
        answersJson: JSON.stringify(answers),
        warningLogsJson: JSON.stringify(warningLogs),
      },
    });

    // انتقال خودکار سوالات غلط یا نزده به دفترچه اشتباهات هوشمند
    let mistakesLogged = 0;
    for (const q of questions) {
      const chosen = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      const isCorrect =
        chosen && correctOpt && (chosen === correctOpt.id || chosen === String(correctOpt.orderIndex));

      if (!isCorrect) {
        await prisma.studentMistake.upsert({
          where: {
            studentId_questionId: {
              studentId,
              questionId: q.id,
            },
          },
          update: {
            source: "EXAM",
            selectedOpt: chosen ? String(chosen) : "بی‌پاسخ",
            errorReason: !chosen ? "کمبود زمان" : "عدم تسلط مفهومی",
            isResolved: false,
          },
          create: {
            studentId,
            questionId: q.id,
            source: "EXAM",
            selectedOpt: chosen ? String(chosen) : "بی‌پاسخ",
            errorReason: !chosen ? "کمبود زمان" : "عدم تسلط مفهومی",
            isResolved: false,
          },
        });
        mistakesLogged++;
      }
    }

    // اعطای ۵۰ امتیاز تجربه (XP) و ارتقای پروفایل
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true },
    });

    if (studentUser?.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          totalXP: { increment: 50 },
        },
      });

      // به‌روزرسانی رادار تسلط در صورت وجود مبحث
      if (exam.topicId) {
        const clampedPct = Math.max(0, Math.min(100, Math.round(percentage)));
        await prisma.topicMastery.upsert({
          where: {
            studentProfileId_topicId: {
              studentProfileId: studentUser.studentProfile.id,
              topicId: exam.topicId,
            },
          },
          update: {
            masteryPercentage: clampedPct,
            evaluatedBy: "AUTO_EXAM",
            lastEvaluatedAt: new Date(),
          },
          create: {
            studentProfileId: studentUser.studentProfile.id,
            topicId: exam.topicId,
            masteryPercentage: clampedPct,
            evaluatedBy: "AUTO_EXAM",
            lastEvaluatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      attempt,
      score: scoreFrom20,
      percentage,
      taraz,
      correctCount,
      wrongCount,
      unansweredCount,
      awardedXP: 50,
      mistakesLogged,
      message: `آزمون با موفقیت پایان یافت. تراز شما: ${taraz} (درصد: ${percentage}٪). ${mistakesLogged} سوال جهت مرور به دفترچه اشتباهات اضافه شد.`,
    });
  } catch (error) {
    console.error("Exam Submit POST error:", error);
    return NextResponse.json({ error: "خطا در ثبت نهایی پاسخنامه آزمون" }, { status: 500 });
  }
}
