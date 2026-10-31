"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { Sparkles, RotateCw, Lightbulb, CheckCircle2 } from "lucide-react";

interface FlashcardMnemonicViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, ratingText: string) => void;
  disabled?: boolean;
}

export const FlashcardMnemonicView: React.FC<FlashcardMnemonicViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const handleRate = (rating: number, label: string) => {
    if (hasRated || disabled) return;
    setHasRated(true);
    const isSuccess = rating >= 3;
    onAnswer(isSuccess, label);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          کارت حافظه فعال و تصویرسازی ذهنی (Mnemonic Hint)
        </div>
        <p className="text-xs text-slate-500">
          روی کارت کلیک کنید تا پاسخ تشریحی و کد رمز تثبیت در حافظه بلندمدت آشکار شود:
        </p>
      </div>

      {/* کارت تعاملی */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !hasRated && setIsFlipped(!isFlipped)}
        className="w-full min-h-64 sm:min-h-72 p-6 sm:p-8 rounded-3xl border-2 border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
            {isFlipped ? "پشت کارت (پاسخ و کد رمز)" : "روی کارت (مفهوم)"}
          </span>
          <span className="flex items-center gap-1 group-hover:text-indigo-600 transition">
            <RotateCw className="w-3.5 h-3.5" />
            کلیک برای چرخش
          </span>
        </div>

        <div className="my-auto py-4 text-center space-y-4">
          {!isFlipped ? (
            <div className="text-base sm:text-lg font-black text-slate-900 leading-relaxed max-w-lg mx-auto">
              <KaTeXRenderer content={item.front || item.prompt} />
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto animate-in zoom-in-95">
              <div className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                <KaTeXRenderer content={item.back || item.prompt} />
              </div>

              {item.mnemonicClue && (
                <div className="bg-gradient-to-r from-amber-100/80 to-orange-100/80 border border-amber-300 p-3.5 rounded-2xl text-amber-950 text-xs font-medium space-y-1 text-right shadow-2xs">
                  <div className="font-black text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>کد رمز حافظه (Mnemonic Clue):</span>
                  </div>
                  <div className="leading-relaxed">{item.mnemonicClue}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          {!isFlipped ? "برای مشاهده پاسخ روی کارت ضربه بزنید" : "میزان تسلط خود را ارزیابی کنید"}
        </div>
      </div>

      {/* دکمه‌های خودارزیابی بر اساس الگوریتم FSRS */}
      {isFlipped && !hasRated && (
        <div className="space-y-2 animate-in fade-in">
          <div className="text-center text-xs font-bold text-slate-600">
            چقدر سریع این مفهوم را به خاطر آوردی؟
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleRate(1, "دوباره (Again)")}
              className="py-3 px-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold transition flex flex-col items-center gap-1"
            >
              <span>دوباره</span>
              <span className="text-[10px] text-rose-600 font-normal">&lt;۱۰ دقیقه</span>
            </button>
            <button
              type="button"
              onClick={() => handleRate(2, "سخت (Hard)")}
              className="py-3 px-2 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition flex flex-col items-center gap-1"
            >
              <span>سخت</span>
              <span className="text-[10px] text-amber-600 font-normal">۱ روز</span>
            </button>
            <button
              type="button"
              onClick={() => handleRate(3, "خوب (Good)")}
              className="py-3 px-2 rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold transition flex flex-col items-center gap-1"
            >
              <span>خوب</span>
              <span className="text-[10px] text-indigo-600 font-normal">۳ روز</span>
            </button>
            <button
              type="button"
              onClick={() => handleRate(4, "آسان (Easy)")}
              className="py-3 px-2 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold transition flex flex-col items-center gap-1"
            >
              <span>آسان</span>
              <span className="text-[10px] text-emerald-700 font-normal">۷ روز</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
