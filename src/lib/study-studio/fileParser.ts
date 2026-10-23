import { StudySourceType, ParsedInputMedia } from "./types";

/**
 * سرویس پردازش و تبدیل ورودی‌های چندرسانه‌ای (متن، PDF، تصویر و صوت)
 */
export class FileParserService {
  /**
   * تجزیه ورودی ارسالی از کلاینت به ساختار استاندارد رسانه‌ای
   */
  static parseInput(
    content: string,
    forcedType?: StudySourceType,
    fileName?: string
  ): ParsedInputMedia {
    const trimmed = content.trim();

    // ۱. بررسی داده‌های Data URL (آپلود فایل base64)
    if (trimmed.startsWith("data:")) {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        const mimeType = match[1].toLowerCase();
        const base64Data = match[2];

        let sourceType: StudySourceType = forcedType || "TEXT";
        if (mimeType.includes("pdf")) {
          sourceType = "PDF";
        } else if (mimeType.startsWith("image/")) {
          sourceType = "IMAGE";
        } else if (mimeType.startsWith("audio/")) {
          sourceType = "AUDIO";
        }

        return {
          sourceType,
          mimeType,
          base64Data,
          fileName,
        };
      }
    }

    // ۲. ورودی متنی مستقیم (یادداشت، مقاله، فرمول)
    let detectedType: StudySourceType = forcedType || "TEXT";
    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith(".pdf")) detectedType = "PDF";
      else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) detectedType = "IMAGE";
      else if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".m4a") || lower.endsWith(".webm") || lower.endsWith(".ogg")) detectedType = "AUDIO";
    }

    return {
      sourceType: detectedType,
      mimeType: detectedType === "TEXT" ? "text/plain" : "application/octet-stream",
      rawText: trimmed,
      fileName,
    };
  }

  /**
   * استخراج عنوان و کلیدواژه‌های اولیه از متن خام
   */
  static extractMetadataFromText(text: string): { suggestedTitle: string; wordCount: number } {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const suggestedTitle = lines.length > 0 ? lines[0].slice(0, 70) : "بسته مطالعه هوشمند";
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      suggestedTitle,
      wordCount,
    };
  }
}
