import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");
    const topicTag = searchParams.get("topicTag");

    const where: any = {};
    if (creatorId) where.creatorId = creatorId;
    if (topicTag) where.topicTag = { contains: topicTag };

    const packs = await prisma.studyPack.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
        _count: {
          select: {
            flashcards: true,
            quizzes: true,
            telemetryLogs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: packs,
    });
  } catch (error: any) {
    console.error("Error fetching study packs:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست بسته‌های مطالعه" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      creatorId,
      sourceType,
      rawContent,
      summary,
      mindMap,
      topicTag,
      gradeLevel,
      subjectId,
      isPublic,
      flashcards,
      quiz,
      studentId,
    } = body;

    if (!title || !flashcards || !quiz) {
      return NextResponse.json(
        { success: false, error: "عنوان، فلش‌کارت‌ها و کوییز الزامی هستند." },
        { status: 400 }
      );
    }

    // تعیین کاربر سازنده پیش‌فرض در صورت عدم ارسال
    let finalCreatorId = creatorId;
    if (!finalCreatorId) {
      const defaultUser = await prisma.user.findFirst();
      finalCreatorId = defaultUser?.id;
    }

    if (!finalCreatorId) {
      return NextResponse.json(
        { success: false, error: "کاربر سازنده یافت نشد." },
        { status: 400 }
      );
    }

    // ذخیره بسته مطالعه و تمامی کارت‌ها و کوییز در یک تراکنش
    const createdPack = await prisma.studyPack.create({
      data: {
        title,
        description: description || "بسته مطالعه هوشمند",
        creatorId: finalCreatorId,
        sourceType: sourceType || "TEXT",
        rawContent: rawContent || null,
        summaryJson: JSON.stringify(summary || {}),
        mindMapJson: JSON.stringify(mindMap || {}),
        topicTag: topicTag || "مفاهیم تحلیلی",
        gradeLevel: Number(gradeLevel) || 12,
        subjectId: subjectId || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        flashcards: {
          create: flashcards.map((f: any, idx: number) => ({
            front: f.front,
            back: f.back,
            hint: f.hint || null,
            topicTag: f.topicTag || topicTag || "عمومی",
            difficulty: f.difficulty || "MEDIUM",
            orderIndex: idx + 1,
          })),
        },
        quizzes: {
          create: {
            title: quiz.title || "کوییز تسلط",
            description: quiz.description || null,
            timeLimitMinutes: quiz.timeLimitMinutes || 10,
            questions: {
              create: (quiz.questions || []).map((q: any, idx: number) => ({
                questionText: q.questionText,
                type: q.type || "MULTIPLE_CHOICE",
                optionsJson: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || "تحلیل آموزشی سوال",
                bloomLevel: q.bloomLevel || "APPLY",
                topicTag: q.topicTag || topicTag || "عمومی",
                orderIndex: idx + 1,
              })),
            },
          },
        },
      },
      include: {
        flashcards: true,
        quizzes: {
          include: {
            questions: true,
          },
        },
      },
    });

    // اگر دانش‌آموزی مشخص شده باشد، رکوردهای اولیه SM-2 به صورت خودکار برای او ایجاد می‌شوند
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      targetStudentId = defaultStudent?.id;
    }

    if (targetStudentId && createdPack.flashcards.length > 0) {
      await Promise.all(
        createdPack.flashcards.map((card) =>
          prisma.studentCardProgress.create({
            data: {
              studentId: targetStudentId,
              flashcardId: card.id,
              easinessFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewDate: new Date(), // آماده برای مرور بلافاصله
            },
          })
        )
      );

      // ثبت رویداد ساخت در لاگ دورسنجی
      await prisma.studyTelemetryLog.create({
        data: {
          studentId: targetStudentId,
          studyPackId: createdPack.id,
          eventType: "study_pack_created",
          topicTag: createdPack.topicTag,
          metadataJson: JSON.stringify({
            cardCount: createdPack.flashcards.length,
            quizQuestionCount: createdPack.quizzes[0]?.questions.length || 0,
            sourceType: createdPack.sourceType,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      packId: createdPack.id,
      pack: createdPack,
    });
  } catch (error: any) {
    console.error("Error creating study pack:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ذخیره بسته مطالعه", details: error?.message },
      { status: 500 }
    );
  }
}
