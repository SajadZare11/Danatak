import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const studentId = searchParams.get("studentId");

    const where: any = {};
    if (classroomId) where.classroomId = classroomId;

    const assignments = await prisma.assignment.findMany({
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
        submissions: studentId
          ? {
              where: { studentId },
            }
          : true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Assignments GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی تکالیف" }, { status: 500 });
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
      dueDate,
      maxScore,
      questionIds,
    } = body;

    if (!title || !classroomId || !teacherId || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json({ error: "اطلاعات ارسالی برای صدور تکلیف ناقص است" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        classroomId,
        teacherId,
        topicId: topicId || null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxScore: maxScore ? Number(maxScore) : 20.0,
        questionsJson: JSON.stringify(questionIds),
      },
      include: {
        classroom: true,
        topic: true,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("Assignments POST error:", error);
    return NextResponse.json({ error: "خطا در صدور تکلیف جدید" }, { status: 500 });
  }
}
