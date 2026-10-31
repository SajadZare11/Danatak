"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface MultipleChoiceViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export const MultipleChoiceView: React.FC<MultipleChoiceViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (hasSubmitted || disabled) return;
    setSelectedOption(option);
    setHasSubmitted(true);
    const isCorrect = option.trim() === item.correctAnswer?.trim();
    onAnswer(isCorrect, option);
  };

  const options = item.options || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          تست سناریومحور مفهومی (سطح {item.bloomLevel})
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
          <KaTeXRenderer content={item.prompt} />
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {options.map((option, idx) => {
          let btnStyle = "bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-800";
          if (hasSubmitted) {
            if (option.trim() === item.correctAnswer?.trim()) {
              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400/30";
            } else if (selectedOption === option) {
              btnStyle = "bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/30";
            } else {
              btnStyle = "bg-white/50 border-slate-200 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted || disabled}
              onClick={() => handleSelect(option)}
              className={`p-4 rounded-2xl border text-xs sm:text-sm text-right transition-all flex items-center justify-between shadow-2xs group ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <KaTeXRenderer content={option} />
              </div>
              {hasSubmitted && option.trim() === item.correctAnswer?.trim() && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {hasSubmitted && selectedOption === option && option.trim() !== item.correctAnswer?.trim() && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
