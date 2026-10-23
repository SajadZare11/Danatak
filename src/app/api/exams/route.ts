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
    } = body;

    if (!title || !classroomId || !teacherId || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: "اطلاعات ارسالی برای تعریف آزمون ناقص است" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || null,
        classroomId,
        teacherId,
        topicId: topicId || null,
        startTime: startTime ? new Date(startTime) : new Date(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        isSequential: !!isSequential,
        enableAntiCheat: enableAntiCheat !== undefined ? !!enableAntiCheat : true,
        maxTabSwitches: maxTabSwitches ? Number(maxTabSwitches) : 3,
        questionsJson: JSON.stringify(questionIds),
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
