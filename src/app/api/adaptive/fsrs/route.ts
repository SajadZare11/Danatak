import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FSRSEngine } from "@/lib/adaptive/fsrsEngine";
import { FSRSCardData, FSRSRating } from "@/lib/adaptive/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const studyPackId = searchParams.get("studyPackId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "شناسه دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const where: any = { studentId };
    if (studyPackId) where.studyPackId = studyPackId;

    const dbItems = await prisma.studentFSRSProgress.findMany({
      where,
      orderBy: { nextReviewDate: "asc" },
      include: {
        studyPack: {
          select: { id: true, title: true, topicTag: true },
        },
      },
    });

    const now = new Date();
    const formattedCards: FSRSCardData[] = dbItems.map((item) => ({
      itemId: item.itemId,
      conceptKey: item.conceptKey,
      stability: item.stability,
      difficulty: item.difficulty,
      reps: item.reps,
      lapses: item.lapses,
      state: item.state as any,
      lastReviewedAt: item.lastReviewedAt ? item.lastReviewedAt.toISOString() : null,
      nextReviewDate: item.nextReviewDate.toISOString(),
      lastRating: item.lastRating as any,
    }));

    const deckAnalysis = FSRSEngine.analyzeDeck(formattedCards, now);

    // تولید نمونه منحنی فراموشی برای اولین کارت سررسید یا کارت پیش‌فرض
    const sampleCard = formattedCards[0] || {
      itemId: "sample",
      conceptKey: "مفهوم پایه",
      stability: 2.4,
      difficulty: 5.0,
      reps: 2,
      lapses: 0,
      state: "REVIEW",
      nextReviewDate: now.toISOString(),
      lastReviewedAt: now.toISOString(),
    };

    const forgettingCurve = FSRSEngine.generateForgettingCurve(sampleCard, 14);

    return NextResponse.json({
      success: true,
      analysis: deckAnalysis,
      forgettingCurve,
      cards: dbItems,
    });
  } catch (error: any) {
    console.error("FSRS GET error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت کارت‌های FSRS", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, itemId, rating, studyPackId, conceptKey = "مفهوم آموزشی" } = body;

    if (!studentId || !itemId || !rating) {
      return NextResponse.json(
        { success: false, error: "اطلاعات ارزیابی کارت FSRS ناقص است." },
        { status: 400 }
      );
    }

    const numericRating = Number(rating) as FSRSRating;
    if (![1, 2, 3, 4].includes(numericRating)) {
      return NextResponse.json(
        { success: false, error: "رتبه FSRS باید بین ۱ تا ۴ باشد." },
        { status: 400 }
      );
    }

    // واکشی یا ایجاد رکورد کارت فعلی
    let currentRecord = await prisma.studentFSRSProgress.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    if (!currentRecord) {
      currentRecord = await prisma.studentFSRSProgress.create({
        data: {
          studentId,
          studyPackId: studyPackId || "default-pack",
          itemId,
          conceptKey,
          stability: 1.0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          state: "NEW",
          nextReviewDate: new Date(),
        },
      });
    }

    const cardData: FSRSCardData = {
      itemId: currentRecord.itemId,
      conceptKey: currentRecord.conceptKey,
      stability: currentRecord.stability,
      difficulty: currentRecord.difficulty,
      reps: currentRecord.reps,
      lapses: currentRecord.lapses,
      state: currentRecord.state as any,
      lastReviewedAt: currentRecord.lastReviewedAt ? currentRecord.lastReviewedAt.toISOString() : null,
      nextReviewDate: currentRecord.nextReviewDate.toISOString(),
      lastRating: currentRecord.lastRating as any,
    };

    // اجرای الگوریتم ریاضی FSRS v4.5
    const reviewResult = FSRSEngine.calculateNextState(cardData, numericRating, new Date());

    // ذخیره در پایگاه داده
    const updated = await prisma.studentFSRSProgress.update({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
      data: {
        stability: reviewResult.updatedCard.stability,
        difficulty: reviewResult.updatedCard.difficulty,
        reps: reviewResult.updatedCard.reps,
        lapses: reviewResult.updatedCard.lapses,
        state: reviewResult.updatedCard.state,
        lastReviewedAt: new Date(reviewResult.updatedCard.lastReviewedAt!),
        nextReviewDate: reviewResult.scheduledDate,
        lastRating: numericRating,
      },
    });

    return NextResponse.json({
      success: true,
      result: reviewResult,
      updatedRecord: updated,
    });
  } catch (error: any) {
    console.error("FSRS POST error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت نوبت FSRS", details: error?.message },
      { status: 500 }
    );
  }
}
