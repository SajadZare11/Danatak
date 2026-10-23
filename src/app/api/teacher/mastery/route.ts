import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentProfileId, topicId, masteryPercentage, bulkStudentIds } = body;

    if (bulkStudentIds && Array.isArray(bulkStudentIds) && topicId) {
      // عملیات گروهی (Bulk Action) برای کل کلاس یا گروهی از دانش‌آموزان
      for (const spId of bulkStudentIds) {
        await prisma.topicMastery.upsert({
          where: {
            studentProfileId_topicId: {
              studentProfileId: spId,
              topicId: topicId,
            },
          },
          update: {
            masteryPercentage: Number(masteryPercentage),
            lastEvaluatedAt: new Date(),
            evaluatedBy: "TEACHER_BULK",
          },
          create: {
            studentProfileId: spId,
            topicId: topicId,
            masteryPercentage: Number(masteryPercentage),
            evaluatedBy: "TEACHER_BULK",
          },
        });
      }

      return NextResponse.json({ success: true, message: "درصد تسلط کل کلاس با موفقیت ثبت شد" });
    }

    if (!studentProfileId || !topicId || masteryPercentage === undefined) {
      return NextResponse.json({ error: "اطلاعات ارسالی ناقص است" }, { status: 400 });
    }

    // ثبت یا به‌روزرسانی درصد یادگیری برای دانش‌آموز تکی
    const updated = await prisma.topicMastery.upsert({
      where: {
        studentProfileId_topicId: {
          studentProfileId,
          topicId,
        },
      },
      update: {
        masteryPercentage: Number(masteryPercentage),
        lastEvaluatedAt: new Date(),
        evaluatedBy: "TEACHER",
      },
      create: {
        studentProfileId,
        topicId,
        masteryPercentage: Number(masteryPercentage),
        evaluatedBy: "TEACHER",
      },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error("Mastery update error:", error);
    return NextResponse.json({ error: "خطا در ثبت درصد یادگیری" }, { status: 500 });
  }
}
