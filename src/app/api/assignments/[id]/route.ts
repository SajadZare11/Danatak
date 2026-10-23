import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const assignment = await prisma.assignment.findUnique({
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

    if (!assignment) {
      return NextResponse.json({ error: "تکلیف مورد نظر یافت نشد" }, { status: 404 });
    }

    // استخراج شناسه‌های سوالات
    let questionIds: string[] = [];
    try {
      questionIds = JSON.parse(assignment.questionsJson);
    } catch {
      questionIds = [];
    }

    // واکشی کامل آبجکت‌های سوالات همراه با گزینه‌ها
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

    // واکشی پاسخ‌های ارسال‌شده قبلی دانش‌آموز در صورت وجود
    let submission = null;
    if (studentId) {
      submission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: id,
          studentId,
        },
      });
    }

    return NextResponse.json({
      assignment,
      questions: sortedQuestions,
      submission,
    });
  } catch (error) {
    console.error("Assignment GET [id] error:", error);
    return NextResponse.json({ error: "خطا در واکشی جزئیات تکلیف" }, { status: 500 });
  }
}
