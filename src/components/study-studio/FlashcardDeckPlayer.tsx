"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { SM2Engine } from "@/lib/study-studio/sm2";
import { CardRating, CardDifficulty } from "@/lib/study-studio/types";
import {
  RotateCw,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  Repeat,
  Volume2,
} from "lucide-react";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  topicTag?: string | null;
  difficulty?: string;
  progress?: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    lapseCount: number;
    nextReviewDate: string;
  } | null;
}

interface FlashcardDeckPlayerProps {
  cards: FlashcardItem[];
  studentId?: string;
  packTitle?: string;
  onFinish?: (reviewedCount: number, xpEarned: number) => void;
  onTakeQuiz?: () => void;
}

export const FlashcardDeckPlayer: React.FC<FlashcardDeckPlayerProps> = ({
  cards,
  studentId,
  packTitle = "بسته یادگیری",
  onFinish,
  onTakeQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Record<string, CardRating>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastReviewResult, setLastReviewResult] = useState<string | null>(null);

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  // وضعیت پیش‌فرض SM-2 برای کارت جاری
  const currentCardState = {
    easinessFactor: currentCard?.progress?.easinessFactor || 2.5,
    interval: currentCard?.progress?.interval || 0,
    repetitions: currentCard?.progress?.repetitions || 0,
    lapseCount: currentCard?.progress?.lapseCount || 0,
  };

  // فواصل پیش‌بینی‌شده برای نمایش بر روی هر یک از دکمه‌های ۴گانه
  const estimatedIntervals = SM2Engine.getEstimatedIntervals(currentCardState);

  // چرخش کارت
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // ثبت ارزیابی و امتیاز SM-2
  const handleRating = async (rating: CardRating) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // ارسال به سرور جهت ذخیره در دیتابیس
      const res = await fetch("/api/study-studio/cards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          studentId,
          rating,
        }),
      });

      const data = await res.json();
      if (data.success && data.sm2Result) {
        setLastReviewResult(`مرور بعدی: ${data.sm2Result.intervalDisplayFa}`);
      }

      setReviewedCards((prev) => ({ ...prev, [currentCard.id]: rating }));

      // رفتن به کارت بعدی یا پایان
      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
        if (onFinish) {
          const totalReviewed = Object.keys(reviewedCards).length + 1;
          const xp = totalReviewed * 5;
          onFinish(totalReviewed, xp);
        }
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ناوبری با کلیدهای میانبر کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === "1") handleRating(1);
        else if (e.key === "2") handleRating(2);
        else if (e.key === "3") handleRating(3);
        else if (e.key === "4") handleRating(4);
      } else {
        if (e.key === "ArrowLeft" && currentIndex + 1 < cards.length) {
          setIsFlipped(false);
          setShowHint(false);
          setCurrentIndex((prev) => prev + 1);
        } else if (e.key === "ArrowRight" && currentIndex > 0) {
          setIsFlipped(false);
          setShowHint(false);
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFlipped, isCompleted, cards.length, handleFlip]);

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">هیچ فلش‌کارتی در این بسته یافت نشد</h3>
        <p className="text-xs text-slate-500">می‌توانید با دکمه ایجاد بسته، کارت‌های جدید با هوش مصنوعی تولید کنید.</p>
      </div>
    );
  }

  // صفحه پایانی جلسه مرور فلش‌کارت‌ها
  if (isCompleted) {
    const totalReviewed = Object.keys(reviewedCards).length;
    const xpEarned = totalReviewed * 5;

    return (
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 text-white text-center space-y-6 shadow-2xl border border-indigo-700/50">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-inner">
          <Award className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4" />
            مرور فاصله‌دار SM-2 تکمیل شد!
          </span>
          <h2 className="text-2xl font-black">آفرین! کارت‌های این نوبت مرور شدند</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            الگوریتم SuperMemo-2 تاریخ‌های مرور بعدی کارت‌ها را در حافظه بلندمدت ثبت کرد تا مانع از فراموشی شود.
          </p>
        </div>

        <div className="grid grid-cols-2 max-w-xs mx-auto gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-2xl font-black text-amber-300">+{xpEarned}</div>
            <div className="text-[11px] text-slate-300 font-bold mt-0.5">امتیاز XP کسب‌شده</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-2xl font-black text-emerald-300">{totalReviewed}</div>
            <div className="text-[11px] text-slate-300 font-bold mt-0.5">کارت مرورشده</div>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setIsFlipped(false);
              setReviewedCards({});
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/20"
          >
            <Repeat className="w-4 h-4" />
            مرور دوباره از اول
          </button>

          {onTakeQuiz && (
            <button
              type="button"
              onClick={onTakeQuiz}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              شرکت در کوییز این بسته
            </button>
          )}
        </div>
      </div>
    );
  }

  const difficultyColor =
    currentCard.difficulty === "HARD"
      ? "bg-rose-100 text-rose-800 border-rose-300"
      : currentCard.difficulty === "EASY"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : "bg-amber-100 text-amber-800 border-amber-300";

  return (
    <div className="space-y-6 max-w-3xl mx-auto select-none">
      {/* نوار پیشرفت و وضعیت بالا */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            کارت {currentIndex + 1} از {cards.length}
          </span>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[200px] sm:max-w-xs">
            {currentCard.topicTag || packTitle}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${difficultyColor}`}>
            {currentCard.difficulty === "HARD" ? "سخت" : currentCard.difficulty === "EASY" ? "آسان" : "متوسط"}
          </span>
        </div>

        {/* نوار پیشرفت باریک */}
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-500">{progressPercent}٪</span>
        </div>
      </div>

      {/* نگهدارنده کارت سه‌بعدی با انیمیشن چرخش ۳۶۰ درجه */}
      <div
        className="w-full h-80 sm:h-96 cursor-pointer [perspective:1200px]"
        onClick={handleFlip}
      >
        <div
          className={`w-full h-full relative duration-500 rounded-3xl transition-transform [transform-style:preserve-3d] shadow-xl ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* =================================================== */}
          {/* روی کارت (FRONT) */}
          {/* =================================================== */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 flex flex-col justify-between [backface-visibility:hidden] shadow-md hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                روی کارت (صورت سوال یا فرمول)
              </span>

              {currentCard.hint && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((prev) => !prev);
                  }}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl font-bold transition"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHint ? "بستن راهنما" : "راهنما"}
                </button>
              )}
            </div>

            {/* محتوای متن روی کارت همراه با فرمول KaTeX */}
            <div className="my-auto text-center px-4 space-y-4">
              <div className="text-lg sm:text-2xl font-black text-slate-800 leading-relaxed font-sans" dir="auto">
                <KaTeXRenderer content={currentCard.front} />
              </div>

              {showHint && currentCard.hint && (
                <div
                  className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 max-w-md mx-auto text-right font-medium animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  💡 <strong>راهنما:</strong> {currentCard.hint}
                </div>
              )}
            </div>

            {/* فوتر راهنمای چرخش */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                برای مشاهده پاسخ کلیک کنید یا کلید Space را بزنید
              </span>
              <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">Space ↵</span>
            </div>
          </div>

          {/* =================================================== */}
          {/* پشت کارت (BACK) */}
          {/* =================================================== */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-600 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span className="font-bold flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                پشت کارت (پاسخ و مفهوم کلیدی)
              </span>
              <span className="text-[11px] bg-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-200">
                ضریب سهولت: {currentCardState.easinessFactor}
              </span>
            </div>

            {/* محتوای پشت کارت */}
            <div className="my-auto text-center px-4 space-y-3">
              <div className="text-base sm:text-xl font-bold text-slate-100 leading-relaxed font-sans" dir="auto">
                <KaTeXRenderer content={currentCard.back} />
              </div>
            </div>

            {/* فوتر پشت کارت */}
            <div className="text-center text-xs text-indigo-300 pt-3 border-t border-indigo-800/60">
              سطح تسلط خود را برای زمان‌بندی مرور بعدی مشخص کنید:
            </div>
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* دکمه‌های ۴ گانه ارزیابی هوشمند SM-2 */}
      {/* =================================================== */}
      {isFlipped ? (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>چقدر خوب این کارت را به خاطر داشتید؟</span>
            <span className="text-slate-400 font-mono text-[11px]">کلیدهای ۱ تا ۴ روی کیبورد</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* دکمه ۱: دوباره */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(1)}
              className="group p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-400 text-rose-900 text-center transition flex flex-col justify-between shadow-sm active:scale-95"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 text-[10px] flex items-center justify-center font-mono">
                    1
                  </span>
                  دوباره
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-200/60 px-1.5 py-0.5 rounded">
                  {estimatedIntervals[1]}
                </span>
              </div>
              <span className="text-[11px] text-rose-700 mt-2 font-medium">فراموش کردم</span>
            </button>

            {/* دکمه ۲: سخت */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(2)}
              className="group p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 text-orange-900 text-center transition flex flex-col justify-between shadow-sm active:scale-95"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-orange-200 text-orange-800 text-[10px] flex items-center justify-center font-mono">
                    2
                  </span>
                  سخت
                </span>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-200/60 px-1.5 py-0.5 rounded">
                  {estimatedIntervals[2]}
                </span>
              </div>
              <span className="text-[11px] text-orange-700 mt-2 font-medium">با تلاش زیاد</span>
            </button>

            {/* دکمه ۳: خوب */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(3)}
              className="group p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-900 text-center transition flex flex-col justify-between shadow-sm active:scale-95"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center font-mono">
                    3
                  </span>
                  خوب
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                  {estimatedIntervals[3]}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 mt-2 font-medium">با درنگ کوتاه</span>
            </button>

            {/* دکمه ۴: آسان */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(4)}
              className="group p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 text-blue-900 text-center transition flex flex-col justify-between shadow-sm active:scale-95"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-mono">
                    4
                  </span>
                  آسان
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-200/60 px-1.5 py-0.5 rounded">
                  {estimatedIntervals[4]}
                </span>
              </div>
              <span className="text-[11px] text-blue-700 mt-2 font-medium">فوری و مسلط</span>
            </button>
          </div>
        </div>
      ) : (
        /* دکمه راهنما قبل از چرخش */
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-500">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              setIsFlipped(false);
              setShowHint(false);
              setCurrentIndex((prev) => Math.max(0, prev - 1));
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            <ChevronRight className="w-4 h-4" />
            کارت قبلی
          </button>

          <button
            type="button"
            onClick={handleFlip}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <RotateCw className="w-4 h-4" />
            نمایش پاسخ کارت (Space)
          </button>

          <button
            type="button"
            disabled={currentIndex + 1 >= cards.length}
            onClick={() => {
              setIsFlipped(false);
              setShowHint(false);
              setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            کارت بعدی
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
