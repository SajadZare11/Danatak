import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const studentId = searchParams.get("studentId");

    const where: any = {};
    if (classroomId) where.classroomId = classroomId;

    const exams = await prisma.exam.findMany({
      where,
      include: {
        classroom: true,
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
        attempts: studentId
          ? {
              where: { studentId },
            }
          : true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Exams GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی آزمون‌ها" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      classroomId,
      teacherId,
      topicId,
      startTime,
      durationMinutes,
      isSequential,
      enableAntiCheat,
      maxTabSwitches,
      questionIds,
      antiCheatSettings,
      newQuestions,
    } = body;

    let finalQuestionIds = Array.isArray(questionIds) ? [...questionIds] : [];

    // ایجاد و ذخیره خودکار سوالات جدید طراحی شده در آزمون در بانک سوالات
    if (newQuestions && Array.isArray(newQuestions) && newQuestions.length > 0) {
      let fallbackTopicId = topicId;
      if (!fallbackTopicId) {
        const firstTopic = await prisma.topic.findFirst();
        fallbackTopicId = firstTopic?.id || null;
      }

      for (const q of newQuestions) {
        if (!q.content) continue;
        const resolvedTopicId = q.topicId || fallbackTopicId;
        if (!resolvedTopicId) continue;

        const createdQ = await prisma.question.create({
          data: {
            topicId: resolvedTopicId,
            authorId: teacherId || null,
            content: q.content,
            type: q.type || "MULTIPLE_CHOICE",
            difficulty: q.difficulty || "MEDIUM",
            isPublic: true,
            explanation: q.explanation || null,
            tags: q.tags || "طراحی آزمون",
            options:
              q.options && Array.isArray(q.options) && q.options.length > 0
                ? {
                    create: q.options.map((opt: any, index: number) => ({
                      optionText: opt.optionText || opt.text || `گزینه ${index + 1}`,
                      orderIndex: opt.orderIndex || index + 1,
                      isCorrect: Boolean(opt.isCorrect),
                    })),
                  }
                : undefined,
          },
        });
        finalQuestionIds.push(createdQ.id);
      }
    }

    if (!title || !classroomId || !teacherId || finalQuestionIds.length === 0) {
      return NextResponse.json(
        { error: "اطلاعات ارسالی برای تعریف آزمون ناقص است یا هیچ سوالی انتخاب/طراحی نشده است" },
        { status: 400 }
      );
    }

    const finalAntiCheat = antiCheatSettings || {
      enableFullscreen: enableAntiCheat !== undefined ? !!enableAntiCheat : true,
      detectTabSwitch: enableAntiCheat !== undefined ? !!enableAntiCheat : true,
      maxTabSwitches: maxTabSwitches ? Number(maxTabSwitches) : 3,
      disableCopyPaste: true,
      enableWatermark: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      isSequential: !!isSequential,
      negativeMarking: true,
    };

    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || null,
        classroomId,
        teacherId,
        topicId: topicId || null,
        startTime: startTime ? new Date(startTime) : new Date(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        isSequential: finalAntiCheat.isSequential ?? !!isSequential,
        enableAntiCheat: enableAntiCheat !== undefined ? !!enableAntiCheat : true,
        maxTabSwitches: finalAntiCheat.maxTabSwitches || (maxTabSwitches ? Number(maxTabSwitches) : 3),
        questionsJson: JSON.stringify({
          questionIds: finalQuestionIds,
          antiCheatSettings: finalAntiCheat,
        }),
      },
      include: {
        classroom: true,
        topic: true,
      },
    });

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error("Exams POST error:", error);
    return NextResponse.json({ error: "خطا در ایجاد آزمون آنلاین جدید" }, { status: 500 });
  }
}
