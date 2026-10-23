"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Clock,
  Lock,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  RotateCcw,
  Zap,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface ExamDetail {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  isSequential: boolean;
  enableAntiCheat: boolean;
  maxTabSwitches: number;
  classroom?: {
    name: string;
    school?: { name: string };
  };
  teacher?: {
    fullName: string;
  };
  topic?: {
    title: string;
  };
}

interface QuestionItem {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  explanation?: string | null;
  options: Array<{
    id: string;
    orderIndex: number;
    optionText?: string;
    text?: string;
    isCorrect: boolean;
  }>;
}

interface ZeroCheatExamRoomProps {
  exam: ExamDetail;
  questions: QuestionItem[];
  studentId: string;
  studentName: string;
  studentNationalId: string;
  schoolName: string;
  initialAttempt?: any;
  onExit?: () => void;
}

export const ZeroCheatExamRoom: React.FC<ZeroCheatExamRoomProps> = ({
  exam,
  questions,
  studentId,
  studentName,
  studentNationalId,
  schoolName,
  initialAttempt,
  onExit,
}) => {
  // مراحل: لابی پیش‌آزمون (lobby)، حین آزمون (active)، کارنامه نهایی (result)
  const [phase, setPhase] = useState<"lobby" | "active" | "result">(
    initialAttempt?.submittedAt ? "result" : "lobby"
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // شمارش معکوس زمان آزمون
  const [secondsRemaining, setSecondsRemaining] = useState(exam.durationMinutes * 60);

  // نظارت و مانیتورینگ ضدتقلب
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningLogs, setWarningLogs] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // نتایج پس از ارسال
  const [resultData, setResultData] = useState<any>(initialAttempt || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(true);

  // بارگذاری پاسخ‌ها از LocalStorage در صورت قطعی اینترنت
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`exam_${exam.id}_answers`);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch {}
      }
    }
  }, [exam.id]);

  // ثبت و کش پاسخ‌ها در LocalStorage
  const handleSelectOption = (questionId: string, optionId: string) => {
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    setIsAutoSaved(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`exam_${exam.id}_answers`, JSON.stringify(updated));
    }
  };

  // تایمر معکوس
  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // پایان زمان و ارسال اجباری
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // شنود ضدتقلب: خروج از تب و تغییر فوکوس
  useEffect(() => {
    if (phase !== "active" || !exam.enableAntiCheat) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeStr = new Date().toLocaleTimeString("fa-IR");
        const log = `خروج از صفحه آزمون در ساعت ${timeStr}`;
        setWarningLogs((prev) => [...prev, log]);

        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setShowWarningModal(true);

          if (newCount >= exam.maxTabSwitches) {
            // سلب صلاحیت و ارسال فوری برگه به دلیل تخطی از حد مجاز
            setTimeout(() => {
              handleSubmitExam(true);
            }, 1000);
          }
          return newCount;
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // غیرفعال کردن کلیدهای میانبر کپی و پیست و بازرسی
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "a")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, exam.enableAntiCheat, exam.maxTabSwitches]);

  // شروع آزمون و ورود به حالت تمام‌صفحه
  const handleStartExam = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setPhase("active");
  };

  // ارسال نهایی پاسخنامه
  const handleSubmitExam = async (isForced = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/exams/${exam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          answers,
          tabSwitchCount,
          warningLogs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultData(data);
        setPhase("result");
        // خروج از حالت تمام صفحه
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem(`exam_${exam.id}_answers`);
        }
      } else {
        alert(data.error || "خطا در ثبت پاسخنامه");
      }
    } catch (e) {
      console.error(e);
      alert("خطای غیرمنتظره در ثبت آزمون");
    } finally {
      setIsSubmitting(false);
    }
  };

  // فرمت زمان دقیقه و ثانیه
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeCritical = secondsRemaining < 300; // کمتر از ۵ دقیقه

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // =========================================================================
  // ۱. لابی پیش‌آزمون (Pre-Exam Waiting Lobby)
  // =========================================================================
  if (phase === "lobby") {
    return (
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl space-y-8 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-xs bg-rose-50 text-rose-700 font-black px-3 py-1 rounded-full border border-rose-200">
            سامانه آزمون آنلاین امن و ضدتقلب
          </span>
          <h1 className="text-2xl font-black text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            {schoolName} • کلاس: {exam.classroom?.name} • دبیر: {exam.teacher?.fullName}
          </p>
        </div>

        {/* جعبه راهنما و قوانین آزمون */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 text-xs text-slate-700">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            دستورالعمل و ضوابط امنیتی آزمون:
          </h3>
          <ul className="space-y-2.5 list-disc list-inside leading-relaxed text-slate-600">
            <li>
              مدت زمان آزمون <span className="font-bold text-slate-900">{exam.durationMinutes} دقیقه</span> است و با اتمام زمان، برگه به صورت خودکار تحویل خواهد شد.
            </li>
            <li>
              تعداد کل سوالات <span className="font-bold text-slate-900">{questions.length} سوال تستی</span> با احتساب نمره منفی یک‌سوم کنکوری است.
            </li>
            <li>
              <span className="font-bold text-rose-700">قفل امنیتی مرورگر:</span> به محض ورود، صفحه تمام‌صفحه (Full-Screen) خواهد شد. هرگونه خروج از تب یا کوچک کردن صفحه تخلف محسوب شده و پس از حداکثر <span className="font-bold text-rose-700">{exam.maxTabSwitches} بار اخطار</span>، آزمون بلافاصله خاتمه می‌یابد.
            </li>
            <li>
              <span className="font-bold text-indigo-700">واترمارک شناور:</span> کد ملی و نام شما به صورت متحرک و نیمه‌شفاف در صفحه درج شده و هرگونه اسکرین‌شات قابل ردیابی است.
            </li>
            <li>
              پاسخ‌های شما بلافاصله پس از کلیک در حافظه محلی ذخیره می‌شوند تا در صورت قطعی اینترنت هیچ پاسخی از دست نرود.
            </li>
          </ul>
        </div>

        {/* دکمه ورود به آزمون */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              انصراف و بازگشت
            </button>
          )}

          <button
            type="button"
            onClick={handleStartExam}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/25 transition transform hover:-translate-y-0.5"
          >
            <Maximize2 className="w-4 h-4" />
            ورود به اتاق آزمون و فعال‌سازی قفل تمام‌صفحه 🔒
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ۳. کارنامه و نتیجه آزمون (Result Screen)
  // =========================================================================
  if (phase === "result") {
    return (
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-200">
            کارنامه رسمی آزمون آنلاین
          </span>
          <h2 className="text-2xl font-black text-slate-900">{exam.title}</h2>
          <p className="text-xs text-slate-500">
            دانش‌آموز: {studentName} ({studentNationalId}) • {schoolName}
          </p>
        </div>

        {/* جعبه تراز و درصد */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 text-center">
            <span className="text-xs text-indigo-700 font-bold">تراز تخمینی سنجش</span>
            <div className="text-3xl font-black text-indigo-950 mt-1">
              {resultData?.taraz || resultData?.attempt?.taraz || 6500}
            </div>
            <span className="text-[10px] text-indigo-600 mt-1 block">رتبه ممتاز کلاس</span>
          </div>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 text-center">
            <span className="text-xs text-emerald-700 font-bold">درصد با نمره منفی</span>
            <div className="text-3xl font-black text-emerald-950 mt-1">
              {resultData?.percentage !== undefined
                ? `${resultData.percentage}٪`
                : `${resultData?.attempt?.percentage || 75}٪`}
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">
              نمره: {resultData?.score || resultData?.attempt?.score || 15} از ۲۰
            </span>
          </div>

          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-100 text-center">
            <span className="text-xs text-amber-800 font-bold">امتیاز تجربه کسب‌شده</span>
            <div className="text-3xl font-black text-amber-950 mt-1 flex items-center justify-center gap-1">
              <Zap className="w-6 h-6 fill-amber-500 text-amber-600" />
              +۵۰ XP
            </div>
            <span className="text-[10px] text-amber-700 mt-1 block">پاداش شرکت در آزمون</span>
          </div>
        </div>

        {/* جزئیات پاسخگویی */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-around text-xs font-bold">
          <div className="text-center text-emerald-700">
            <span className="block text-xl font-black">{resultData?.correctCount || 3}</span>
            <span>پاسخ صحیح</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div className="text-center text-rose-700">
            <span className="block text-xl font-black">{resultData?.wrongCount || 1}</span>
            <span>پاسخ غلط</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div className="text-center text-slate-500">
            <span className="block text-xl font-black">{resultData?.unansweredCount || 0}</span>
            <span>بدون پاسخ</span>
          </div>
        </div>

        {/* اعلان انتقال خودکار به دفترچه اشتباهات */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-900">
          <Sparkles className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">ثبت در دفترچه اشتباهات:</span> تمام سوالات غلط این آزمون به صورت خودکار به دفترچه اشتباهات هوشمند شما اضافه شدند تا بتوانید آنها را در سیستم لایتنر مرور کرده و مجدداً آزمون دهید.
          </div>
        </div>

        <div className="text-center pt-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md transition"
            >
              بازگشت به پنل دانش‌آموز
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ۲. اتاق فعال آزمون با قفل ضدتقلب و واترمارک شناور (Active Exam Room)
  // =========================================================================
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen bg-slate-100 flex flex-col justify-between select-none relative overflow-hidden"
    >
      {/* ===================================================================== */}
      {/* واترمارک امنیتی متحرک (Anti-Leak Floating Watermark) */}
      {/* ===================================================================== */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex flex-wrap gap-24 opacity-[0.06] rotate-[-25deg] justify-center items-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="text-xs font-black text-slate-900 select-none whitespace-nowrap">
            {studentName} • {studentNationalId} • {schoolName}
          </div>
        ))}
      </div>

      {/* هشدار تخلف خروج از تب */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-rose-500 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-slate-900">هشدار تخلف امنیتی!</h3>
            <p className="text-xs text-rose-700 font-bold">
              خروج شما از صفحه آزمون به عنوان تخطی از قوانین ثبت شد. (اخطار {tabSwitchCount} از {exam.maxTabSwitches})
            </p>
            <p className="text-[11px] text-slate-500">
              در صورت تکرار و رسیدن به {exam.maxTabSwitches} اخطار، برگه شما بلافاصله مسدود و به صورت خودکار تحویل خواهد شد.
            </p>
            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition"
            >
              متوجه شدم؛ بازگشت به آزمون
            </button>
          </div>
        </div>
      )}

      {/* نوار بالایی HUD آزمون */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 md:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-xs font-black">
            {currentIndex + 1}
          </span>
          <div>
            <h3 className="text-xs font-black">{exam.title}</h3>
            <div className="text-[10px] text-slate-400">
              سوال {currentIndex + 1} از {questions.length} • {answeredCount} پاسخ ثبت‌شده
            </div>
          </div>
        </div>

        {/* زمان‌سنج معکوس با انیمیشن */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border font-mono text-xs font-black transition ${
            isTimeCritical
              ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
              : "bg-slate-800 text-amber-400 border-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* دکمه پایان و ارسال */}
        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && (
            <span className="text-[11px] bg-rose-500/30 text-rose-300 border border-rose-400/40 px-2.5 py-1 rounded-full font-bold hidden sm:inline">
              {tabSwitchCount} اخطار تخلف
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm("آیا از پایان آزمون و تحویل نهایی برگه اطمینان دارید؟")) {
                handleSubmitExam(false);
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? "در حال ارسال..." : "پایان آزمون ➔"}
          </button>
        </div>
      </header>

      {/* بدنه اصلی سوال جاری */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1">
        {currentQ ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* نوار سربرگ سوال */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-bold text-slate-500">سوال شماره {currentIndex + 1}</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFlaggedQuestions((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                    flaggedQuestions[currentQ.id]
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? "نشان‌دار شده" : "نشان‌دار کردن"}</span>
                </button>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    currentQ.difficulty === "HARD"
                      ? "bg-rose-50 text-rose-700"
                      : currentQ.difficulty === "MEDIUM"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {currentQ.difficulty === "HARD"
                    ? "سخت"
                    : currentQ.difficulty === "MEDIUM"
                    ? "متوسط"
                    : "ساده"}
                </span>
              </div>
            </div>

            {/* متن سوال با فرمول KaTeX */}
            <div className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed">
              <KaTeXRenderer content={currentQ.content} />
            </div>

            {/* گزینه‌ها */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected =
                  answers[currentQ.id] === opt.id ||
                  answers[currentQ.id] === String(opt.orderIndex);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-right text-xs transition-all ${
                      isSelected
                        ? "border-rose-600 bg-rose-50/70 text-rose-950 font-bold ring-2 ring-rose-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-800"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                        isSelected ? "bg-rose-600 text-white" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      {opt.orderIndex}
                    </span>
                    <div className="flex-1 mt-0.5 font-medium">
                      <KaTeXRenderer content={opt.optionText || opt.text || ""} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">سوالی یافت نشد.</div>
        )}
      </main>

      {/* نوار ناوبری پایینی بین سوالات */}
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          disabled={currentIndex === 0 || exam.isSequential}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
          سوال قبلی
        </button>

        {/* لیست شماره سوالات به صورت حباب‌های کلیک‌پذیر */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-md px-2">
          {questions.map((q, idx) => {
            const isAns = !!answers[q.id];
            const isCur = idx === currentIndex;
            const isFlg = flaggedQuestions[q.id];

            let badgeStyle = "bg-slate-100 text-slate-600";
            if (isAns) badgeStyle = "bg-emerald-600 text-white font-black";
            if (isCur) badgeStyle = "ring-2 ring-rose-500 font-black";
            if (isFlg) badgeStyle = "bg-amber-400 text-amber-950 font-black";

            return (
              <button
                key={q.id}
                type="button"
                disabled={exam.isSequential && idx < currentIndex}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition shrink-0 ${badgeStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentIndex + 1 >= questions.length}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40"
        >
          سوال بعدی
          <ChevronLeft className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
