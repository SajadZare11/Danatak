import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        classroom: true,
        topic: true,
        attempts: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                nationalId: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "آزمون یافت نشد" }, { status: 404 });
    }

    let questionIds: string[] = [];
    try {
      const parsed = JSON.parse(exam.questionsJson);
      if (Array.isArray(parsed)) {
        questionIds = parsed;
      } else if (parsed && typeof parsed === "object") {
        questionIds = parsed.questionIds || [];
      }
    } catch {
      questionIds = [];
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    const attempts = exam.attempts;
    const totalAttempts = attempts.length;

    // میانگین درصد، نمره و تراز
    let avgPercentage = 0;
    let avgScore = 0;
    let avgTaraz = 5000;
    let maxPercentage = 0;
    let minPercentage = 100;

    if (totalAttempts > 0) {
      const sumPct = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
      const sumScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
      const sumTaraz = attempts.reduce((acc, a) => acc + (a.taraz || 5000), 0);

      avgPercentage = Number((sumPct / totalAttempts).toFixed(1));
      avgScore = Number((sumScore / totalAttempts).toFixed(1));
      avgTaraz = Math.round(sumTaraz / totalAttempts);

      maxPercentage = Math.max(...attempts.map((a) => a.percentage || 0));
      minPercentage = Math.min(...attempts.map((a) => a.percentage || 0));
    }

    // تحلیل سوالات و گزینه‌های دامدار (Trap Options Analysis)
    const questionAnalysis = questions.map((q) => {
      let correctPicks = 0;
      let wrongPicks = 0;
      const optionPicks: Record<string, number> = {};

      attempts.forEach((att) => {
        if (!att.answersJson) return;
        try {
          const ans = JSON.parse(att.answersJson);
          const pick = ans[q.id];
          if (pick) {
            optionPicks[pick] = (optionPicks[pick] || 0) + 1;
            const correctOpt = q.options.find((o) => o.isCorrect);
            if (pick === correctOpt?.id || pick === String(correctOpt?.orderIndex)) {
              correctPicks++;
            } else {
              wrongPicks++;
            }
          }
        } catch {}
      });

      // شناسایی گزینه با بیشترین دام (بیشترین انتخاب غلط)
      let trapOption = null;
      let highestWrongCount = 0;

      q.options.forEach((opt) => {
        if (!opt.isCorrect) {
          const count = (optionPicks[opt.id] || 0) + (optionPicks[String(opt.orderIndex)] || 0);
          if (count > highestWrongCount) {
            highestWrongCount = count;
            trapOption = {
              orderIndex: opt.orderIndex,
              text: opt.optionText,
              count,
            };
          }
        }
      });

      const totalResponses = correctPicks + wrongPicks;
      const successRate = totalResponses > 0 ? Math.round((correctPicks / totalResponses) * 100) : 50;

      return {
        id: q.id,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        successRate,
        trapOption,
      };
    });

    // لیست گزارش امنیتی (Anti-Cheat Security Audit Logs)
    const securityLogs = attempts
      .filter((a) => a.tabSwitchCount > 0 || a.warningLogsJson)
      .map((a) => {
        let logs = [];
        try {
          logs = a.warningLogsJson ? JSON.parse(a.warningLogsJson) : [];
        } catch {}
        return {
          studentName: a.student.fullName,
          nationalId: a.student.nationalId,
          tabSwitchCount: a.tabSwitchCount,
          logs,
        };
      });

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        classroomName: exam.classroom.name,
        topicTitle: exam.topic?.title || "حسابان و ریاضی ۳",
      },
      stats: {
        totalAttempts,
        avgPercentage,
        avgScore,
        avgTaraz,
        maxPercentage,
        minPercentage,
      },
      questionAnalysis,
      securityLogs,
    });
  } catch (error) {
    console.error("Exam Analytics GET error:", error);
    return NextResponse.json({ error: "خطا در استخراج تحلیل آماری آزمون" }, { status: 500 });
  }
}
