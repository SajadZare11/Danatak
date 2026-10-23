import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");
    const boxLevelParam = searchParams.get("boxLevel");

    let studentId = studentIdParam;
    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT", nationalId: "0022334455" },
      });
      studentId = defaultStudent?.id || "";
    }

    const where: any = { studentId };
    if (boxLevelParam && boxLevelParam !== "ALL") {
      where.boxLevel = Number(boxLevelParam);
    }

    const cards = await prisma.leitnerCard.findMany({
      where,
      include: {
        topic: true,
        question: {
          include: { options: true },
        },
      },
      orderBy: { nextReviewAt: "asc" },
    });

    // آمار تفکیکی ۵ خانه لایتنر
    const allStudentCards = await prisma.leitnerCard.findMany({
      where: { studentId },
      select: { id: true, boxLevel: true, nextReviewAt: true },
    });

    const boxCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dueTodayCount = 0;
    const now = new Date();

    allStudentCards.forEach((c) => {
      if (boxCounts[c.boxLevel] !== undefined) {
        boxCounts[c.boxLevel]++;
      }
      if (new Date(c.nextReviewAt) <= now) {
        dueTodayCount++;
      }
    });

    return NextResponse.json({
      cards,
      boxCounts,
      totalCards: allStudentCards.length,
      dueTodayCount,
    });
  } catch (error) {
    console.error("Student Leitner GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی کارت‌های لایتنر" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, cardId, isSuccess, frontContent, backContent, topicId, questionId, studentIdParam } = body;

    let studentId = studentIdParam;
    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT", nationalId: "0022334455" },
      });
      studentId = defaultStudent?.id || "";
    }

    // ۱. مرور کارت و ارتقا / تنزل در خانه‌های ۵گانه لایتنر
    if (action === "reviewCard" && cardId) {
      const card = await prisma.leitnerCard.findUnique({
        where: { id: cardId },
        include: {
          student: {
            include: { studentProfile: true },
          },
        },
      });

      if (!card) {
        return NextResponse.json({ error: "کارت یافت نشد" }, { status: 404 });
      }

      let newBoxLevel = card.boxLevel;
      let intervalDays = 1;

      if (isSuccess) {
        // ارتقا به خانه بعدی تا حداکثر خانه ۵
        newBoxLevel = Math.min(5, card.boxLevel + 1);
        // تعیین فاصله زمانی مرور بعدی بر اساس خانه: ۱ روز، ۲ روز، ۴ روز، ۸ روز، ۱۶ روز
        intervalDays = Math.pow(2, newBoxLevel - 1);
      } else {
        // بازگشت به خانه ۱ جهت مرور مجدد فردا
        newBoxLevel = 1;
        intervalDays = 1;
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

      const updatedCard = await prisma.leitnerCard.update({
        where: { id: cardId },
        data: {
          boxLevel: newBoxLevel,
          reviewCount: { increment: 1 },
          successCount: isSuccess ? { increment: 1 } : undefined,
          lastReviewedAt: new Date(),
          nextReviewAt: nextReviewDate,
        },
      });

      // اعطای امتیاز تجربه در صورت موفقیت
      let awardedXP = 0;
      if (isSuccess && card.student?.studentProfile) {
        awardedXP = 5;
        await prisma.studentProfile.update({
          where: { id: card.student.studentProfile.id },
          data: { totalXP: { increment: 5 } },
        });
      }

      return NextResponse.json({
        success: true,
        card: updatedCard,
        newBoxLevel,
        intervalDays,
        awardedXP,
        message: isSuccess
          ? `کارت به خانه ${newBoxLevel} ارتقا یافت! (+${awardedXP} XP)`
          : "کارت برای یادگیری مجدد به خانه ۱ بازگشت.",
      });
    }

    // ۲. ایجاد فلش‌کارت جدید
    if (action === "createCard" && frontContent && backContent) {
      const newCard = await prisma.leitnerCard.create({
        data: {
          studentId,
          topicId: topicId || null,
          questionId: questionId || null,
          frontContent,
          backContent,
          boxLevel: 1,
          nextReviewAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        card: newCard,
        message: "کارت جدید با موفقیت در خانه ۱ جعبه لایتنر قرار گرفت.",
      });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (error) {
    console.error("Student Leitner POST error:", error);
    return NextResponse.json({ error: "خطا در عملیات لایتنر" }, { status: 500 });
  }
}
