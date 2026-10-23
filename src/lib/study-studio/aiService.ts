import { GoogleGenAI } from "@google/genai";
import {
  GeneratedStudyPackContent,
  ParsedInputMedia,
  CardDifficulty,
  BloomTaxonomyLevel,
  QuizQuestionType,
} from "./types";

/**
 * سرویس تولید هوشمند بسته مطالعه (Multi-Modal Study Pack Generator)
 * پشتیبانی از مدل‌های روز Google Gemini به همراه موتور فال‌بک آفلاین (اینترانت ملی)
 */
export class AIStudyStudioService {
  /**
   * تولید بسته جامع مطالعه بر اساس محتوای ورودی
   */
  static async generateStudyPack(
    input: ParsedInputMedia,
    options?: {
      targetGrade?: number;
      preferredTopic?: string;
    }
  ): Promise<GeneratedStudyPackContent> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // اگر کلید API تنظیم نشده باشد، بلافاصله از موتور فال‌بک آفلاین استفاده می‌شود
    if (!apiKey) {
      console.log("ℹ [AIStudyStudio] GEMINI_API_KEY is not set. Using offline demo fallback generator.");
      return this.generateFallbackStudyPack(input, options);
    }

    try {
      return await this.callGeminiAPI(apiKey, input, options);
    } catch (error: any) {
      console.warn("⚠ [AIStudyStudio] Gemini API call failed or timed out. Falling back to offline generator:", error?.message || error);
      return this.generateFallbackStudyPack(input, options);
    }
  }

  /**
   * فراخوانی سرویس ابری رسمی Google Gemini API
   */
  private static async callGeminiAPI(
    apiKey: string,
    input: ParsedInputMedia,
    options?: {
      targetGrade?: number;
      preferredTopic?: string;
    }
  ): Promise<GeneratedStudyPackContent> {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
شما یک استاد طراح ارشد آموزشی و متخصص تالیف بسته‌های یادگیری مدارس سمپاد و تیزهوشان ایران هستید.
وظیفه شما این است که از روی ماده آموزشی ورودی (متن، جزوه PDF، تصویر تخته یا صوت تدریس)، یک بسته مطالعه جامع، جذاب و بسیار دقیق (Study Pack) شامل ۴ بخش اصلی تولید کنید:
۱. خلاصه هوشمند و تقلب‌نامه (Smart Summary & Cheat Sheet & Glossary)
۲. فلش‌کارت‌های مرور فاصله‌دار (Spaced Repetition Flashcards) با نگارش فرمول‌های ریاضی و فیزیک به صورت KaTeX مانند $f'(x) = 2x$
۳. بانک کوییز تطبیقی (Adaptive Quiz Bank) شامل سوالات ۴ گزینه‌ای، صحیح/غلط یا کوتاه با سطوح یادگیری بلوم و تحلیل چرایی درستی و نادرستی
۴. نقشه ذهنی مفاهیم (Mind Map) شامل گره‌ها (nodes) و یال‌ها (edges)

خروجی شما باید منحصراً و بدون هیچ متن اضافی قبل و بعد، یک ساختار معتبر JSON با شمای دقیق زیر باشد:
{
  "title": "عنوان جذاب و علمی بسته",
  "description": "توضیح کوتاه سرفصل و اهداف",
  "topicTag": "نام سرفصل",
  "gradeLevel": 12,
  "summary": {
    "overview": "متن چکیده مفهومی و منسجم درس",
    "keyTakeaways": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳"],
    "glossary": [
      { "term": "اصطلاح یا مفهوم", "definition": "تعریف دقیق و آموزشی" }
    ]
  },
  "flashcards": [
    {
      "front": "سوال یا مفهوم روی کارت با فرمول $...$",
      "back": "پاسخ یا اثبات پشت کارت",
      "hint": "راهنمایی جهت یادآوری",
      "topicTag": "نام سرفصل",
      "difficulty": "EASY"
    }
  ],
  "quiz": {
    "title": "عنوان کوییز سنجش سریع",
    "description": "توضیحات کوییز",
    "timeLimitMinutes": 10,
    "questions": [
      {
        "questionText": "متن سوال با فرمول ریاضی $...$",
        "type": "MULTIPLE_CHOICE",
        "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
        "correctAnswer": "گزینه ۲",
        "explanation": "تحلیل تشریحی آموزشی و دلیل رد سایر گزینه‌ها",
        "bloomLevel": "APPLY",
        "topicTag": "نام سرفصل"
      }
    ]
  },
  "mindMap": {
    "nodes": [
      { "id": "1", "label": "مفهوم اصلی", "category": "ریشه" },
      { "id": "2", "label": "مفهوم فرعی", "category": "شاخه" }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "label": "شامل" }
    ]
  }
}
`;

    const contents: any[] = [];

    // اگر ورودی فایل چندرسانه‌ای بافر دار باشد
    if (input.base64Data && input.mimeType) {
      contents.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.base64Data,
        },
      });
    }

    const userPrompt = `
