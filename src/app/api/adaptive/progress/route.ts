import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdaptiveCourseStructure } from "@/lib/adaptive/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studyPackId = searchParams.get("studyPackId");
    const studentId = searchParams.get("studentId");

    if (!studyPackId || !studentId) {
      return NextResponse.json(
        { success: false, error: "شناسه بسته و دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const pack = await prisma.studyPack.findUnique({
      where: { id: studyPackId },
      select: { id: true, title: true, topicTag: true, gradeLevel: true, nodesJson: true },
    });

    if (!pack || !pack.nodesJson) {
      return NextResponse.json(
        { success: false, error: "بسته یادگیری یافت نشد." },
        { status: 404 }
      );
    }

    const courseStructure = JSON.parse(pack.nodesJson) as AdaptiveCourseStructure;

    const progresses = await prisma.studentLearningNodeProgress.findMany({
      where: { studyPackId, studentId },
    });

    return NextResponse.json({
      success: true,
      courseStructure,
      progresses,
    });
  } catch (error: any) {
    console.error("Adaptive progress GET error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت وضعیت مراحل", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studyPackId,
      studentId,
      nodeId,
      score,
      heartsLeft = 3,
      streakCount = 0,
      starsEarned = 1,
      isCompleted = true,
    } = body;

    if (!studyPackId || !studentId || !nodeId) {
      return NextResponse.json(
        { success: false, error: "اطلاعات ارسالی ناقص است." },
        { status: 400 }
      );
    }

    // ۱. ثبت پیشرفت نود فعلی
    const currentProgress = await prisma.studentLearningNodeProgress.upsert({
      where: {
        studentId_studyPackId_nodeId: {
          studentId,
          studyPackId,
          nodeId,
        },
      },
      create: {
        studentId,
        studyPackId,
        nodeId,
        isCompleted,
        isUnlocked: true,
        bestScore: score,
        starsEarned,
        heartsLeft,
        streakCount,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        isCompleted: isCompleted || undefined,
        bestScore: Math.max(score, 0),
        starsEarned: Math.max(starsEarned, 0),
        heartsLeft,
        streakCount,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    // ۲. در صورت قبولی در مرحله، قفل مرحله بعدی باز می‌شود
    let nextNodeUnlockedId: string | null = null;
    if (isCompleted) {
      const pack = await prisma.studyPack.findUnique({
        where: { id: studyPackId },
        select: { nodesJson: true },
      });

      if (pack?.nodesJson) {
        const course = JSON.parse(pack.nodesJson) as AdaptiveCourseStructure;
        const allNodes = [...course.nodes, course.bossFight];
        const currentIndex = allNodes.findIndex((n) => n.id === nodeId);

        if (currentIndex !== -1 && currentIndex + 1 < allNodes.length) {
          const nextNode = allNodes[currentIndex + 1];
          nextNodeUnlockedId = nextNode.id;

          await prisma.studentLearningNodeProgress.upsert({
            where: {
              studentId_studyPackId_nodeId: {
                studentId,
                studyPackId,
                nodeId: nextNode.id,
              },
            },
            create: {
              studentId,
              studyPackId,
              nodeId: nextNode.id,
              isCompleted: false,
              isUnlocked: true,
              bestScore: 0,
              starsEarned: 0,
              heartsLeft: 3,
            },
            update: {
              isUnlocked: true,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      currentProgress,
      nextNodeUnlockedId,
    });
  } catch (error: any) {
    console.error("Adaptive progress POST error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت نمره مرحله", details: error?.message },
      { status: 500 }
    );
  }
}
