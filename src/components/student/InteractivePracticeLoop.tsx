"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  ChevronDown,
  Check,
  Zap,
  Target,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface PracticeOption {
  id: string;
  orderIndex: number;
  text: string;
  isCorrect: boolean;
}

interface PracticeQuestion {
  id: string;
  questionText: string;
  type: string;
  difficulty: string;
  solution?: string | null;
  options: PracticeOption[];
  topic?: {
    id: string;
    title: string;
    textbook?: {
      title: string;
    };
  };
}

interface InteractivePracticeLoopProps {
  initialTopicId?: string;
  studentId: string;
  onFinishRound?: (score: number, total: number, earnedXP: number) => void;
}

export const InteractivePracticeLoop: React.FC<InteractivePracticeLoopProps> = ({
  initialTopicId = "ALL",
  studentId,
  onFinishRound,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // وضعیت پاسخ سوال جاری
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // آمارهای گیمیفیکیشن این دور
  const [streak, setStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const fetchQuestions = async (tId: string) => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswerRevealed(false);
    setShowExplanation(false);
    setRoundCompleted(false);
    setCorrectCount(0);
    setSessionXP(0);
    setStreak(0);

    try {
      const url = tId && tId !== "ALL" ? `/api/practice?topicId=${tId}` : "/api/practice";
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Failed to load practice questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(selectedTopicId);
  }, [selectedTopicId]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (opt: PracticeOption) => {
    if (isAnswerRevealed) return;

    setSelectedOptionId(opt.id);
    setIsAnswerRevealed(true);

    if (opt.isCorrect) {
      setStreak((s) => s + 1);
      setSessionXP((xp) => xp + 5);
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setShowExplanation(true); // نمایش خودکار راه‌حل در صورت پاسخ غلط
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerRevealed(false);
      setShowExplanation(false);
    } else {
      setRoundCompleted(true);
      if (onFinishRound) {
        onFinishRound(correctCount + (selectedOptionId && questions[currentIndex]?.options.find(o => o.id === selectedOptionId)?.isCorrect ? 0 : 0), questions.length, sessionXP);
      }
    }
  };

  const handleRestart = () => {
    fetchQuestions(selectedTopicId);
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال بارگذاری بسته تمرین هوشمند...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-slate-800">سوال تمرینی فعالی برای این مبحث یافت نشد</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          لطفاً از منوی زیر مبحث دیگری را انتخاب کنید یا به دبیر خود اطلاع دهید تا سوالات جدید ثبت نماید.
        </p>
        <button
          type="button"
          onClick={() => setSelectedTopicId("ALL")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          مشاهده تمام مباحث
        </button>
      </div>
    );
  }

  // =========================================================================
  // صفحه خلاصه دور تمرینی پس از اتمام ۱۰ سوال (Round Completed)
  // =========================================================================
  if (roundCompleted) {
    const accuracy = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
          <Award className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-200">
            تمرین تا ۲۰ با موفقیت تکمیل شد!
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            نتیجه دور تمرینی: {correctCount} از {questions.length} پاسخ صحیح
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            دقت شما در این دور <span className="font-bold text-indigo-700">{accuracy}٪</span> بوده است.
          </p>
        </div>

        {/* جعبه جوایز و XP */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-700 font-bold">امتیاز کسب‌شده</span>
            <div className="text-2xl font-black text-indigo-950 mt-1 flex items-center justify-center gap-1">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              +{sessionXP} XP
            </div>
          </div>

          <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-100">
            <span className="text-xs text-orange-700 font-bold">بیشترین زنجیره</span>
            <div className="text-2xl font-black text-orange-950 mt-1 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              {streak} متوالی
            </div>
          </div>
        </div>

        {/* دکمه‌های اقدام */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleRestart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-black shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" />
            شروع یک دور تمرینی جدید
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // حلقه فعال تمرین (Active Question Card)
  // =========================================================================
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* نوار هد HUD تمرین (گیمیفیکیشن ایندورا) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* نشانگر شماره سوال */}
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
            {currentIndex + 1}
          </span>
          <div>
            <div className="text-xs font-black text-slate-800">
              سوال {currentIndex + 1} از {questions.length}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {currentQuestion.topic?.title || "حسابان و ریاضی ۳"}
            </div>
          </div>
        </div>

        {/* نوار پیشرفت دور */}
        <div className="flex-1 max-w-xs hidden sm:block bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* مدال‌های تجربه و زنجیره */}
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-black border border-orange-200 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{streak} زنجیره</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-black border border-amber-200">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>+{sessionXP} XP</span>
          </div>
        </div>
      </div>

      {/* کارت سوال اصلی با فیدبک آنی */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* سختی و منبع سوال */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            تمرین مهارت‌محور «تمرین تا ۲۰»
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              currentQuestion.difficulty === "HARD"
                ? "bg-rose-50 text-rose-700"
                : currentQuestion.difficulty === "MEDIUM"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            سطح:{" "}
            {currentQuestion.difficulty === "HARD"
              ? "دشوار"
              : currentQuestion.difficulty === "MEDIUM"
              ? "متوسط"
              : "ساده"}
          </span>
        </div>

        {/* صورت سوال KaTeX */}
        <div className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed">
          <KaTeXRenderer content={currentQuestion.questionText} />
        </div>

        {/* گزینه‌ها با پاسخ آنی و تغییر رنگ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.isCorrect;

            let btnStyle = "border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-800";

            if (isAnswerRevealed) {
              if (isCorrect) {
                // گزینه صحیح همواره سبز می‌شود
                btnStyle =
                  "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30";
              } else if (isSelected && !isCorrect) {
                // اگر کاربر گزینه غلط را انتخاب کرده بود
                btnStyle =
                  "border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/30 animate-shake";
              } else {
                btnStyle = "border-slate-100 opacity-60 text-slate-400";
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswerRevealed}
                onClick={() => handleSelectOption(opt)}
                className={`flex items-start gap-3 p-4 rounded-2xl border text-right text-xs transition-all ${btnStyle}`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                    isAnswerRevealed && isCorrect
                      ? "bg-emerald-600 text-white"
                      : isAnswerRevealed && isSelected && !isCorrect
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {opt.orderIndex}
                </span>

                <div className="flex-1 mt-0.5 font-medium">
                  <KaTeXRenderer content={opt.text} />
                </div>

                {isAnswerRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswerRevealed && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* فیدبک پس از انتخاب گزینه */}
        {isAnswerRevealed && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            {/* بنر نتیجه این سوال */}
            {questions[currentIndex].options.find((o) => o.id === selectedOptionId)?.isCorrect ? (
              <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 px-4 py-3 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>آفرین! پاسخ شما کاملاً درست است.</span>
                </div>
                <span className="text-xs bg-emerald-200/60 text-emerald-950 font-black px-2.5 py-0.5 rounded-full">
                  +۵ XP
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-rose-50 text-rose-900 px-4 py-3 rounded-2xl border border-rose-200">
                <div className="flex items-center gap-2 text-xs font-black">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>پاسخ صحیح گزینه مشخص‌شده با رنگ سبز است.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs text-rose-800 underline font-bold"
                >
                  {showExplanation ? "بستن راهنما" : "مشاهده راه حل"}
                </button>
              </div>
            )}

            {/* آکاردئون راهنمای تشریحی و فرمول طلایی */}
            {currentQuestion.solution && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    تحلیل آموزشی و فرمول حل این سوال
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showExplanation ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showExplanation && (
                  <div className="mt-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-800 leading-relaxed animate-in fade-in">
                    <KaTeXRenderer content={currentQuestion.solution} />
                  </div>
                )}
              </div>
            )}

            {/* دکمه حرکت به سوال بعدی */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
              >
                <span>
                  {currentIndex + 1 < questions.length ? "سوال بعدی ➔" : "مشاهده نتیجه دور 🏆"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
