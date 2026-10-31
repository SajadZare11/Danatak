import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ParsedInputMedia } from "@/lib/study-studio/types";
import { AdaptiveCourseStructure, AdaptiveLearningNode } from "./types";
import { SAMPLE_CALCULUS_ADAPTIVE_COURSE } from "./sampleCourse";

/**
 * سرویس پردازش چندوجهی و کشینگ هش اسناد (Smart Ingestion & Hash Deduplication)
 * مجهز به:
 * ۱. سیستم کشینگ SHA-256 برای پاسخ فوری زیر ۱ ثانیه و صفر کردن هزینه هوش مصنوعی
 * ۲. تشخیص خودکار فونت‌های به‌هم‌ریخته PDFهای فارسی و ارجاع به مدل بینایی (Vision LLM / OCR)
 * ۳. خرد کردن محتوا به نودهای ۵ دقیقه‌ای (Micro-Nodes) و چالش Boss Fight
 * ۴. استخراج ۶ فرمت تعاملی بر پایه هرم بلوم همراه با ارجاع به خط دقیق جزوه
 */
export class AdaptiveIngestionService {
  /**
   * محاسبه کد هش SHA-256 برای شناسایی فایل‌ها و جزوه‌های یکسان
   */
  static computeContentHash(content: string): string {
    return crypto.createHash("sha256").update(content.trim()).digest("hex");
  }

  /**
   * بررسی وجود بسته از پیش تولید شده با همین هش (صفر کردن هزینه API)
   */
  static async findExistingByHash(hash: string): Promise<{
    found: boolean;
    packId?: string;
    courseStructure?: AdaptiveCourseStructure;
  }> {
    try {
      const existing = await prisma.studyPack.findFirst({
        where: { contentHash: hash },
        select: { id: true, nodesJson: true, title: true, topicTag: true, gradeLevel: true, description: true },
      });

      if (existing && existing.nodesJson) {
        const parsed = JSON.parse(existing.nodesJson) as AdaptiveCourseStructure;
        return {
          found: true,
          packId: existing.id,
          courseStructure: parsed,
        };
      }
    } catch (err) {
      console.warn("⚠ [AdaptiveIngestion] Failed to check hash cache in DB:", err);
    }

    return { found: false };
  }

  /**
   * بررسی سلامت فونت و متن استخراج‌شده از PDF فارسی
   * اگر خروجی خرچنگ‌قورباغه باشد یا کاراکترهای نامعتبر فراوان باشد، خروجی false می‌دهد تا به OCR منتقل شود.
   */
  static isPersianTextHealthy(text: string): boolean {
    if (!text || text.trim().length < 20) return false;

    // بررسی کاراکتر جایگزین نامعتبر یونیکد \uFFFD یا علامت سوال‌های متوالی
    const replacementMatches = text.match(/\uFFFD|\?{3,}/g);
    if (replacementMatches && replacementMatches.length > 5) return false;

    // بررسی علائم انکودینگ خراب ویندوز ۱۲۵۶ یا UTF-8 ناقص مثل Ø§Ø³ØªØ§Ø¯
    const mojiBakeMatches = text.match(/[ØÙÚÛ][\x80-\xFF]/g);
    if (mojiBakeMatches && mojiBakeMatches.length > 10) return false;

    // نسبت کاراکترهای فارسی به کل رشته
    const persianRegex = /[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u06CC\u200C]/g;
    const persianCount = (text.match(persianRegex) || []).length;
    const alphanumericCount = (text.match(/[a-zA-Z0-9\u0600-\u06FF]/g) || []).length;

    if (alphanumericCount > 30 && persianCount / alphanumericCount < 0.25) {
      // اگر متن فارسی بسیار کم است در حالی که فایل به فارسی معرفی شده
      return false;
    }

    return true;
  }

