"use client";

import React, { useState, useEffect } from "react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RotateCcw,
  Award,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface QuizQuestionItem {
  id: string;
  questionText: string;
  type: string;
  options?: string[] | null;
  correctAnswer: string;
  explanation: string;
  bloomLevel?: string | null;
  topicTag?: string | null;
}

export interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes?: number | null;
  questions: QuizQuestionItem[];
}

interface InteractiveQuizRunnerProps {
  quiz: QuizItem;
  studentId?: string;
  onComplete?: (result: { score: number; percentage: number; xpEarned: number }) => void;
  onBackToStudio?: () => void;
}

export const InteractiveQuizRunner: React.FC<InteractiveQuizRunnerProps> = ({
  quiz,
  studentId,
  onComplete,
  onBackToStudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [resultData, setResultData] = useState<{
    score: number;
    percentage: number;
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
    evaluation?: Record<string, any>;
  } | null>(null);

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex];
  const isCurrentRevealed = Boolean(currentQ && revealedQuestions[currentQ.id]);
  const currentSelected = currentQ ? selectedAnswers[currentQ.id] : undefined;

  // تایمر زمان سپری‌شده
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // تبدیل گزینه‌ها به آرایه در صورت رشته بودن JSON
  const getOptions = (q: QuizQuestionItem): string[] => {
    if (Array.isArray(q.options)) return q.options;
    if (typeof q.options === "string") {
      try {
        return JSON.parse(q.options);
      } catch {
        return ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"];
      }
    }
    return ["صحیح", "غلط"];
  };

  // انتخاب گزینه و نمایش آنی بازخورد (فیدبک تشخیصی لحظه‌ای)
  const handleSelectOption = (option: string) => {
    if (!currentQ || isCurrentRevealed) return;

    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
    setRevealedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  // رفتن به سوال بعدی یا پایان کوییز
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await finalizeQuiz();
    }
  };

  // نهایی‌سازی و ثبت در دیتابیس
  const finalizeQuiz = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/study-studio/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          studentId,
          answers: selectedAnswers,
          timeSpentSeconds,
          activeTimeSeconds: timeSpentSeconds,
          idleTimeSeconds: 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultData({
          score: data.attempt.score,
          percentage: data.percentage,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          xpEarned: data.xpEarned,
          evaluation: data.evaluation,
        });
        setIsFinished(true);
        if (onComplete) {
          onComplete({
            score: data.attempt.score,
            percentage: data.percentage,
            xpEarned: data.xpEarned,
          });
        }
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">هیچ سوالی در این کوییز تعریف نشده است</h3>
      </div>
    );
  }

  // =========================================================================
  // صفحه کارنامه و نتیجه نهایی کوییز
  // =========================================================================
  if (isFinished && resultData) {
    const isPassing = resultData.percentage >= 70;
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 text-white text-center space-y-6 shadow-2xl border border-indigo-700/50">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-inner">
            <Award className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black ${
                isPassing
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
              }`}
            >
              {isPassing ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {isPassing ? "تسلط کافی و موفقیت‌آمیز" : "نیازمند مرور مجدد فلش‌کارت‌ها"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">کارنامه سنجش تسلط: {quiz.title}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-2xl font-black text-amber-300">+{resultData.xpEarned}</div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">امتیاز XP</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-2xl font-black text-emerald-300">{resultData.percentage}٪</div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">درصد تسلط</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-2xl font-black text-indigo-300">
                {resultData.correctCount} از {resultData.totalQuestions}
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">پاسخ صحیح</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-2xl font-black text-cyan-300 font-mono">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">زمان آزمون</div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setSelectedAnswers({});
                setRevealedQuestions({});
                setTimeSpentSeconds(0);
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/20"
            >
              <RotateCcw className="w-4 h-4" />
              آزمون دوباره
            </button>

            {onBackToStudio && (
              <button
                type="button"
                onClick={onBackToStudio}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2"
              >
                بازگشت به استودیوی مطالعه
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* لیست مرور و تحلیل تمام سوالات */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            تحلیل گام‌به‌گام و راهنمای تشریحی سوالات آزمون
          </h3>

          {questions.map((q, idx) => {
            const studentAns = selectedAnswers[q.id];
            const isCorrect = studentAns === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-3xl border bg-white shadow-sm space-y-4 transition ${
                  isCorrect ? "border-emerald-200" : "border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                    سوال شماره {idx + 1}
                  </span>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? "پاسخ درست" : "پاسخ نادرست"}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed" dir="auto">
                  <KaTeXRenderer content={q.questionText} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1">پاسخ شما:</span>
                    <span className={`font-bold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`} dir="auto">
                      <KaTeXRenderer content={studentAns || "بدون پاسخ"} />
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-emerald-800 block mb-1">پاسخ کلیدی صحیح:</span>
                    <span className="font-bold text-emerald-950" dir="auto">
                      <KaTeXRenderer content={q.correctAnswer} />
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-indigo-700">
                      💡 تحلیل تشریحی و دام تستی:
                    </div>
                    <div className="leading-relaxed" dir="auto">
                      <KaTeXRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // صفحه اجرای سوالات کوییز (رابط گام‌به‌گام با بازخورد آنی)
  // =========================================================================
  const options = getOptions(currentQ);
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const bloomTitleFa: Record<string, string> = {
    REMEMBER: "حفظ و یادآوری",
    UNDERSTAND: "درک و فهم مفهومی",
    APPLY: "کاربرد و محاسبه",
    ANALYZE: "تحلیل و ریشه‌یابی",
    EVALUATE: "ارزیابی و داوری",
    CREATE: "خلق و ترکیب",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      {/* هدر وضعیت و پیشرفت کوییز */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            سوال {currentIndex + 1} از {questions.length}
          </span>

          {currentQ.bloomLevel && (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl">
              {bloomTitleFa[currentQ.bloomLevel] || currentQ.bloomLevel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>

          <div className="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* کارت سوال اصلی */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="text-base sm:text-lg font-black text-slate-800 leading-relaxed" dir="auto">
          <KaTeXRenderer content={currentQ.questionText} />
        </div>

        {/* گزینه‌های پاسخ با فیدبک آنی سبز/قرمز */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {options.map((opt, optIdx) => {
            const isSelected = currentSelected === opt;
            const isCorrectOption = opt.trim() === currentQ.correctAnswer.trim();

            let optionStyle =
              "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-indigo-300";

            if (isCurrentRevealed) {
              if (isCorrectOption) {
                optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30";
              } else if (isSelected && !isCorrectOption) {
                optionStyle = "bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/30";
              } else {
                optionStyle = "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60";
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isCurrentRevealed}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border-2 text-right transition font-medium flex items-center justify-between text-xs sm:text-sm leading-relaxed ${optionStyle}`}
              >
                <div className="flex items-center gap-2.5" dir="auto">
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shadow-xs">
                    {optIdx + 1}
                  </span>
                  <span>
                    <KaTeXRenderer content={opt} />
                  </span>
                </div>

                {isCurrentRevealed && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isCurrentRevealed && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* باکس آکاردئون راهنمای تشریحی و دلیل پاسخ */}
        {isCurrentRevealed && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-black text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                تحلیل آموزشی و چرایی پاسخ:
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md ${
                  currentSelected === currentQ.correctAnswer
                    ? "bg-emerald-200 text-emerald-900"
                    : "bg-rose-200 text-rose-900"
                }`}
              >
                {currentSelected === currentQ.correctAnswer ? "پاسخ شما درست بود!" : "پاسخ نادرست بود"}
              </span>
            </div>
            <div className="leading-relaxed font-sans" dir="auto">
              <KaTeXRenderer content={currentQ.explanation} />
            </div>
          </div>
        )}

        {/* دکمه رفتن به سوال بعدی */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            disabled={!isCurrentRevealed || isSubmitting}
            onClick={handleNextQuestion}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 transform active:scale-95"
          >
            {isSubmitting
              ? "در حال محاسبه نتایج..."
              : currentIndex + 1 < questions.length
              ? "سوال بعدی"
              : "مشاهده کارنامه و پایان کوییز"}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
