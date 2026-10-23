import { NextRequest, NextResponse } from "next/server";
import { FileParserService } from "@/lib/study-studio/fileParser";
import { AIStudyStudioService } from "@/lib/study-studio/aiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, sourceType, fileName, targetGrade, preferredTopic } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "محتوا یا فایل ورودی الزامی است." },
        { status: 400 }
      );
    }

    // ۱. پردازش و تشخیص ساختار ورودی چندرسانه‌ای
    const parsedInput = FileParserService.parseInput(content, sourceType, fileName);

    // ۲. تولید هوشمند بسته مطالعه (با پشتیبانی از جمینای و فال‌بک آفلاین)
    const generatedPack = await AIStudyStudioService.generateStudyPack(parsedInput, {
      targetGrade: Number(targetGrade) || 12,
      preferredTopic: preferredTopic || undefined,
    });

    return NextResponse.json({
      success: true,
      data: generatedPack,
      sourceType: parsedInput.sourceType,
    });
  } catch (error: any) {
    console.error("Error generating study pack:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در تولید بسته مطالعه هوشمند. لطفاً ورودی را بررسی نمایید.",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
