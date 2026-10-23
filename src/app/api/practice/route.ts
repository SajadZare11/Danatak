import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

    const where: any = {
      type: "MULTIPLE_CHOICE",
    };

    if (topicId && topicId !== "ALL") {
      where.topicId = topicId;
    }

    const questions = await prisma.question.findMany({
      where,
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
      take: 10,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Practice GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی سوالات تمرین تعاملی" }, { status: 500 });
  }
}
