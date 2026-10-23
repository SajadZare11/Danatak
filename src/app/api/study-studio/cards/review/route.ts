import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SM2Engine } from "@/lib/study-studio/sm2";
import { CardRating } from "@/lib/study-studio/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flashcardId, studentId, rating } = body;

    if (!flashcardId || !rating || ![1, 2, 3, 4].includes(rating)) {
      return NextResponse.json(
        { success: false, error: "شناسه فلش‌کارت و امتیاز معتبر (۱ تا ۴) الزامی است." },
        { status: 400 }
      );
    }

    // تعیین دانش‌آموز هدف (از ورودی یا پیش‌فرض)
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      targetStudentId = defaultStudent?.id;
    }

    if (!targetStudentId) {
      return NextResponse.json(
        { success: false, error: "کاربر دانش‌آموز یافت نشد." },
        { status: 400 }
      );
    }

    // دریافت وضعیت فعلی پیشرفت کارت یا ایجاد رکورد پیش‌فرض
    let progress = await prisma.studentCardProgress.findUnique({
      where: {
        studentId_flashcardId: {
          studentId: targetStudentId,
          flashcardId,
        },
      },
    });

    const currentState = {
      easinessFactor: progress?.easinessFactor || 2.5,
      interval: progress?.interval || 0,
      repetitions: progress?.repetitions || 0,
      lapseCount: progress?.lapseCount || 0,
    };

    // اجرای الگوریتم ریاضی SM-2
    const sm2Result = SM2Engine.calculate(currentState, rating as CardRating);

    // به‌روزرسانی یا ایجاد در پایگاه داده
    const updated = await prisma.studentCardProgress.upsert({
      where: {
        studentId_flashcardId: {
          studentId: targetStudentId,
          flashcardId,
        },
      },
      create: {
        studentId: targetStudentId,
        flashcardId,
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        lapseCount: sm2Result.lapseCount,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
        lastRating: rating,
        reviewCount: 1,
      },
      update: {
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        lapseCount: sm2Result.lapseCount,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
        lastRating: rating,
        reviewCount: { increment: 1 },
      },
    });

    // ثبت در لاگ دورسنجی مطالعه
    await prisma.studyTelemetryLog.create({
      data: {
        studentId: targetStudentId,
        eventType: "flashcard_reviewed",
        metadataJson: JSON.stringify({
          flashcardId,
          rating,
          newInterval: sm2Result.interval,
          nextReviewDate: sm2Result.nextReviewDate.toISOString(),
          easinessFactor: sm2Result.easinessFactor,
        }),
      },
    });

    // اعطای امتیاز گیمیفیکیشن (+۵ XP به ازای هر مرور)
    const studentUser = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: { studentProfile: true },
    });

    if (studentUser?.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          totalXP: { increment: 5 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      progress: updated,
      sm2Result,
    });
  } catch (error: any) {
    console.error("Error submitting card review:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت مرور کارت SM-2", details: error?.message },
      { status: 500 }
    );
  }
}
