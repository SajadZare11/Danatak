import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const quizzes = await prisma.liveSessionQuiz.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    const parsedQuizzes = quizzes.map((q) => {
      let options: string[] = [];
      let responses: any[] = [];
      try {
        options = JSON.parse(q.optionsJson);
      } catch (e) {
        options = [];
      }
      try {
        responses = q.responsesJson ? JSON.parse(q.responsesJson) : [];
      } catch (e) {
        responses = [];
      }

      // توزیع آمار پاسخ‌ها
      const totalResponses = responses.length;
      const distribution: Record<string, number> = {};
      options.forEach((opt, idx) => {
        distribution[idx.toString()] = 0;
      });

      responses.forEach((r) => {
        const choice = r.selectedOption?.toString();
        if (distribution[choice] !== undefined) {
          distribution[choice]++;
        }
      });

      // پاسخ داده شده توسط این دانش‌آموز (در صورت وجود)
      const myResponse = studentId
        ? responses.find((r) => r.studentId === studentId)
        : null;

      // اگر دانش‌آموز است و کوییز هنوز فعال است، جواب درست مخفی می‌ماند
      const shouldHideCorrectAnswer = Boolean(studentId && q.status === "ACTIVE");

      return {
        id: q.id,
        sessionId: q.sessionId,
        questionText: q.questionText,
        options,
        correctAnswer: shouldHideCorrectAnswer ? null : q.correctAnswer,
        timeLimitSeconds: q.timeLimitSeconds,
        status: q.status,
        totalResponses,
        distribution,
        myResponse: myResponse || null,
        createdAt: q.createdAt,
      };
    });

    // پیدا کردن کوییز فعال جاری (در صورت وجود)
    const activeQuiz = parsedQuizzes.find((q) => q.status === "ACTIVE") || null;

    return NextResponse.json({
      success: true,
      quizzes: parsedQuizzes,
      activeQuiz,
    });
  } catch (error: any) {
    console.error("Error fetching live session quizzes:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت کوییزهای جلسه کلاس", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { action, questionText, options, correctAnswer, timeLimitSeconds = 60, quizId, studentId, selectedOption } = body;

    // ۱. طرح کوییز کلاسی جدید توسط دبیر (Launch Quiz)
    if (action === "create_quiz") {
      if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { success: false, error: "متن سوال و حداقل ۲ گزینه الزامی است." },
          { status: 400 }
        );
      }

      // بستن تمام کوییزهای فعال قبلی این جلسه
      await prisma.liveSessionQuiz.updateMany({
        where: { sessionId, status: "ACTIVE" },
        data: { status: "CLOSED" },
      });

      const newQuiz = await prisma.liveSessionQuiz.create({
        data: {
          sessionId,
          questionText: questionText.trim(),
          optionsJson: JSON.stringify(options),
          correctAnswer: correctAnswer?.toString() ?? "0",
          timeLimitSeconds: Number(timeLimitSeconds) || 60,
          status: "ACTIVE",
          responsesJson: JSON.stringify([]),
        },
      });

      return NextResponse.json({
        success: true,
        message: "کوییز کلاسی با موفقیت برای تمامی دانش‌آموزان فعال شد ⚡",
        quiz: newQuiz,
      });
    }

    // ۲. ارسال پاسخ توسط دانش‌آموز (Submit Response)
    if (action === "submit_response") {
      if (!quizId || !studentId || selectedOption === undefined) {
        return NextResponse.json(
          { success: false, error: "اطلاعات ارسال پاسخ ناقص است." },
          { status: 400 }
        );
      }

      const quiz = await prisma.liveSessionQuiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz || quiz.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: "این کوییز بسته شده یا وجود ندارد." },
          { status: 400 }
        );
      }

      let responses: any[] = [];
      try {
        responses = quiz.responsesJson ? JSON.parse(quiz.responsesJson) : [];
      } catch (e) {
        responses = [];
      }

      // اگر قبلاً پاسخ داده، جایگزین نکن یا ثبت مجدد نکن
      const existingIdx = responses.findIndex((r) => r.studentId === studentId);
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { fullName: true },
      });

      const responseObj = {
        studentId,
        studentName: student?.fullName || "دانش‌آموز",
        selectedOption: selectedOption.toString(),
        submittedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        responses[existingIdx] = responseObj;
      } else {
        responses.push(responseObj);
      }

      const updatedQuiz = await prisma.liveSessionQuiz.update({
        where: { id: quizId },
        data: {
          responsesJson: JSON.stringify(responses),
        },
      });

      return NextResponse.json({
        success: true,
        message: "پاسخ شما با موفقیت ثبت شد ✅",
        totalResponses: responses.length,
      });
    }

    // ۳. بستن کوییز توسط دبیر (Close Quiz)
    if (action === "close_quiz") {
      if (!quizId) {
        return NextResponse.json(
          { success: false, error: "شناسه کوییز الزامی است." },
          { status: 400 }
        );
      }

      const closed = await prisma.liveSessionQuiz.update({
        where: { id: quizId },
        data: { status: "CLOSED" },
      });

      return NextResponse.json({
        success: true,
        message: "کوییز بسته شد و نتایج نهایی نمایان شد.",
        quiz: closed,
      });
    }

    return NextResponse.json(
      { success: false, error: "اکشن نامعتبر است." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error managing live session quiz:", error);
    return NextResponse.json(
      { success: false, error: "خطا در مدیریت کوییز کلاس آنلاین", details: error?.message },
      { status: 500 }
    );
  }
}
