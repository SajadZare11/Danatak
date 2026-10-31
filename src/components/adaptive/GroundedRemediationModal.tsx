"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface GroundedRemediationModalProps {
  isOpen: boolean;
  item: AdaptiveAssessmentItem;
  userGivenAnswer?: string;
  onClose: () => void;
  onSolveIsomorphic?: (isCorrect: boolean) => void;
}

export const GroundedRemediationModal: React.FC<GroundedRemediationModalProps> = ({
  isOpen,
  item,
  userGivenAnswer,
  onClose,
  onSolveIsomorphic,
}) => {
  const [selectedIsoOption, setSelectedIsoOption] = useState<string | null>(null);
  const [isoSubmitted, setIsoSubmitted] = useState(false);
  const [isIsoCorrect, setIsIsoCorrect] = useState(false);

  if (!isOpen) return null;

  const iso = item.isomorphicQuestion;

  const handleIsoSubmit = (opt: string) => {
    if (isoSubmitted || !iso) return;
    setSelectedIsoOption(opt);
    setIsoSubmitted(true);
    const correct = opt.trim() === iso.correctAnswer.trim();
    setIsIsoCorrect(correct);
    if (onSolveIsomorphic) onSolveIsomorphic(correct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-rose-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* هدر هشدار خطای یادگیری با استایل ارجاع به منبع */}
        <div className="bg-gradient-to-l from-rose-600 via-rose-500 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="text-xs font-medium text-rose-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                حلقه رفع اشکال مبتنی بر شواهد (Grounded Remediation Loop)
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                مرجع مستقیم در جزوه شما • صفحه {item.pageNumber}
              </h3>
            </div>
          </div>
        </div>

        {/* محتوای بدنه مدال */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* بخش نقل قول مستقیم از جزوه */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>پاراگراف دقیق استخراج‌شده از جزوه شما:</span>
            </div>
            <div className="relative bg-amber-50/80 border-r-4 border-amber-500 p-4 rounded-2xl text-slate-900 leading-relaxed font-serif shadow-xs">
              <div className="absolute top-2 left-3 text-[10px] text-amber-800/60 font-mono font-bold">
                PAGE {item.pageNumber}
              </div>
              <KaTeXRenderer content={item.sourceQuote} className="italic text-slate-800" />
            </div>
          </div>

          {/* تحلیل کژتابی و دلیل نادرستی */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-rose-600">
              <HelpCircle className="w-4 h-4" />
              <span>چرا این اشتباه رخ داد؟ (تحلیل خطای مفهومی)</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              <KaTeXRenderer content={item.remediationExplanation} />
            </p>
          </div>

          {/* سوال هم‌خانواده جهت تثبیت یادگیری (Isomorphic Question) */}
          {iso && (
            <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-indigo-950 text-xs flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  سوال جبرانی هم‌خانواده (همین حالا رفع اشکال کن):
                </span>
                <span className="text-[11px] bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full font-bold">
                  تست سریع
                </span>
              </div>

              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                <KaTeXRenderer content={iso.prompt} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {iso.options.map((opt, idx) => {
                  let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-indigo-400";
                  if (isoSubmitted) {
                    if (opt.trim() === iso.correctAnswer.trim()) {
                      btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold";
                    } else if (selectedIsoOption === opt) {
                      btnStyle = "bg-rose-100 border-rose-500 text-rose-950 line-through";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isoSubmitted}
                      onClick={() => handleIsoSubmit(opt)}
                      className={`p-3 rounded-xl border text-xs text-right transition flex items-center justify-between shadow-2xs ${btnStyle}`}
                    >
                      <KaTeXRenderer content={opt} />
                      {isoSubmitted && opt.trim() === iso.correctAnswer.trim() && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isoSubmitted && selectedIsoOption === opt && opt.trim() !== iso.correctAnswer.trim() && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isoSubmitted && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    isIsoCorrect
                      ? "bg-emerald-100/90 text-emerald-950 border border-emerald-300"
                      : "bg-amber-100/90 text-amber-950 border border-amber-300"
                  }`}
                >
                  {isIsoCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>آفرین! نکته در حافظه‌ات تثبیت شد.</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-700" />
                      <span>
                        پاسخ صحیح گزینه «<KaTeXRenderer content={iso.correctAnswer} />» بود: {iso.explanation}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* دکمه پاورقی */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2"
          >
            <span>نکته را متوجه شدم، ادامه بده</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
