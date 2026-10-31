import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FileParserService } from "@/lib/study-studio/fileParser";
import { AdaptiveIngestionService } from "@/lib/adaptive/adaptiveIngestionService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      sourceType,
      fileName,
      targetGrade = 12,
      preferredTopic,
      creatorId,
      studentId,
    } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "محتوا یا فایل جزوه الزامی است." },
        { status: 400 }
      );
    }

    // ۱. پردازش ورودی رسانه‌ای
    const parsedMedia = FileParserService.parseInput(content, sourceType, fileName);

    // ۲. بررسی سلامت متن و خط لوله Vision OCR
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const { text: cleanText, ocrUsed } = await AdaptiveIngestionService.extractWithVisionFallback(
      parsedMedia,
      apiKey
    );

    // ۳. محاسبه هش SHA-256 جهت کشینگ هوشمند و هزینه صفر دلاری
    const contentHash = AdaptiveIngestionService.computeContentHash(cleanText);
    const existingCache = await AdaptiveIngestionService.findExistingByHash(contentHash);

    let finalCreatorId = creatorId;
    if (!finalCreatorId) {
      const defaultUser = await prisma.user.findFirst();
      finalCreatorId = defaultUser?.id || "demo-user";
    }

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      targetStudentId = defaultStudent?.id;
    }

    // سناریوی Cache Hit: قبلاً بارگذاری شده است
    if (existingCache.found && existingCache.courseStructure && existingCache.packId) {
      if (targetStudentId) {
        await AdaptiveIngestionService.initializeStudentProgress(
          existingCache.packId,
          targetStudentId,
          existingCache.courseStructure
        );
      }

      return NextResponse.json({
        success: true,
        isCacheHit: true,
        packId: existingCache.packId,
        courseStructure: existingCache.courseStructure,
        message: "⚡ بازیابی آنی از کش هش SHA-256 (هزینه صفر دلار و سرعت زیر ۱ ثانیه)",
      });
    }

    // سناریوی تولید هوشمند جدید
    const generatedCourse = await AdaptiveIngestionService.generateAdaptiveCourse(cleanText, {
      targetGrade: Number(targetGrade) || 12,
      topicTag: preferredTopic,
      fileName,
    });

    generatedCourse.contentHash = contentHash;
    generatedCourse.ocrUsed = ocrUsed;

    // ذخیره در پایگاه‌داده
    const packId = await AdaptiveIngestionService.persistAdaptiveCourse(
      generatedCourse,
      finalCreatorId,
      targetStudentId
    );

    return NextResponse.json({
      success: true,
      isCacheHit: false,
      packId,
      courseStructure: generatedCourse,
      ocrUsed,
      message: ocrUsed
        ? "✅ تبدیل موفق با مدل بینایی (Vision OCR) و خرد کردن به نودهای بلوم"
        : "✅ ساخت موفقیت‌آمیز نقشه یادگیری تطبیقی و مراحل بلوم",
    });
  } catch (error: any) {
    console.error("Adaptive Ingestion Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در پردازش هوشمند جزوه و ساخت نقشه مراحل",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
