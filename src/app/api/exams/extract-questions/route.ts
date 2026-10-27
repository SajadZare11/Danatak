import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    let rawText = "";
    let pdfBase64: string | null = null;
    let fileName = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textParam = formData.get("rawText") as string | null;

      if (textParam) {
        rawText = textParam;
      }

      if (file) {
        fileName = file.name || "";
        const lowerName = fileName.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (lowerName.endsWith(".docx")) {
          // استخراج متن فایل Word با mammoth
          const extracted = await mammoth.extractRawText({ buffer });
          rawText = extracted.value + "\n" + rawText;
        } else if (lowerName.endsWith(".pdf")) {
          // ذخیره base64 برای ارسال مستقیم به مدل چندوجهی Gemini
          pdfBase64 = buffer.toString("base64");
        } else if (lowerName.endsWith(".txt")) {
          rawText = buffer.toString("utf-8") + "\n" + rawText;
        }
      }
    } else {
      const body = await req.json();
      rawText = body.rawText || body.text || "";
    }

    if (!rawText.trim() && !pdfBase64) {
      return NextResponse.json(
        { error: "متن یا فایلی برای استخراج سوالات ارسال نشده است" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let extractedQuestions: any[] = [];

    // اگر کلید API تنظیم شده باشد، از مدل هوشمند Gemini استفاده می‌کنیم
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
شما یک استاد طراح ارشد سوالات آزمون مدارس و کنکور ایران هستید.
وظیفه شما این است که از روی متن، سند Word یا فایل PDF ارسالی، تمام سوالات را استخراج و ساختاردهی کنید.

قوانین مهم:
۱. نوع هر سوال باید یکی از موارد زیر باشد:
   - "MULTIPLE_CHOICE" (چهارگزینه‌ای/تستی)
   - "TRUE_FALSE" (صحیح یا غلط)
   - "FILL_BLANK" (جای‌خالی یا عدد/پاسخ کوتاه)
   - "DESCRIPTIVE" (تشریحی و بازپاسخ)
۲. فرمول‌های ریاضی و فیزیک را حتماً در قالب KaTeX استاندارد قرار دهید (مثلاً: $f'(x) = 2x$ یا $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$).
۳. برای سوالات تستی و صحیح/غلط، حتماً گزینه یا وضعیت درست را با isCorrect: true مشخص کن.
۴. برای سوالات جای‌خالی، در یکی از گزینه‌ها یا در فیلد explanation پاسخ صحیح را قید کن.
۵. خروجی باید منحصراً یک آرایه معتبر JSON از اشیاء سوال با فرمت زیر باشد (بدون هیچ متن اضافی قبل یا بعد از [ ]):
[
  {
    "content": "صورت سوال با فرمول $...$",
    "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "DESCRIPTIVE",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "options": [
      { "text": "متن گزینه ۱ با فرمول", "orderIndex": 1, "isCorrect": true },
      { "text": "متن گزینه ۲ با فرمول", "orderIndex": 2, "isCorrect": false },
      { "text": "متن گزینه ۳ با فرمول", "orderIndex": 3, "isCorrect": false },
      { "text": "متن گزینه ۴ با فرمول", "orderIndex": 4, "isCorrect": false }
    ],
    "explanation": "راه حل یا راهنمای تصحیح"
  }
]
`;

        const contents: any[] = [];
        if (pdfBase64) {
          contents.push({
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          });
        }
        if (rawText.trim()) {
          contents.push({
            text: `متن منبع سوالات:\n${rawText}\n\n${prompt}`,
          });
        } else {
          contents.push({
            text: prompt,
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
        });

        const outputText = response.text || "";
        // استخراج بخش JSON از خروجی مدل
        const jsonMatch = outputText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedQuestions = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError: any) {
        console.warn("Gemini extraction failed, falling back to rule-based parser:", geminiError?.message || geminiError);
      }
    }

    // اگر مدل هوش مصنوعی در دسترس نبود یا پاسخی نداد، از پارسر الگوگرا استفاده می‌کنیم
    if (extractedQuestions.length === 0 && rawText.trim()) {
      extractedQuestions = parseQuestionsWithRules(rawText);
    }

    // استانداردسازی فیلدهای سوالات
    const finalized = extractedQuestions.map((q, idx) => {
      const type = q.type || (q.options && q.options.length > 2 ? "MULTIPLE_CHOICE" : "DESCRIPTIVE");
      let opts = q.options || [];

      if (type === "TRUE_FALSE" && (!opts || opts.length === 0)) {
        opts = [
          { orderIndex: 1, text: "صحیح", isCorrect: true },
          { orderIndex: 2, text: "غلط", isCorrect: false },
        ];
      }

      return {
        id: `extracted-${Date.now()}-${idx + 1}`,
        content: q.content || q.questionText || `سوال شماره ${idx + 1}`,
        type,
        difficulty: q.difficulty || "MEDIUM",
        options: opts.map((o: any, oIdx: number) => ({
          id: `opt-${idx + 1}-${oIdx + 1}`,
          orderIndex: o.orderIndex || oIdx + 1,
          text: o.text || o.optionText || `گزینه ${oIdx + 1}`,
          isCorrect: Boolean(o.isCorrect),
        })),
        explanation: q.explanation || "",
      };
    });

    return NextResponse.json({
      success: true,
      questions: finalized,
      count: finalized.length,
      source: pdfBase64 ? "PDF_FILE" : fileName ? "DOCX_FILE" : "RAW_TEXT",
      message: `${finalized.length} سوال با موفقیت شناسایی و استخراج گردید.`,
    });
  } catch (error: any) {
    console.error("Extract Questions API error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش و استخراج سوالات: " + (error?.message || "ناشناخته") },
      { status: 500 }
    );
  }
}

/**
 * پارسر الگوگرای آفلاین برای متون فارسی سوالات آزمون
 */
function parseQuestionsWithRules(text: string): any[] {
  const questions: any[] = [];
  // تقسیم‌بندی بر اساس شماره سوالات (مثال: ۱- یا سوال ۱: یا 1.)
  const rawBlocks = text.split(/(?:^|\n)(?=(?:سوال\s*)?[۰-۹0-9]+[\.\-\:\)])/gim);

  for (let block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.length < 5) continue;

    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const content = lines[0].replace(/^(?:سوال\s*)?[۰-۹0-9]+[\.\-\:\)]\s*/, "");

    const optionLines = lines.slice(1);
    const options: any[] = [];
    let detectedType = "DESCRIPTIVE";
    let explanation = "";

    // جستجوی گزینه‌ها: الف، ب، ج، د یا ۱، ۲، ۳، ۴
    const optRegex = /^(?:[۱-۴1-4]|[الفبجد])[\.\-\:\)]\s*(.*)$/;

    optionLines.forEach((line, lIdx) => {
      const match = line.match(optRegex);
      if (match) {
        const isMarkedCorrect = line.includes("*") || line.includes("✓") || line.includes("(صحیح)");
        options.push({
          orderIndex: options.length + 1,
          text: match[1].replace(/[\*✓]/g, "").trim(),
          isCorrect: isMarkedCorrect || options.length === 0, // پیش‌فرض گزینه اول صحیح مگر مشخص شده باشد
        });
      } else if (line.startsWith("پاسخ:") || line.startsWith("حل:") || line.startsWith("راهنمایی:")) {
        explanation = line.replace(/^(?:پاسخ|حل|راهنمایی)\:\s*/, "");
      }
    });

    if (options.length >= 3) {
      detectedType = "MULTIPLE_CHOICE";
    } else if (
      trimmed.includes("صحیح است یا غلط") ||
      trimmed.includes("صحیح/غلط") ||
      (options.length === 2 && (options[0].text.includes("صحیح") || options[1].text.includes("غلط")))
    ) {
      detectedType = "TRUE_FALSE";
    } else if (trimmed.includes("جای خالی") || trimmed.includes("...") || trimmed.includes("برابر با ..")) {
      detectedType = "FILL_BLANK";
    }

    questions.push({
      content,
      type: detectedType,
      difficulty: "MEDIUM",
      options,
      explanation,
    });
  }

  // اگر تقسیم‌بندی بالا کار نکرد و کل متن یکجا بود:
  if (questions.length === 0 && text.trim().length > 10) {
    questions.push({
      content: text.trim().slice(0, 300),
      type: "DESCRIPTIVE",
      difficulty: "MEDIUM",
      options: [],
      explanation: "",
    });
  }

  return questions;
}
