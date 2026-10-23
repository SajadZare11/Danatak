import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get("gradeLevel");
    const subjectId = searchParams.get("subjectId");
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");
    const source = searchParams.get("source"); // "my", "central", "all"
    const authorId = searchParams.get("authorId");
    const query = searchParams.get("q");

    // شرایط فیلتر
    const where: any = {};

    if (difficulty && difficulty !== "ALL") {
      where.difficulty = difficulty;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (topicId && topicId !== "ALL") {
      where.topicId = topicId;
    } else if (gradeLevel && gradeLevel !== "ALL") {
      where.topic = {
        textbook: {
          gradeLevel: Number(gradeLevel),
        },
      };
    }

    if (source === "my" && authorId) {
      where.authorId = authorId;
    } else if (source === "central") {
      where.authorId = null;
    }

    if (query && query.trim() !== "") {
      where.OR = [
        { content: { contains: query.trim() } },
        { explanation: { contains: query.trim() } },
        { tags: { contains: query.trim() } },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        topic: {
          include: {
            textbook: {
              include: {
                subject: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        options: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // لیست مباحث و کتاب‌ها برای فیلتر
    const textbooks = await prisma.textbook.findMany({
      include: {
        topics: {
          where: { parentId: null },
          include: {
            subTopics: true,
          },
        },
      },
    });

    return NextResponse.json({
      questions,
      textbooks,
      totalCount: questions.length,
    });
  } catch (error) {
    console.error("Questions GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی سوالات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topicId,
      authorId,
      content,
      type,
      difficulty,
      isPublic,
      explanation,
      tags,
      options,
    } = body;

    if (!topicId || !content) {
      return NextResponse.json({ error: "مبحث و صورت سوال الزامی هستند" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        topicId,
        authorId: authorId || null,
        content,
        type: type || "MULTIPLE_CHOICE",
        difficulty: difficulty || "MEDIUM",
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        explanation: explanation || null,
        tags: tags || "تالیفی",
        options:
          options && Array.isArray(options) && options.length > 0
            ? {
                create: options.map((opt: any, index: number) => ({
                  optionText: opt.optionText || opt.text,
                  orderIndex: opt.orderIndex || index + 1,
                  isCorrect: Boolean(opt.isCorrect),
                })),
              }
            : undefined,
      },
      include: {
        options: true,
        topic: {
          include: {
            textbook: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error("Question POST error:", error);
    return NextResponse.json({ error: "خطا در ثبت سوال جدید" }, { status: 500 });
  }
}
