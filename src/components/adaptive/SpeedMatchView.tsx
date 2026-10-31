"use client";

import React, { useState, useEffect } from "react";
import { AdaptiveAssessmentItem, SpeedMatchPair } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { Timer, CheckCircle2, Zap, AlertCircle } from "lucide-react";

interface SpeedMatchViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export const SpeedMatchView: React.FC<SpeedMatchViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const originalPairs = item.pairs || [];
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedTerms, setMatchedTerms] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([]);

  // به هم ریختن تعاریف در شروع
  useEffect(() => {
    const defs = originalPairs.map((p) => p.definition);
    // شافل ساده
    const shuffled = [...defs].sort(() => Math.random() - 0.5);
    setShuffledDefs(shuffled);
    setTimeLeft(30);
    setIsFinished(false);
    setMatchedTerms([]);
  }, [item.id]);

  // تایمر معکوس ۳۰ ثانیه‌ای
  useEffect(() => {
    if (isFinished || disabled) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      onAnswer(false, "زمان ۳۰ ثانیه به پایان رسید.");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, disabled]);

  const handleTermClick = (term: string) => {
    if (isFinished || matchedTerms.includes(term)) return;
    setSelectedTerm(term);

    // اگر تعریفی از قبل انتخاب شده باشد، بررسی جفت بودن
    if (selectedDef) {
      checkMatch(term, selectedDef);
    }
  };

  const handleDefClick = (def: string) => {
    if (isFinished) return;
    // بررسی آیا این تعریف قبلا مچ شده
    const isAlreadyMatched = originalPairs.some(
      (p) => matchedTerms.includes(p.term) && p.definition === def
    );
    if (isAlreadyMatched) return;

    setSelectedDef(def);

    if (selectedTerm) {
      checkMatch(selectedTerm, def);
    }
  };

  const checkMatch = (term: string, def: string) => {
    const pair = originalPairs.find((p) => p.term === term);
    if (pair && pair.definition === def) {
      // جفت صحیح!
      const updated = [...matchedTerms, term];
      setMatchedTerms(updated);
      setSelectedTerm(null);
      setSelectedDef(null);

      // اگر همه ۴ جفت پیدا شدند
      if (updated.length === originalPairs.length) {
        setIsFinished(true);
        onAnswer(true, "تطبیق کامل زیر ۳۰ ثانیه");
      }
    } else {
      // جفت اشتباه -> ریست انتخاب با فیدبک لرزش خفیف
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 400);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* هدر و شمارنده ۳۰ ثانیه‌ای */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-800 rounded-full text-xs font-bold border border-cyan-200">
          <Zap className="w-3.5 h-3.5 text-cyan-600" />
          جفت‌سازی سرعتی (Speed Matching)
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold shadow-md">
          <Timer className={`w-4 h-4 ${timeLeft < 10 ? "text-rose-400 animate-spin" : "text-amber-400"}`} />
          <span className={timeLeft < 10 ? "text-rose-400 animate-pulse" : ""}>{timeLeft} ثانیه</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 font-medium">
        روی هر اصطلاح در سمت راست و سپس معادل یا تعریف آن در سمت چپ کلیک کنید تا متصل شوند:
      </p>

      {/* ستون‌های جفت‌سازی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ستون ۱: اصطلاحات (Terms) */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
            اصطلاح یا تابع
          </div>
          {originalPairs.map((pair, idx) => {
            const isMatched = matchedTerms.includes(pair.term);
            const isSelected = selectedTerm === pair.term;

            let style = "bg-white border-slate-200 hover:border-cyan-400 text-slate-800";
            if (isMatched) {
              style = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold opacity-80 cursor-default";
            } else if (isSelected) {
              style = "bg-cyan-100 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-400/40";
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isMatched || isFinished}
                onClick={() => handleTermClick(pair.term)}
                className={`w-full p-3.5 rounded-2xl border text-xs text-right transition-all flex items-center justify-between shadow-2xs ${style}`}
              >
                <KaTeXRenderer content={pair.term} />
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* ستون ۲: تعاریف و مشتقات (Definitions) */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
            تعریف یا مشتق
          </div>
          {shuffledDefs.map((def, idx) => {
            const matchedPair = originalPairs.find((p) => p.definition === def);
            const isMatched = matchedPair && matchedTerms.includes(matchedPair.term);
            const isSelected = selectedDef === def;

            let style = "bg-white border-slate-200 hover:border-cyan-400 text-slate-800";
            if (isMatched) {
              style = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold opacity-80 cursor-default";
            } else if (isSelected) {
              style = "bg-cyan-100 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-400/40";
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={!!isMatched || isFinished}
                onClick={() => handleDefClick(def)}
                className={`w-full p-3.5 rounded-2xl border text-xs text-right transition-all flex items-center justify-between shadow-2xs ${style}`}
              >
                <KaTeXRenderer content={def} />
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