  /**
   * خط لوله استخراج متن با بینایی ماشینی (Vision LLM) در صورت خرابی فونت یا دست‌نویس بودن
   */
  static async extractWithVisionFallback(
    media: ParsedInputMedia,
    apiKey?: string
  ): Promise<{ text: string; ocrUsed: boolean }> {
    // اگر متن سالم دارد، نیازی به بینایی نیست
    if (media.rawText && this.isPersianTextHealthy(media.rawText)) {
      return { text: media.rawText, ocrUsed: false };
    }

    // اگر کلید جمینای موجود باشد و فایل به صورت base64 باشد
    if (apiKey && media.base64Data) {
      try {
        console.log("🔍 [AdaptiveIngestion] Corrupted or image detected. Invoking Vision LLM for Persian transcription...");
        const ai = new GoogleGenAI({ apiKey });

        const visionPrompt = `
شما یک سیستم OCR و بینایی فوق‌پیشرفته برای متون، جزوات و فرمول‌های آموزشی ایران هستید.
لطفاً متن، تعاریف، فرمول‌های ریاضی و فیزیک (با سینتکس KaTeX مثلاً $f'(x)=2x$) و جدول‌های این سند را با حداکثر دقت بازنویسی کنید.
فونت‌های به‌هم‌ریخته را اصلاح و متن پاکیزه و ساختاریافته ارائه دهید.
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: visionPrompt },
                {
                  inlineData: {
                    mimeType: media.mimeType || "application/pdf",
                    data: media.base64Data,
                  },
                },
              ],
            },
          ],
        });

        const extracted = response.text?.trim();
        if (extracted && extracted.length > 30) {
          return { text: extracted, ocrUsed: true };
        }
      } catch (err) {
        console.warn("⚠ [AdaptiveIngestion] Vision OCR call failed, falling back to clean raw text:", err);
      }
    }

    // بازگشت به متن خام موجود
    return {
      text: media.rawText || "متن جزوه آموزشی مورد نظر جهت یادگیری تطبیقی",
      ocrUsed: false,
    };
  }

  /**
   * خط لوله اصلی تولید دوره یادگیری تطبیقی بر پایه هرم بلوم
   */
  static async generateAdaptiveCourse(
    content: string,
    options?: {
      targetGrade?: number;
      topicTag?: string;
      fileName?: string;
    }
  ): Promise<AdaptiveCourseStructure> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const contentHash = this.computeContentHash(content);

    // ۱. بررسی کش هش
    const cacheResult = await this.findExistingByHash(contentHash);
    if (cacheResult.found && cacheResult.courseStructure) {
      console.log("⚡ [AdaptiveIngestion] Cache HIT! Returning existing course with 0 API tokens.");
      return cacheResult.courseStructure;
    }

    // ۲. اگر API Key تنظیم نشده باشد، بازگرداندن دوره سمپاد الگو
    if (!apiKey) {
      console.log("ℹ [AdaptiveIngestion] GEMINI_API_KEY is not set. Generating rich pedagogical fallback course.");
      const course = JSON.parse(JSON.stringify(SAMPLE_CALCULUS_ADAPTIVE_COURSE)) as AdaptiveCourseStructure;
      course.contentHash = contentHash;
      if (options?.topicTag) course.topicTag = options.topicTag;
      if (options?.targetGrade) course.gradeLevel = options.targetGrade;
      return course;
    }

    // ۳. فراخوانی جمینای با پرامپت سخت‌گیرانه برای تولید نودهای ۵ دقیقه‌ای و ۶ قالب بلوم
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
شما یک مدیر ارشد طراحی آموزشی (Principal Pedagogical Architect) متخصص در علوم شناختی و کنکور سراسری مدارس سمپاد ایران هستید.
وظیفه شما این است که متن آموزشی زیر را به یک دوره فوق‌پیشرفته «میکرولرنینگ تطبیقی» (Adaptive Micro-Learning Course) تبدیل کنید.

قواعد ساختاری اجباری:
۱. محتوا را به ۳ مرحله یادگیری ۵ دقیقه‌ای متوالی (Learning Nodes) تقسیم کنید.
۲. هر نود باید ۳ تا ۵ مفهوم کلیدی را آموزش دهد و شامل آیتم‌های سنجش متنوع بر اساس هرم بلوم باشد:
   - multiple_choice: تست مفهومی و سناریومحور ۴ گزینه‌ای با گزینه‌های انحرافی هوشمند
   - cloze_deletion: یک جمله کلیدی با [BLANK] و ۴ گزینه کلمه‌ای نزدیک به هم
   - speed_match: ۴ جفت term و definition برای جفت‌سازی سریع زیر ۳۰ ثانیه
   - spot_error: گزاره‌ای از جزوه با بخش‌های قابل کلیک (segments) که یکی از آن‌ها خطای ظریف علمی دارد
   - feynman_prompt: درخواست توضیح به زبان ساده برای هوش مصنوعی با ۳ کلیدواژه الزامی در rubricKeywords
   - flashcard_mnemonic: کارت دوطرفه با کد رمز حافظه و تصویرسازی ذهنی در mnemonicClue
۳. در پایان دوره، یک مرحله نهایی و حماسی «Boss Fight» با سوالات ترکیبی سطح تحلیل و ارزیابی بلوم ایجاد کنید.
۴. ارجاع مستقیم به جزوه (Grounded Remediation): برای تک‌تک سوالات، فیلدهای sourceQuote (نقل‌قول دقیق از متن ورودی) و pageNumber را مشخص کنید. در صورتی که کاربر اشتباه پاسخ دهد، این بخش باز می‌شود.
۵. خروجی باید یک JSON معتبر باشد:

\`\`\`json
{
  "title": "عنوان جذاب درس",
  "description": "توضیح مختصر",
  "topicTag": "نام سرفصل",
  "gradeLevel": 12,
  "summary": "چکیده ۲ خطی",
  "nodes": [
    {
      "id": "node-1",
      "nodeNumber": 1,
      "title": "عنوان مرحله ۱",
      "description": "توضیح",
      "estimatedMinutes": 5,
      "isBossFight": false,
      "xpReward": 50,
      "minPassingScore": 75,
      "keyConcepts": ["مفهوم ۱", "مفهوم ۲", "مفهوم ۳"],
      "items": [
        {
          "id": "item-1-1",
          "type": "multiple_choice",
          "conceptKey": "مفهوم کلیدی",
          "bloomLevel": "APPLY",
          "prompt": "متن سوال با فرمول $...$",
          "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
          "correctAnswer": "گزینه ۱",
          "sourceQuote": "نقل قول دقیق از متن جزوه",
          "pageNumber": 1,
          "remediationExplanation": "توضیح دلیل رد گزینه‌های غلط",
          "isomorphicQuestion": {
            "prompt": "سوال هم‌خانواده جایگزین",
            "options": ["گ۱", "گ۲", "گ۳", "گ۴"],
            "correctAnswer": "گ۱",
            "explanation": "دلیل پاسخ"
          }
        }
      ]
    }
  ],
  "bossFight": {
    "id": "boss-fight",
    "nodeNumber": 4,
    "title": "⚔️ چالش حماسی Boss Fight",
    "description": "نبرد در ۱۸۰ ثانیه",
    "estimatedMinutes": 3,
    "isBossFight": true,
    "xpReward": 150,
    "minPassingScore": 80,
    "keyConcepts": ["ترکیب مفاهیم"],
    "items": []
  }
}
\`\`\`

متن جزوه آموزشی ورودی:
${content.slice(0, 8000)}
`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = result.text?.trim() || "";
      let parsed = JSON.parse(responseText) as AdaptiveCourseStructure;
      parsed.contentHash = contentHash;

      if (!parsed.bossFight) {
        parsed.bossFight = SAMPLE_CALCULUS_ADAPTIVE_COURSE.bossFight;
      }

      return parsed;
    } catch (error) {
      console.warn("⚠ [AdaptiveIngestion] Gemini structured generation failed, using rich fallback:", error);
      const fallback = JSON.parse(JSON.stringify(SAMPLE_CALCULUS_ADAPTIVE_COURSE)) as AdaptiveCourseStructure;
      fallback.contentHash = contentHash;
      if (options?.topicTag) fallback.topicTag = options.topicTag;
      return fallback;
    }
  }

  /**
   * ذخیره بسته تطبیقی در دیتابیس و ایجاد رکوردهای اولیه نودها و FSRS
   */
  static async persistAdaptiveCourse(
    course: AdaptiveCourseStructure,
    creatorId: string,
    studentId?: string
  ): Promise<string> {
    // ۱. ایجاد یا به‌روزرسانی بسته مطالعه در دیتابیس
    const pack = await prisma.studyPack.create({
      data: {
        title: course.title,
        description: course.description,
        creatorId,
        topicTag: course.topicTag,
        gradeLevel: course.gradeLevel,
        contentHash: course.contentHash,
        ocrUsed: !!course.ocrUsed,
        summaryJson: JSON.stringify({
          overview: course.summary,
          keyTakeaways: course.nodes.flatMap((n) => n.keyConcepts),
          glossary: [],
        }),
        mindMapJson: JSON.stringify({
          nodes: course.nodes.map((n, i) => ({ id: n.id, label: n.title })),
          edges: course.nodes.slice(1).map((n, i) => ({
            id: `edge-${i}`,
            source: course.nodes[i].id,
            target: n.id,
          })),
        }),
        nodesJson: JSON.stringify(course),
      },
    });

    // ۲. اگر دانش‌آموز مشخص باشد، وضعیت پیشرفت نودها و وضعیت FSRS را مقداردهی اولیه می‌کنیم
    if (studentId) {
      await this.initializeStudentProgress(pack.id, studentId, course);
    }

    return pack.id;
  }

  /**
   * مقداردهی اولیه نودهای مرحله‌ای و رکوردهای FSRS برای دانش‌آموز
   */
  static async initializeStudentProgress(
    studyPackId: string,
    studentId: string,
    course: AdaptiveCourseStructure
  ) {
    const allNodes: AdaptiveLearningNode[] = [...course.nodes, course.bossFight];

    // ایجاد پیشرفت نودها (نود ۱ باز است، بقیه قفل هستند)
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      const isFirst = i === 0;

      await prisma.studentLearningNodeProgress.upsert({
        where: {
          studentId_studyPackId_nodeId: {
            studentId,
            studyPackId,
            nodeId: node.id,
          },
        },
        create: {
          studentId,
          studyPackId,
          nodeId: node.id,
          isCompleted: false,
          isUnlocked: isFirst,
          bestScore: 0,
          starsEarned: 0,
          heartsLeft: 3,
          streakCount: 0,
        },
        update: {},
      });
    }

    // ایجاد رکوردهای اولیه FSRS برای کلیه سوالات و مفاهیم
    const allItems = allNodes.flatMap((n) => n.items || []);
    for (const item of allItems) {
      await prisma.studentFSRSProgress.upsert({
        where: {
          studentId_itemId: {
            studentId,
            itemId: item.id,
          },
        },
        create: {
          studentId,
          studyPackId,
          itemId: item.id,
          conceptKey: item.conceptKey || item.prompt.slice(0, 30),
          stability: 1.0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          state: "NEW",
          nextReviewDate: new Date(),
        },
        update: {},
      });
    }
  }
}
