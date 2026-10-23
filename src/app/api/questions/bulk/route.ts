import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questions, defaultTopicId, authorId } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "لیست سوالات نامعتبر یا خالی است" }, { status: 400 });
    }

    const createdQuestions = [];

    for (const q of questions) {
      const topicId = q.topicId || defaultTopicId;
      if (!topicId || !q.content) continue;

      const created = await prisma.question.create({
        data: {
          topicId,
          authorId: authorId || null,
          content: q.content,
          type: q.type || "MULTIPLE_CHOICE",
          difficulty: q.difficulty || "MEDIUM",
          isPublic: q.isPublic !== undefined ? Boolean(q.isPublic) : true,
          explanation: q.explanation || null,
          tags: q.tags || "ورود گروهی",
          options:
            q.options && Array.isArray(q.options) && q.options.length > 0
              ? {
                  create: q.options.map((opt: any, index: number) => ({
                    optionText: opt.optionText || opt.text,
                    orderIndex: opt.orderIndex || index + 1,
                    isCorrect: Boolean(opt.isCorrect),
                  })),
                }
              : undefined,
        },
      });
      createdQuestions.push(created);
    }

    return NextResponse.json({
      success: true,
      count: createdQuestions.length,
      message: `${createdQuestions.length} سوال با موفقیت وارد بانک سوالات شد.`,
    });
  } catch (error) {
    console.error("Bulk questions POST error:", error);
    return NextResponse.json({ error: "خطا در ورود گروهی سوالات" }, { status: 500 });
  }
}
