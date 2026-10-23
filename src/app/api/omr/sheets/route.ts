import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const examId = searchParams.get("examId");
    const sheetTemplate = searchParams.get("sheetTemplate");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (examId) where.examId = examId;
    if (sheetTemplate) where.sheetTemplate = sheetTemplate;

    const sheets = await prisma.oMRAnswerSheet.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            avatarUrl: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      sheets,
      count: sheets.length,
    });
  } catch (error: any) {
    console.error("Error fetching OMR sheets:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست پاسخ‌برگ‌های تصحیح‌شده", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      examId,
      sheetTemplate = "30_QUESTIONS",
      totalQuestions = 30,
      answerKey = [],
      studentAnswers = [],
      scannedImageUrl,
      diagnostic,
    } = body;

    let finalStudentId = studentId;
    if (!finalStudentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT" },
      });
      finalStudentId = defaultStudent?.id;
    }

    if (!finalStudentId) {
      return NextResponse.json(
        { success: false, error: "شناسه دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const tQuestions = Number(totalQuestions) || answerKey.length || 30;

    // ۱. محاسبه آمار و درصد با نمره منفی استاندارد کنکور: (3R - W) / 3T * 100
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    for (let i = 0; i < tQuestions; i++) {
      const sAns = studentAnswers[i];
      const kAns = answerKey[i];

      if (sAns === null || sAns === undefined || sAns === "") {
        unattemptedCount++;
      } else if (sAns?.toString() === kAns?.toString()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    // درصد خام نهایی (می‌تواند منفی شود، تا یک رقم اعشار)
    const rawScore = 3 * correctCount - wrongCount;
    const maxScore = 3 * tQuestions;
    const rawPercentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 1000) / 10 : 0.0;

    // ۲. محاسبه تراز آماری استاندارد کنکور و قلم‌چی (میانگین ۵۰۰۰)
    // فرمول تراز تقریبی: 5000 + (درصد * 35) با کف ۲۵۰۰ و سقف ۹۰۰۰
    const calculatedTScore = Math.max(2500, Math.min(9000, Math.round(5000 + rawPercentage * 35)));

    // ۳. ایجاد یا ذخیره پاسخ‌برگ در پایگاه‌داده
    const sheet = await prisma.oMRAnswerSheet.create({
      data: {
        studentId: finalStudentId,
        examId: examId || null,
        sheetTemplate,
        totalQuestions: tQuestions,
        answerKeyJson: JSON.stringify(answerKey),
        studentAnswersJson: JSON.stringify(studentAnswers),
        rawPercentage,
        correctCount,
        wrongCount,
        unattemptedCount,
        tScore: calculatedTScore,
        scannedImageUrl: scannedImageUrl || null,
        diagnosticJson: diagnostic ? JSON.stringify(diagnostic) : null,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "پاسخ‌برگ با موفقیت تصحیح شد و نمرات ثبت گردید ✅",
      sheet,
      summary: {
        totalQuestions: tQuestions,
        correctCount,
        wrongCount,
        unattemptedCount,
        rawPercentage,
        tScore: calculatedTScore,
      },
    });
  } catch (error: any) {
    console.error("Error creating OMR answer sheet:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت و تصحیح پاسخ‌برگ OMR", details: error?.message },
      { status: 500 }
    );
  }
}
