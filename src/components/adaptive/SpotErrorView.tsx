"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem, SpotErrorSegment } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { Crosshair, CheckCircle2, XCircle, Sparkles, AlertTriangle } from "lucide-react";

interface SpotErrorViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export const SpotErrorView: React.FC<SpotErrorViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // بخش‌بندی گزاره
  const segments: SpotErrorSegment[] =
    item.segments && item.segments.length > 0
      ? item.segments
      : [
          { text: item.fullStatement || item.prompt, isError: true },
        ];

  const handleSegmentClick = (idx: number, segment: SpotErrorSegment) => {
    if (hasSubmitted || disabled) return;
    setSelectedIdx(idx);
    setHasSubmitted(true);
    const isCorrect = segment.isError;
    onAnswer(isCorrect, segment.text);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 rounded-full text-xs font-bold border border-rose-200">
          <Crosshair className="w-3.5 h-3.5 text-rose-600" />
          شکار خطا (Spot the Error)
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-700">
          در گزاره زیر، هوش مصنوعی عمداً یک خطای مفهومی ظریف ایجاد کرده است. روی بخش نادرست کلیک کنید:
        </h3>
      </div>

      {/* متن با کلمات/بخش‌های قابل کلیک */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm leading-loose text-xs sm:text-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {segments.map((seg, idx) => {
            let segStyle = "bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border-slate-200 text-slate-800";
            if (hasSubmitted) {
              if (seg.isError) {
                segStyle = "bg-rose-500 text-white border-rose-600 font-bold shadow-md animate-pulse";
              } else if (selectedIdx === idx) {
                segStyle = "bg-slate-300 text-slate-600 border-slate-400 line-through";
              } else {
                segStyle = "bg-slate-50 text-slate-400 border-slate-100";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasSubmitted || disabled}
                onClick={() => handleSegmentClick(idx, seg)}
                className={`px-3.5 py-2 rounded-2xl border transition-all text-right font-medium cursor-pointer shadow-2xs ${segStyle}`}
              >
                <KaTeXRenderer content={seg.text} />
              </button>
            );
          })}
        </div>

        {/* جعبه تصحیح علمی در صورت ارسال پاسخ */}
        {hasSubmitted && item.errorCorrection && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1 animate-in fade-in">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>تصحیح علمی این گزاره:</span>
            </div>
            <p className="leading-relaxed">
              <KaTeXRenderer content={item.errorCorrection} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
