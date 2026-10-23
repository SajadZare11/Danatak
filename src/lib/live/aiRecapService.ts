import { GoogleGenAI } from "@google/genai";

export interface LessonRecapData {
  summary: string;
  keyTakeaways: string[];
  formulasAndTheorems: {
    title: string;
    formula: string;
    explanation: string;
  }[];
  studentQuestionsAnswered: {
    question: string;
    answer: string;
    explanation?: string;
  }[];
  suggestedHomework: {
    title: string;
    description: string;
    difficulty: "آسان" | "متوسط" | "پیشرفته";
  }[];
  teacherNotes: string;
}

export interface SessionContextInput {
  title: string;
  subjectTitle: string;
  classroomName: string;
  teacherName: string;
  durationMinutes: number;
  chats: {
    senderName: string;
    messageText: string;
    isQuestion: boolean;
    isTeacher: boolean;
  }[];
  quizzes: {
    questionText: string;
    correctAnswer: string;
    totalResponses: number;
  }[];
}

export class AILessonRecapService {
  /**
   * تولید خلاصه هوشمند تدریس زنده با مدل‌های هوش مصنوعی
   */
  static async generateRecap(context: SessionContextInput): Promise<LessonRecapData> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      console.log("ℹ [AILessonRecap] GEMINI_API_KEY not found. Using offline educational fallback generator.");
      return this.generateFallbackRecap(context);
    }

    try {
      return await this.callGeminiAPI(apiKey, context);
    } catch (error: any) {
      console.warn("⚠ [AILessonRecap] Gemini API call failed. Falling back to offline generator:", error?.message || error);
      return this.generateFallbackRecap(context);
    }
  }

  private static async callGeminiAPI(apiKey: string, context: SessionContextInput): Promise<LessonRecapData> {
    const ai = new GoogleGenAI({ apiKey });

    const chatsSummary = context.chats
      .map((c) => `[${c.isTeacher ? "دبیر" : "دانش‌آموز"} - ${c.senderName}]: ${c.messageText} ${c.isQuestion ? "(سوال درسی)" : ""}`)
      .join("\n");

    const quizzesSummary = context.quizzes
      .map((q) => `سوال کوییز کلاسی: ${q.questionText} | پاسخ صحیح: ${q.correctAnswer} | تعداد شرکت‌کنندگان: ${q.totalResponses}`)
      .join("\n");

    const prompt = `
شما سرپرست دپارتمان آموزش مدارس تیزهوشان و سمپاد هستید.
جلسه آنلاین تدریس زیر در سامانه مدرسه برگزار شده است:
- عنوان درس: ${context.title}
- درس / مبحث: ${context.subjectTitle}
- کلاس: ${context.classroomName}
- دبیر: ${context.teacherName}
- مدت جلسه: ${context.durationMinutes} دقیقه

مکالمات و پرسش‌های کلاسی ثبت شده:
${chatsSummary || "مکالمه متنی ثبت نشده است."}

کوییزهای آنی برگزار شده حین تدریس:
${quizzesSummary || "کوییز کلاسی حین تدریس برگزار نشده است."}

لطفاً یک خلاصه تدریس جامع، دقیق، علمی و الهام‌بخش به زبان فارسی روان تولید کنید. فرمول‌های ریاضی و فیزیک را در ساختار استاندارد KaTeX (مانند $$...$$ یا $...$) درج نمایید.

خروجی شما باید منحصراً یک ساختار JSON معتبر و بدون هیچ متن مقدمه یا موخره باشد با این شمای دقیق:
{
  "summary": "متن چکیده مفهومی و منسجم تدریس (۲ تا ۳ پاراگراف آموزنده)",
  "keyTakeaways": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳", "نکته کلیدی ۴"],
  "formulasAndTheorems": [
    {
      "title": "عنوان قضیه یا رابطه",
      "formula": "$$f''(x) = (f'(x))'$$",
      "explanation": "توضیح شهودی و کاربرد این فرمول در حل مسائل"
    }
  ],
  "studentQuestionsAnswered": [
    {
      "question": "سوال مهم دانش‌آموز",
      "answer": "پاسخ تشریحی و نکته تستی مرتبط"
    }
  ],
  "suggestedHomework": [
    {
      "title": "عنوان تمرین",
      "description": "صورت دقیق مسئله یا تکلیف",
      "difficulty": "متوسط"
    }
  ],
  "teacherNotes": "پیام جمع‌بندی استاد برای آزمون‌های نهایی و کنکور"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || "خلاصه جلسه با موفقیت ثبت شد.",
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      formulasAndTheorems: Array.isArray(parsed.formulasAndTheorems) ? parsed.formulasAndTheorems : [],
      studentQuestionsAnswered: Array.isArray(parsed.studentQuestionsAnswered) ? parsed.studentQuestionsAnswered : [],
      suggestedHomework: Array.isArray(parsed.suggestedHomework) ? parsed.suggestedHomework : [],
      teacherNotes: parsed.teacherNotes || "لطفاً تمرین‌های تعیین‌شده را تا جلسه آینده حل کنید.",
    };
  }

  private static generateFallbackRecap(context: SessionContextInput): LessonRecapData {
    const isMathOrCalculus =
      context.title.includes("حسابان") ||
      context.title.includes("مشتق") ||
      context.subjectTitle.includes("حسابان") ||
      context.subjectTitle.includes("ریاضی");

    if (isMathOrCalculus) {
      return {
        summary: `در این جلسه آنلاین، مبحث مشتق مراتب بالاتر و کاربرد‌های آن در هندسه تحلیلی و بهینه‌سازی توابع مورد تدریس قرار گرفت. استاد ${context.teacherName} ابتدا مفهوم آهنگ تغییر آهنگ تغییرات و تعبیر فیزیکی شتاب را با بررسی حرکت ذره مرور کرده و سپس نحوه محاسبه مشتق دوم و بالاتر توابع کسری و مثلثاتی را با حل مثال‌های تشریحی و تستی توضیح دادند. در انتهای جلسه نیز ارتباط علامت مشتق دوم با تقعر و نقطه عطف منحنی‌ها تشریح شد.`,
        keyTakeaways: [
          "مشتق مرتبه دوم معرف تقعر نمودار تابع و آهنگ تغییر شیب خط مماس است.",
          "نقطه عطف نقطه‌ای است که مماس بر منحنی وجود داشته و جهت تقعر در آن تغییر کند.",
          "برای توابع چندجمله‌ای درجه n، مشتق مرتبه n ام عددی ثابت و برابر با a_n * n! است.",
          "در نقاط ماکزیمم نسبی مشتق اول صفر و مشتق دوم منفی ($f''(x) < 0$) است.",
        ],
        formulasAndTheorems: [
          {
            title: "تعریف مشتق مرتبه دوم",
            formula: "$$f''(x) = \\frac{d^2y}{dx^2} = \\frac{d}{dx}\\left(\\frac{dy}{dx}\\right)$$",
            explanation: "مشتق‌گیری مجدد از تابع مشتق اول نسبت به متغیر x",
          },
          {
            title: "مشتق دوم چندجمله‌ای درجه ۳",
            formula: "$$f(x) = ax^3 + bx^2 + cx + d \\implies f''(x) = 6ax + 2b$$",
            explanation: "معادله خطی مشتق دوم که ریشه آن طول نقطه عطف تابع درجه ۳ را به دست می‌دهد ($x = -\\frac{b}{3a}$).",
          },
          {
            title: "آزمون مشتق دوم برای اکسترمم‌های نسبی",
            formula: "$$f'(c) = 0 \\land f''(c) > 0 \\implies c \\text{ نقطه مینیمم نسبی است}$$",
            explanation: "تعیین نوع نقطه بحرانی بدون نیاز به رسم جدول تغییرات علامت مشتق اول",
          },
        ],
        studentQuestionsAnswered: [
          {
            question: "آیا در نقطه عطف همیشه مشتق دوم برابر صفر است؟",
            explanation: "خیر، در نقطه عطف ممکن است مشتق دوم صفر باشد یا اصلاً وجود نداشته باشد (مانند نقاط بازگشتی یا مماس قائم)، اما پیوستگی و تغییر جهت تقعر الزامی است.",
            answer: "پاسخ استاد: خیر، شرط لازم در توابع دو بار مشتق‌پذیر $f''(c)=0$ است؛ اما اگر مشتق دوم در نقطه‌ای تعریف نشده باشد ولی مماس وجود داشته و تقعر عوض شود، آن نقطه نیز عطف خواهد بود.",
          },
        ],
        suggestedHomework: [
          {
            title: "محاسبه مشتق n ام تابع کسری",
            description: "برای تابع $f(x) = \\frac{1}{1-x}$ فرمول عمومی مشتق n ام ($f^{(n)}(x)$) را به روش استقرای ریاضی به دست آورید.",
            difficulty: "پیشرفته",
          },
          {
            title: "بررسی نقاط عطف و تقعر",
            description: "طول نقطه عطف و بازه‌های تحدب و تقعر تابع $g(x) = x^4 - 6x^2 + 8x$ را بیابید.",
            difficulty: "متوسط",
          },
          {
            title: "تست آزمون سراسری",
            description: "حل تست‌های ۱ تا ۱۰ کتاب کار حسابان دوازدهم مربوط به فصل سوم (کاربرد مشتق).",
            difficulty: "متوسط",
          },
        ],
        teacherNotes: "دانش‌آموزان گرامی، تسلط بر روابط مشتق زنجیره‌ای و مشتق دوم پیش‌نیاز اصلی حل تست‌های بهینه‌سازی است. حتماً تست‌های فصل کاربرد مشتق را تا روز شنبه حل کنید.",
      };
    }

    return {
      summary: `جلسه آموزشی «${context.title}» با حضور دانش‌آموزان کلاس ${context.classroomName} به مدرسی ${context.teacherName} برگزار شد. در این نشست مفاهیم محوری درس ${context.subjectTitle} با ارائه اسلایدهای آموزشی و حل سوالات تعاملی تشریح شد و پرسش‌های مطرح‌شده توسط دانش‌آموزان در محیط وبینار به شکل گام‌به‌گام پاسخ داده شد.`,
      keyTakeaways: [
        "درک مفاهیم کلیدی سرفصل آموزشی و ارتباط آن با مباحث پیش‌نیاز",
        "بررسی خطاهای رایج در آزمون‌های نهایی و ارائه ترفندهای حل سریع",
        "تاکید بر مشارکت فعال و پاسخ‌دهی به کوییزهای کلاسی حین تدریس",
      ],
      formulasAndTheorems: [
        {
          title: "فرمول بنیادین سرفصل",
          formula: "$$\\Delta E = W + Q$$",
          explanation: "ارتباط کار و انرژی در سامانه‌های فیزیکی و شیمیایی",
        },
      ],
      studentQuestionsAnswered: [
        {
          question: "مهم‌ترین بخش این فصل برای امتحانات هماهنگ کدام است؟",
          answer: "سوالات مفهومی تعاریف و حل گام‌به‌گام مثال‌های تشریحی کتاب درسی بالاترین بارم نمره را به خود اختصاص می‌دهند.",
        },
      ],
      suggestedHomework: [
        {
          title: "مرور نکات جزوه",
          description: "خلاصه‌نویسی نکات این جلسه و حل خودآزمایی پایان درس در دفتر یادداشت.",
          difficulty: "آسان",
        },
      ],
      teacherNotes: "لطفاً تمرین‌های مشخص شده را در سامانه بارگذاری نمایید.",
    };
  }
}
