"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface ClozeDeletionViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export const ClozeDeletionView: React.FC<ClozeDeletionViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const choices = item.choices || [];
  const sentence = item.sentenceWithBlank || item.prompt;

  const handleSelect = (choice: string) => {
    if (hasSubmitted || disabled) return;
    setSelectedWord(choice);
    setHasSubmitted(true);
    const isCorrect = choice.trim() === item.correctAnswer?.trim();
    onAnswer(isCorrect, choice);
  };

  // تجزیه متن بر اساس [BLANK]
  const parts = sentence.split("[BLANK]");

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          جای خالی هوشمند (Smart Cloze Deletion)
        </div>
        <p className="text-xs text-slate-500">
          گزینه مناسب را انتخاب کنید تا جمله کلیدی جزوه کامل شود:
        </p>
      </div>

      {/* کادر جمله با جای خالی پر شونده */}
      <div className="bg-gradient-to-l from-indigo-50/70 via-slate-50 to-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 text-slate-900 text-sm sm:text-base leading-loose font-medium shadow-xs">
        <span>{parts[0]}</span>
        <span
          className={`inline-flex items-center justify-center px-4 py-1 mx-1.5 rounded-xl font-bold transition-all border ${
            selectedWord
              ? hasSubmitted && selectedWord.trim() === item.correctAnswer?.trim()
                ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                : "bg-rose-500 text-white border-rose-600 shadow-md"
              : "bg-indigo-100 text-indigo-700 border-indigo-300 min-w-28 text-center animate-pulse"
          }`}
        >
          {selectedWord ? <KaTeXRenderer content={selectedWord} /> : "__________"}
        </span>
        <span>{parts[1] || ""}</span>
      </div>

      {/* انتخاب گزینه‌ها */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {choices.map((choice, idx) => {
          let btnStyle = "bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-800";
          if (hasSubmitted) {
            if (choice.trim() === item.correctAnswer?.trim()) {
              btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300";
            } else if (selectedWord === choice) {
              btnStyle = "bg-rose-100 border-rose-500 text-rose-950 ring-2 ring-rose-300";
            } else {
              btnStyle = "bg-slate-100/60 border-slate-200 text-slate-400 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted || disabled}
              onClick={() => handleSelect(choice)}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs ${btnStyle}`}
            >
              <KaTeXRenderer content={choice} />
              {hasSubmitted && choice.trim() === item.correctAnswer?.trim() && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {hasSubmitted && selectedWord === choice && choice.trim() !== item.correctAnswer?.trim() && (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
