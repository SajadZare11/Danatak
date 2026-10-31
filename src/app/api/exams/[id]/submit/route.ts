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
      sessionId,
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
    let antiCheatSettings: any = null;
    try {
      const parsed = JSON.parse(exam.questionsJson);
      if (Array.isArray(parsed)) {
        questionIds = parsed;
      } else if (parsed && typeof parsed === "object") {
        questionIds = parsed.questionIds || [];
        antiCheatSettings = parsed.antiCheatSettings || null;
      }
    } catch {
      questionIds = [];
    }

    const isNegativeMarking = antiCheatSettings ? antiCheatSettings.negativeMarking !== false : true;

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true, topic: true },
    });

    // تابع نرمال‌سازی متن برای مقایسه هوشمند سوالات جای‌خالی
    const normalizeAnswer = (str: string) => {
      if (!str) return "";
      return str
        .trim()
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\.\,\،\-\_\:\;\(\)]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
    };

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let pendingDescriptiveCount = 0;

    const questionResults: Record<string, any> = {};

    questions.forEach((q) => {
      const chosen = answers[q.id];
      const isBlank = !chosen || (typeof chosen === "string" && chosen.trim() === "");

      if (q.type === "DESCRIPTIVE") {
        if (!isBlank) {
          pendingDescriptiveCount++;
          questionResults[q.id] = {
            type: "DESCRIPTIVE",
            studentAnswer: chosen,
            status: "PENDING_TEACHER_REVIEW",
            explanation: q.explanation || "",
          };
        } else {
          unansweredCount++;
          questionResults[q.id] = {
            type: "DESCRIPTIVE",
            studentAnswer: "",
            status: "UNANSWERED",
            explanation: q.explanation || "",
          };
        }
        return;
      }

      if (isBlank) {
        unansweredCount++;
        questionResults[q.id] = {
          type: q.type,
          studentAnswer: "",
          isCorrect: false,
          status: "UNANSWERED",
        };
        return;
      }

      if (q.type === "FILL_BLANK") {
        const correctOpt = q.options.find((o) => o.isCorrect);
        const expected = correctOpt?.optionText || q.explanation || "";
        const normChosen = normalizeAnswer(String(chosen));
        const normExpected = normalizeAnswer(expected);

        const isMatch = normChosen !== "" && (normChosen === normExpected || normExpected.includes(normChosen));
        if (isMatch) {
          correctCount++;
          questionResults[q.id] = {
            type: "FILL_BLANK",
            studentAnswer: chosen,
            expectedAnswer: expected,
            isCorrect: true,
            status: "CORRECT",
            explanation: q.explanation || "",
          };
        } else {
          wrongCount++;
          questionResults[q.id] = {
            type: "FILL_BLANK",
            studentAnswer: chosen,
            expectedAnswer: expected,
            isCorrect: false,
            status: "WRONG",
            explanation: q.explanation || "",
          };
        }
        return;
      }

      // MULTIPLE_CHOICE و TRUE_FALSE
      const correctOpt = q.options.find((o) => o.isCorrect);
      let isCorrect = false;

      if (correctOpt) {
        if (chosen === correctOpt.id || chosen === String(correctOpt.orderIndex)) {
          isCorrect = true;
        } else if (
          q.type === "TRUE_FALSE" &&
          (chosen === correctOpt.optionText ||
            (chosen === "true" && correctOpt.orderIndex === 1) ||
            (chosen === "false" && correctOpt.orderIndex === 2))
        ) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount++;
        questionResults[q.id] = {
          type: q.type,
          studentAnswer: chosen,
          correctOptionId: correctOpt?.id,
          isCorrect: true,
          status: "CORRECT",
          explanation: q.explanation || "",
        };
      } else {
        wrongCount++;
        questionResults[q.id] = {
          type: q.type,
          studentAnswer: chosen,
          correctOptionId: correctOpt?.id,
          isCorrect: false,
          status: "WRONG",
          explanation: q.explanation || "",
        };
      }
    });

    const autoGradableQuestions = questions.filter((q) => q.type !== "DESCRIPTIVE");
    const autoGradableCount = autoGradableQuestions.length || 1;

    let percentage = 0;
    if (autoGradableQuestions.length > 0) {
      if (isNegativeMarking) {
        const raw = ((3 * correctCount - wrongCount) / (3 * autoGradableCount)) * 100;
        percentage = Number(Math.max(0, Math.min(100, raw)).toFixed(2));
      } else {
        const raw = (correctCount / autoGradableCount) * 100;
        percentage = Number(Math.max(0, Math.min(100, raw)).toFixed(2));
      }
    }

    // نمره از ۲۰ برای بخش تستی و خودکار
    const scoreFrom20 = Number(Math.max(0, percentage * 0.2).toFixed(2));

    // محاسبه تراز استاندارد کنکوری
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

    // انتقال خودکار سوالات غلط تستی/جای‌خالی به دفترچه اشتباهات هوشمند (به جز تشریحی‌های در انتظار تصحیح)
    let mistakesLogged = 0;
    for (const q of questions) {
      if (q.type === "DESCRIPTIVE") continue; // سوالات تشریحی نیاز به بازبینی دبیر دارند

      const qResult = questionResults[q.id];
      const isCorrect = qResult?.isCorrect === true;

      if (!isCorrect) {
        const chosen = answers[q.id];
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

    // پاکسازی نشست فعال آزمون در صورت وجود
    const globalSessions = globalThis as unknown as {
      _examActiveSessions?: Map<string, any>;
    };
    if (globalSessions._examActiveSessions) {
      globalSessions._examActiveSessions.delete(`${examId}:${studentId}`);
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
      pendingDescriptiveCount,
      hasDescriptive: pendingDescriptiveCount > 0,
      questionResults,
      awardedXP: 50,
      mistakesLogged,
      message: pendingDescriptiveCount > 0
        ? `آزمون پایان یافت. سوالات تستی و محاسباتی با تراز ${taraz} تصحیح شدند. ${pendingDescriptiveCount} سوال تشریحی به کارتابل دبیر محترم ارسال گردید.`
        : `آزمون با موفقیت پایان یافت. تراز شما: ${taraz} (درصد: ${percentage}٪). ${mistakesLogged} سوال جهت مرور به دفترچه اشتباهات اضافه شد.`,
    });
  } catch (error) {
    console.error("Exam Submit POST error:", error);
    return NextResponse.json({ error: "خطا در ثبت نهایی پاسخنامه آزمون" }, { status: 500 });
  }
}