پایه تحصیلی هدف: ${options?.targetGrade || 12}
مبحث پیشنهادی: ${options?.preferredTopic || "تشخیص خودکار از محتوا"}

محتوای آموزشی:
${input.rawText || "محتوا از فایل چندرسانه‌ای ضمیمه‌شده استخراج شود."}

لطفاً بسته مطالعه کامل شامل حداقل ۵ فلش‌کارت، حداقل ۴ سوال کوییز و حداقل ۶ گره نقشه ذهنی تولید کنید.
`;
    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "";
    return this.sanitizeAndValidateJson(responseText, input, options);
  }

  /**
   * پالایش، استخراج و اعتبارسنجی خروجی JSON با مقادیر پیش‌فرض امن (ضد کرش فرانت‌اند)
   */
  static sanitizeAndValidateJson(
    rawJson: string,
    input: ParsedInputMedia,
    options?: { targetGrade?: number; preferredTopic?: string }
  ): GeneratedStudyPackContent {
    try {
      let cleaned = rawJson.trim();
      // حذف تگ‌های کد مارک‌داون
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "");
      }

      const parsed = JSON.parse(cleaned);

      return {
        title: typeof parsed.title === "string" && parsed.title ? parsed.title : "بسته مطالعه هوشمند",
        description: typeof parsed.description === "string" ? parsed.description : "بسته یادگیری تولیدشده توسط هوش مصنوعی",
        topicTag: typeof parsed.topicTag === "string" && parsed.topicTag ? parsed.topicTag : options?.preferredTopic || "مفاهیم تحلیلی",
        gradeLevel: typeof parsed.gradeLevel === "number" ? parsed.gradeLevel : options?.targetGrade || 12,
        summary: {
          overview: parsed.summary?.overview || "خلاصه مبحث آموزشی",
          keyTakeaways: Array.isArray(parsed.summary?.keyTakeaways) ? parsed.summary.keyTakeaways : ["مرور منظم مفاهیم"],
          glossary: Array.isArray(parsed.summary?.glossary)
            ? parsed.summary.glossary.map((g: any) => ({
                term: String(g.term || "مفهوم"),
                definition: String(g.definition || "تعریف"),
              }))
            : [],
        },
        flashcards: Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0
          ? parsed.flashcards.map((f: any, idx: number) => ({
              front: String(f.front || `کارت شماره ${idx + 1}`),
              back: String(f.back || "پاسخ کارت"),
              hint: f.hint ? String(f.hint) : undefined,
              topicTag: String(f.topicTag || parsed.topicTag || "عمومی"),
              difficulty: (["EASY", "MEDIUM", "HARD"].includes(f.difficulty) ? f.difficulty : "MEDIUM") as CardDifficulty,
            }))
          : this.generateDefaultFlashcards(parsed.topicTag || "عمومی"),
        quiz: {
          title: parsed.quiz?.title || "کوییز سنجش تسلط",
          description: parsed.quiz?.description || "ارزیابی آمادگی و درک مفاهیم",
          timeLimitMinutes: typeof parsed.quiz?.timeLimitMinutes === "number" ? parsed.quiz.timeLimitMinutes : 10,
          questions: Array.isArray(parsed.quiz?.questions) && parsed.quiz.questions.length > 0
            ? parsed.quiz.questions.map((q: any) => ({
                questionText: String(q.questionText || "صورت سوال"),
                type: (["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].includes(q.type) ? q.type : "MULTIPLE_CHOICE") as QuizQuestionType,
                options: Array.isArray(q.options) && q.options.length === 4 ? q.options.map(String) : ["گزینه الف", "گزینه ب", "گزینه ج", "گزینه د"],
                correctAnswer: String(q.correctAnswer || (q.options?.[0] || "گزینه الف")),
                explanation: String(q.explanation || "تحلیل آموزشی این سوال"),
                bloomLevel: (["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"].includes(q.bloomLevel)
                  ? q.bloomLevel
                  : "APPLY") as BloomTaxonomyLevel,
                topicTag: String(q.topicTag || parsed.topicTag || "عمومی"),
              }))
            : this.generateDefaultQuestions(parsed.topicTag || "عمومی"),
        },
        mindMap: {
          nodes: Array.isArray(parsed.mindMap?.nodes) && parsed.mindMap.nodes.length > 0
            ? parsed.mindMap.nodes.map((n: any, idx: number) => ({
                id: String(n.id || `node-${idx + 1}`),
                label: String(n.label || `گره ${idx + 1}`),
                description: n.description ? String(n.description) : undefined,
                category: n.category ? String(n.category) : "مفهوم",
              }))
            : [
                { id: "1", label: parsed.title || "مفهوم اصلی", category: "ریشه" },
                { id: "2", label: "کاربردها و فرمول‌ها", category: "شاخه" },
              ],
          edges: Array.isArray(parsed.mindMap?.edges) && parsed.mindMap.edges.length > 0
            ? parsed.mindMap.edges.map((e: any, idx: number) => ({
                id: String(e.id || `edge-${idx + 1}`),
                source: String(e.source || "1"),
                target: String(e.target || "2"),
                label: e.label ? String(e.label) : undefined,
              }))
            : [{ id: "e1", source: "1", target: "2", label: "ارتباط با" }],
        },
      };
    } catch (parseError) {
      console.warn("⚠ [AIStudyStudio] JSON parse failed, falling back to offline generated template:", parseError);
      return this.generateFallbackStudyPack(input, options);
    }
  }

  /**
   * موتور تولیدکننده دمو آفلاین (Fallback) با تشخیص موضوع و تضمین ساختار ۱۰۰٪ معتبر
   */
  static generateFallbackStudyPack(
    input: ParsedInputMedia,
    options?: { targetGrade?: number; preferredTopic?: string }
  ): GeneratedStudyPackContent {
    const text = input.rawText || input.fileName || "مفاهیم درسی";
    const lower = text.toLowerCase();

    // ۱. اگر مبحث ریاضی / حسابان باشد
    if (
      lower.includes("مشتق") ||
      lower.includes("حد") ||
      lower.includes("اکسترمم") ||
      lower.includes("حسابان") ||
      lower.includes("ریاضی")
    ) {
      return {
        title: "بسته مفهومی مشتق و اکسترمم‌های تابع (حسابان ۳)",
        description: "بررسی نقاط بحرانی، آزمون‌های مشتق اول و دوم و رسم نمودار با رویکرد مفهومی",
        topicTag: "مشتق و کاربردها",
        gradeLevel: options?.targetGrade || 12,
        summary: {
          overview: "مشتق نرخ تغییرات لحظه‌ای تابع و شیب خط مماس بر نمودار را بیان می‌کند. نقاط بحرانی کاندیداهای اکسترمم‌های نسبی هستند و با آزمون مشتق اول یا دوم نوع اکسترمم مشخص می‌گردد.",
          keyTakeaways: [
            "نقطه بحرانی نقطه درونی از دامنه است که $f'(c) = 0$ یا مشتق در آن وجود ندارد.",
            "اگر مشتق اول در نقطه بحرانی از مثبت به منفی تغییر علامت دهد، تابع دارای ماکزیمم نسبی است.",
            "در نقاط عطف نمودار، جهت تقعر تغییر کرده و $f''(x) = 0$ یا ناموجود است.",
          ],
          glossary: [
            { term: "نقطه بحرانی (Critical Point)", definition: "نقطه‌ای در دامنه که مشتق صفر یا تعریف‌نشده باشد." },
            { term: "آزمون مشتق دوم", definition: "اگر $f'(c)=0$ و $f''(c) < 0$ باشد، در $x=c$ ماکزیمم نسبی داریم." },
            { term: "نقطه عطف (Inflection Point)", definition: "نقطه‌ای که مماس دارد و جهت تقعر در آن عوض می‌شود." },
          ],
        },
        flashcards: [
          {
            front: "تعریف دقیق نقطه بحرانی تابع $f$ در دامنه چیست؟",
            back: "نقطه‌ای مانند $c$ در درون دامنه که $f'(c) = 0$ باشد یا $f'(c)$ وجود نداشته باشد.",
            hint: "به شیب صفر یا نقاط گوشه‌دار و مماس قائم فکر کنید.",
            topicTag: "مشتق و کاربردها",
            difficulty: "MEDIUM",
          },
          {
            front: "مشتق تابع کسری $f(x) = \\frac{u}{v}$ طبق چه رابطه‌ای به دست می‌آید؟",
            back: "$$f'(x) = \\frac{u'v - v'u}{v^2}$$",
            hint: "مشتق صورت در مخرج منهای مشتق مخرج در صورت بر توان دوم مخرج.",
            topicTag: "مشتق و کاربردها",
            difficulty: "EASY",
          },
          {
            front: "شرط لازم برای وجود اکسترمم نسبی در تابع مشتق‌پذیر (قضیه فرما) چیست؟",
            back: "اگر $f$ در $c$ اکسترمم نسبی داشته و مشتق‌پذیر باشد، حتماً $f'(c) = 0$ است.",
            hint: "شیب خط مماس در قله یا دره هموار افقی است.",
            topicTag: "مشتق و کاربردها",
            difficulty: "MEDIUM",
          },
          {
            front: "آزمون مشتق اول برای تشخیص مینیمم نسبی چگونه است؟",
            back: "مشتق قبل از نقطه منفی (نزولی) و بعد از نقطه مثبت (صعودی) باشد.",
            hint: "تغییر علامت مشتق از $-$ به $+$",
            topicTag: "مشتق و کاربردها",
            difficulty: "EASY",
          },
          {
            front: "جهت تقعر نمودار تابع چگونه توسط مشتق دوم تعیین می‌شود؟",
            back: "اگر $f''(x) > 0$ باشد تقعر رو به بالا $(\\cup)$ و اگر $f''(x) < 0$ باشد تقعر رو به پایین $(\\cap)$ است.",
            hint: "مثبت یعنی کاسه رو به بالا و خوشحال!",
            topicTag: "مشتق و کاربردها",
            difficulty: "HARD",
          },
        ],
        quiz: {
          title: "کوییز تسلط تشخیصی مشتق و نقاط بحرانی",
          description: "سنجش فهم مفهومی و مهارتی اکسترمم‌ها با تحلیل گزینه به گزینه",
          timeLimitMinutes: 10,
          questions: [
            {
              questionText: "طول نقاط بحرانی تابع $f(x) = x^3 - 3x + 2$ کدام است؟",
              type: "MULTIPLE_CHOICE",
              options: ["$x = 0$", "$x = \\pm 1$", "$x = 3$", "$x = \\pm \\sqrt{3}$"],
              correctAnswer: "$x = \\pm 1$",
              explanation: "مشتق تابع برابر $f'(x) = 3x^2 - 3$ است. با مساوی صفر قرار دادن: $3(x^2 - 1) = 0 \\implies x = \\pm 1$. هر دو نقطه در دامنه تعریف شده‌اند.",
              bloomLevel: "APPLY",
              topicTag: "مشتق و کاربردها",
            },
            {
              questionText: "آیا هر نقطه بحرانی الزماً یک اکسترمم نسبی است؟",
              type: "TRUE_FALSE",
              options: ["صحیح", "غلط", "فقط در توابع درجه سوم", "نامشخص"],
              correctAnswer: "غلط",
              explanation: "نقطه بحرانی کاندید اکسترمم است اما شرط کافی نیست؛ مانند $y = x^3$ در $x=0$ که مشتق صفر است اما اکسترمم نیست.",
              bloomLevel: "UNDERSTAND",
              topicTag: "مشتق و کاربردها",
            },
            {
              questionText: "اگر $f'(c) = 0$ و $f''(c) = -5$ باشد، نقطه $c$ چه وضعیتی دارد؟",
              type: "MULTIPLE_CHOICE",
              options: ["ماکزیمم نسبی", "مینیمم نسبی", "نقطه عطف", "نقطه بازگشتی"],
              correctAnswer: "ماکزیمم نسبی",
              explanation: "طبق آزمون مشتق دوم، وقتی مشتق اول صفر و مشتق دوم منفی باشد، تقعر رو به پایین بوده و نقطه یک ماکزیمم نسبی است.",
              bloomLevel: "ANALYZE",
              topicTag: "مشتق و کاربردها",
            },
            {
              questionText: "مشتق عبارت $y = \\sin(2x)$ در نقطه $x = 0$ برابر چند است؟",
              type: "MULTIPLE_CHOICE",
              options: ["$0$", "$1$", "$2$", "$-2$"],
              correctAnswer: "$2$",
              explanation: "مشتق زنجیره‌ای برابر $y' = 2\\cos(2x)$ است. در $x=0$ داریم: $y'(0) = 2\\cos(0) = 2 \\times 1 = 2$.",
              bloomLevel: "APPLY",
              topicTag: "مشتق و کاربردها",
            },
          ],
        },
        mindMap: {
          nodes: [
            { id: "1", label: "مفهوم مشتق $f'(x)$", category: "پایه" },
            { id: "2", label: "نقاط بحرانی ($f'=0$ یا ناموجود)", category: "کاندیدا" },
            { id: "3", label: "آزمون مشتق اول (تغییر علامت)", category: "روش تشخیص" },
            { id: "4", label: "اکسترمم‌های نسبی (ماکزیمم/مینیمم)", category: "نتیجه" },
            { id: "5", label: "مشتق دوم $f''(x)$ و تقعر", category: "هندسی" },
            { id: "6", label: "نقطه عطف و بهینه‌سازی", category: "کاربرد" },
          ],
          edges: [
            { id: "e1-2", source: "1", target: "2", label: "تعیین" },
            { id: "e2-3", source: "2", target: "3", label: "تحلیل با" },
            { id: "e3-4", source: "3", target: "4", label: "شناسایی" },
            { id: "e1-5", source: "1", target: "5", label: "مرتبه بالاتر" },
            { id: "e5-6", source: "5", target: "6", label: "منجر به" },
          ],
        },
      };
    }

    // ۲. قالب عمومی پیش‌فرض برای هر متن ورودی دیگر
    return {
      title: `بسته یادگیری هوشمند: ${text.slice(0, 40)}`,
      description: "بسته مطالعه تولیدشده بر مبنای محتوای ورودی با پشتیبانی از مرور فاصله‌دار",
      topicTag: options?.preferredTopic || "مفاهیم کلیدی",
      gradeLevel: options?.targetGrade || 12,
      summary: {
        overview: `این بسته یادگیری خلاصه‌ای ساختاریافته از مباحث «${text.slice(0, 30)}» را برای تسلط سریع و عمیق فراهم می‌آورد.`,
        keyTakeaways: [
          "درک ساختار مفهومی پیش‌نیاز تسلط بر تست‌هاست.",
          "مرور فاصله‌دار SM-2 از فراموشی در حافظه بلندمدت جلوگیری می‌کند.",
          "آزمون‌های تشخیصی نقاط کور یادگیری را آشکار می‌سازند.",
        ],
        glossary: [
          { term: "مفهوم پایه", definition: "بنیانی‌ترین اصل سرفصل که سایر گزاره‌ها بر آن استوارند." },
          { term: "مرور فعال (Active Recall)", definition: "تلاش ذهنی برای بازیابی اطلاعات پیش از مشاهده پاسخ." },
        ],
      },
      flashcards: [
        {
          front: `ایده اصلی و کلیدی در سرفصل «${text.slice(0, 25)}» چیست؟`,
          back: "شناسایی روابط بنیادین، فرمول‌های پرکاربرد و دسته‌بندی مسائل به تیپ‌های مشخص.",
          hint: "به کلیدواژه‌های اصلی متن توجه کنید.",
          topicTag: "مفاهیم کلیدی",
          difficulty: "EASY",
        },
        {
          front: "چرا مرور فلش‌کارت‌ها در فواصل افزایشی (SM-2) اثربخش‌تر است؟",
          back: "زیرا یادآوری درست در آستانه فراموشی، استحکام سیناپسی حافظه را چندین برابر می‌کند.",
          hint: "منحنی فراموشی ابینگهاوس",
          topicTag: "مفاهیم کلیدی",
          difficulty: "MEDIUM",
        },
        {
          front: "مهم‌ترین تله تستی در حل مسائل این بخش چیست؟",
          back: "توجه نکردن به دامنه تعریف و شرایط مرزی قضیه‌ها.",
          hint: "ابتدا پیش‌فرض‌ها را چک کنید.",
          topicTag: "مفاهیم کلیدی",
          difficulty: "HARD",
        },
      ],
      quiz: {
        title: "کوییز سنجش تسلط سرفصل",
        description: "ارزیابی آمادگی با شبیه‌سازی تست‌های استاندارد",
        timeLimitMinutes: 8,
        questions: [
          {
            questionText: `کدام گزینه بیانگر اصل اساسی در «${text.slice(0, 25)}» است؟`,
            type: "MULTIPLE_CHOICE",
            options: ["رویکرد تحلیلی و گام‌به‌گام", "حفظ کردن بدون اثبات", "نادیده گرفتن پیش‌نیازها", "حدس و گمان"],
            correctAnswer: "رویکرد تحلیلی و گام‌به‌گام",
            explanation: "در آموزش نوین و مدارس برتر، درک تحلیلی پیش‌نیاز حل تست‌های چندمرحله‌ای است.",
            bloomLevel: "UNDERSTAND",
            topicTag: "مفاهیم کلیدی",
          },
          {
            questionText: "آیا تسلط کامل بدون حل تمرین تشریحی امکان‌پذیر است؟",
            type: "TRUE_FALSE",
            options: ["صحیح", "غلط", "فقط در دروس عمومی", "بستگی دارد"],
            correctAnswer: "غلط",
            explanation: "حل تشریحی گام‌های استدلال ریاضی را تثبیت نموده و از خطاهای محاسباتی در تست‌ها جلوگیری می‌کند.",
            bloomLevel: "EVALUATE",
            topicTag: "مفاهیم کلیدی",
          },
        ],
      },
      mindMap: {
        nodes: [
          { id: "1", label: text.slice(0, 25) || "موضوع اصلی", category: "هسته" },
          { id: "2", label: "تعاریف اولیه", category: "پیش‌نیاز" },
          { id: "3", label: "قوانین و فرمول‌ها", category: "کاربرد" },
          { id: "4", label: "تیپ‌بندی تست‌ها", category: "ارزیابی" },
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", label: "تعریف" },
          { id: "e1-3", source: "1", target: "3", label: "استنتاج" },
          { id: "e3-4", source: "3", target: "4", label: "کاربرد در" },
        ],
      },
    };
  }

  private static generateDefaultFlashcards(topicTag: string) {
    return [
      {
        front: "تعریف مفهوم اصلی",
        back: "پاسخ تشریحی مفهوم اصلی و نکات مربوطه",
        hint: "به تعاریف ابتدای فصل رجوع کنید.",
        topicTag,
        difficulty: "EASY" as CardDifficulty,
      },
    ];
  }

  private static generateDefaultQuestions(topicTag: string) {
    return [
      {
        questionText: "کدام گزینه صحیح است؟",
        type: "MULTIPLE_CHOICE" as QuizQuestionType,
        options: ["گزینه اول (صحیح)", "گزینه دوم", "گزینه سوم", "گزینه چهارم"],
        correctAnswer: "گزینه اول (صحیح)",
        explanation: "گزینه اول به دلیل تطابق کامل با اصول علمی صحیح است.",
        bloomLevel: "UNDERSTAND" as BloomTaxonomyLevel,
        topicTag,
      },
    ];
  }
}
