import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");

    let studentId = studentIdParam;
    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT", nationalId: "0022334455" },
      });
      studentId = defaultStudent?.id || "";
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            school: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        topic: {
          include: {
            textbook: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "آزمون مورد نظر یافت نشد" }, { status: 404 });
    }

    // استخراج شناسه‌های سوالات
    let questionIds: string[] = [];
    try {
      questionIds = JSON.parse(exam.questionsJson);
    } catch {
      questionIds = [];
    }

    // واکشی کامل سوالات و گزینه‌ها
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
        topic: {
          include: {
            textbook: true,
          },
        },
      },
    });

    // مرتب‌سازی سوالات بر اساس همان ترتیب درون questionsJson
    const sortedQuestions = questionIds
      .map((qid) => questions.find((q) => q.id === qid))
      .filter(Boolean);

    // واکشی سابقه شرکت دانش‌آموز در آزمون در صورت وجود
    let attempt = null;
    if (studentId) {
      attempt = await prisma.examAttempt.findFirst({
        where: {
          examId: id,
          studentId,
        },
      });
    }

    // دریافت مشخصات کامل دانش‌آموز برای واترمارک امنیتی
    let studentInfo = null;
    if (studentId) {
      const u = await prisma.user.findUnique({
        where: { id: studentId },
        include: { studentProfile: true },
      });
      if (u) {
        studentInfo = {
          id: u.id,
          fullName: u.fullName,
          nationalId: u.nationalId,
          schoolName: u.studentProfile?.schoolName || "دبیرستان علامه حلی ۱",
        };
      }
    }

    return NextResponse.json({
      exam,
      questions: sortedQuestions,
      attempt,
      studentInfo,
    });
  } catch (error) {
    console.error("Exam GET [id] error:", error);
    return NextResponse.json({ error: "خطا در واکشی اطلاعات آزمون" }, { status: 500 });
  }
}
