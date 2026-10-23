import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quizId,
      studentId,
      answers, // { [questionId: string]: string }
      timeSpentSeconds = 0,
      activeTimeSeconds = 0,
      idleTimeSeconds = 0,
    } = body;

    if (!quizId || !answers) {
      return NextResponse.json(
        { success: false, error: "شناسه کوییز و پاسخ‌های ارسالی الزامی هستند." },
        { status: 400 }
      );
    }

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      targetStudentId = defaultStudent?.id;
    }

    if (!targetStudentId) {
      return NextResponse.json(
        { success: false, error: "کاربر دانش‌آموز یافت نشد." },
        { status: 400 }
      );
    }

    // واکشی سوالات کوییز
    const quiz = await prisma.studyQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        studyPack: true,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "کوییز مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    // تصحیح و ارزیابی سوالات
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const detailedEvaluation: Record<string, any> = {};

    for (const q of quiz.questions) {
      const studentAnswer = answers[q.id];
      const isCorrect =
        studentAnswer !== undefined &&
        String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

      if (isCorrect) correctCount++;

      detailedEvaluation[q.id] = {
        questionText: q.questionText,
        studentAnswer: studentAnswer || "بدون پاسخ",
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        bloomLevel: q.bloomLevel,
      };
    }

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 20 : 0; // مقیاس نمره از ۲۰

    // ثبت رکورد تلاش کوییز در پایگاه داده
    const attempt = await prisma.studyQuizAttempt.create({
      data: {
        quizId,
        studentId: targetStudentId,
        score: Math.round(score * 10) / 10,
        maxScore: 20.0,
        percentage,
        answersJson: JSON.stringify(detailedEvaluation),
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        activeTimeSeconds: Number(activeTimeSeconds) || Number(timeSpentSeconds) || 0,
        idleTimeSeconds: Number(idleTimeSeconds) || 0,
        completedAt: new Date(),
      },
    });

    // ثبت در لاگ دورسنجی مطالعه
    await prisma.studyTelemetryLog.create({
      data: {
        studentId: targetStudentId,
        studyPackId: quiz.studyPackId,
        eventType: "quiz_attempt_completed",
        topicTag: quiz.studyPack.topicTag,
        activeDurationSeconds: Number(activeTimeSeconds) || Number(timeSpentSeconds) || 0,
        idleDurationSeconds: Number(idleTimeSeconds) || 0,
        metadataJson: JSON.stringify({
          quizId,
          attemptId: attempt.id,
          percentage,
          score: attempt.score,
          correctCount,
          totalQuestions,
        }),
      },
    });

    // اعطای پاداش گیمیفیکیشن (+۳۰ XP)
    const xpReward = Math.max(10, Math.round(percentage * 0.4)); // ۱۰ تا ۴۰ XP بر اساس درصد
    const studentUser = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: { studentProfile: true },
    });

    if (studentUser?.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          totalXP: { increment: xpReward },
        },
      });
    }

    return NextResponse.json({
      success: true,
      attempt,
      correctCount,
      totalQuestions,
      percentage,
      xpEarned: xpReward,
      evaluation: detailedEvaluation,
    });
  } catch (error: any) {
    console.error("Error submitting quiz attempt:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت نتایج آزمون", details: error?.message },
      { status: 500 }
    );
  }
}
