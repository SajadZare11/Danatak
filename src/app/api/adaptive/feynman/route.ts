import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userExplanation, rubricKeywords = [], prompt, sampleAnswer } = body;

    if (!userExplanation || typeof userExplanation !== "string") {
      return NextResponse.json(
        { success: false, error: "توضیح دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const trimmed = userExplanation.trim();
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // ۱. بررسی کلمات کلیدی روباریک با فازی متنی
    const conceptsFound: string[] = [];
    const conceptsMissing: string[] = [];

    rubricKeywords.forEach((kw: string) => {
      // پاکسازی کلمات داخل پرانتز و تقسیم به کلمات تشکیل‌دهنده
      const cleanKw = kw.replace(/\([^)]*\)/g, "").trim();
      const parts = cleanKw.split(/\s+/).filter((p) => p.length > 2);

      const hasMatch = parts.some((p) => trimmed.includes(p)) || trimmed.includes(cleanKw);
      if (hasMatch) {
        conceptsFound.push(kw);
      } else {
        conceptsMissing.push(kw);
      }
    });

    const keywordScore =
      rubricKeywords.length > 0 ? (conceptsFound.length / rubricKeywords.length) * 100 : 80;

    // ۲. در صورت دسترسی به Gemini، ارزیابی معنایی و لحن آموزشی فاینمن را هم انجام می‌دهیم
    let feedback = "";
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const evalPrompt = `
شما در نقش ریچارد فاینمن (اتاق یادگیری فاینمن) هستید. یک دانش‌آموز دبیرستانی این مبحث را به زبان ساده برای شما توضیح داده است:
موضوع: ${prompt}
توضیح دانش‌آموز: "${trimmed}"
پاسخ ایده‌آل و کلیدواژه‌ها: ${rubricKeywords.join("، ")} | ${sampleAnswer || ""}

در ۲ تا ۳ جمله کوتاه، صمیمی و تشویق‌کننده به زبان فارسی:
۱. نقاط قوت درک مفهومی او را تحسین کن.
۲. اگر نکته‌ای جا مانده یا ظرافت علمی نیاز دارد خیلی دوستانه یادآوری کن.
`;
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: evalPrompt,
        });
        feedback = res.text?.trim() || "";
      } catch (err) {
        console.warn("Feynman AI evaluation fallback:", err);
      }
    }

    if (!feedback) {
      if (keywordScore >= 70) {
        feedback =
          "عالی بود! توانستی مفهوم بنیادی را به زبان خودت و با ذکر نکات کلیدی بیان کنی. این یعنی مبحث در حافظه بلندمدتت ثبت شده است.";
      } else {
        feedback =
          "توضیحت شروع خوبی بود، اما برای تسلط کامل، سعی کن به نکات جامانده در روباریک هم اشاره کنی تا استدلالت بی‌نقص شود.";
      }
    }

    const masteryPercentage = Math.round(Math.min(100, Math.max(20, keywordScore)));
    const passed = masteryPercentage >= 65;

    return NextResponse.json({
      success: true,
      masteryPercentage,
      conceptsFound,
      conceptsMissing,
      feedback,
      passed,
    });
  } catch (error: any) {
    console.error("Feynman API error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ارزیابی فاینمن", details: error?.message },
      { status: 500 }
    );
  }
}
