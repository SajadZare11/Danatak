"use client";

import React, { useState } from "react";
import { AdaptiveAssessmentItem } from "@/lib/adaptive/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  Mic,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface FeynmanRoomViewProps {
  item: AdaptiveAssessmentItem;
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export const FeynmanRoomView: React.FC<FeynmanRoomViewProps> = ({
  item,
  onAnswer,
  disabled = false,
}) => {
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    masteryPercentage: number;
    conceptsFound: string[];
    conceptsMissing: string[];
    feedback: string;
    passed: boolean;
  } | null>(null);

  const rubric = item.rubricKeywords || [];

  const handleEvaluate = async () => {
    if (!textInput.trim() || isEvaluating || disabled) return;
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/adaptive/feynman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userExplanation: textInput,
          rubricKeywords: rubric,
          prompt: item.prompt,
          sampleAnswer: item.sampleAnswer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvaluationResult(data);
        onAnswer(data.passed, textInput);
      }
    } catch (err) {
      console.error("Feynman evaluation failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSimulateVoice = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // شبیه‌سازی ضبط صوت ۳۰ ثانیه‌ای
      setTimeout(() => {
        setIsRecording(false);
        if (!textInput) {
          setTextInput(
            item.sampleAnswer ||
              "وقتی تابع از سمت چپ و راست به اون نقطه نزدیک میشه شیب خط مماس‌ها برابر نیستن، بنابراین مماس یکتا نداریم."
          );
        }
      }, 2500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* هدر اتاق فاینمن */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-800 rounded-full text-xs font-bold border border-violet-200">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          اتاق فاینمن: به هوش مصنوعی آموزش بده (Teach the AI)
        </div>
        <h3 className="text-sm sm:text-base font-black text-slate-900 leading-relaxed">
          <KaTeXRenderer content={item.prompt} />
        </h3>
        <p className="text-xs text-slate-500">
          فرض کن هوش مصنوعی هیچ‌چیز از این مبحث نمی‌داند. در ۲ خط به زبان خودت توضیح بده:
        </p>
      </div>

      {/* ورودی متن یا صوت */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            rows={4}
            value={textInput}
            disabled={evaluationResult !== null || disabled}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="توضیح مفهومی خودت رو اینجا به زبان ساده بنویس..."
            className="w-full p-4 rounded-3xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:border-violet-500 shadow-2xs transition leading-relaxed resize-none"
          />

          <button
            type="button"
            disabled={evaluationResult !== null || disabled}
            onClick={handleSimulateVoice}
            className={`absolute left-3 bottom-3 p-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecording ? "در حال ضبط ویس..." : "ویس ۳۰ ثانیه‌ای"}</span>
          </button>
        </div>

        {/* کادر کلیدواژه‌های ارزیابی (Rubric) */}
        {rubric.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
            <span className="font-bold text-slate-600 text-[11px]">
              روباریک ارزیابی هوش مصنوعی (نکات کلیدی مورد انتظار):
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {rubric.map((kw, i) => (
                <span
                  key={i}
                  className="bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-medium"
                >
                  • {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* دکمه ارسال برای سنجش فاینمن */}
        {!evaluationResult && (
          <button
            type="button"
            disabled={!textInput.trim() || isEvaluating || disabled}
            onClick={handleEvaluate}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
          >
            {isEvaluating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ارزیابی درک مفهومی شما توسط هوش مصنوعی...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>سنجش تسلط مفهومی به روش فاینمن 🚀</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* نتایج ارزیابی هوش مصنوعی فاینمن */}
      {evaluationResult && (
        <div
          className={`p-5 rounded-3xl border space-y-4 animate-in fade-in ${
            evaluationResult.passed
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="font-black text-sm">
                درصد تسلط مفهومی فاینمن: {evaluationResult.masteryPercentage}٪
              </span>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                evaluationResult.passed ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
              }`}
            >
              {evaluationResult.passed ? "قبول و تثبیت شده ✅" : "نیاز به تقویت ⚠️"}
            </span>
          </div>

          {/* نوار پیشرفت تسلط */}
          <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                evaluationResult.passed ? "bg-emerald-600" : "bg-amber-600"
              }`}
              style={{ width: `${evaluationResult.masteryPercentage}%` }}
            />
          </div>

          {/* بازخورد تحلیلی */}
          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold">تحلیل هوش مصنوعی:</div>
            <p className="text-slate-700">{evaluationResult.feedback}</p>
          </div>

          {/* نکات پوشش داده شده و جا مانده */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            {evaluationResult.conceptsFound.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مفاهیم عالی پوشش داده شده:</span>
                </div>
                <div>{evaluationResult.conceptsFound.join("، ")}</div>
              </div>
            )}
            {evaluationResult.conceptsMissing.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>نکات شایسته تقویت:</span>
                </div>
                <div>{evaluationResult.conceptsMissing.join("، ")}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
