"use client";

import React, { useState } from "react";
import { X, Zap, CheckCircle2, AlertCircle, ArrowLeft, Award, Sparkles } from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

export interface DiagnosticQuestion {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  explanation?: string | null;
  options: Array<{
    id: string;
    text: string;
    orderIndex: number;
    isCorrect: boolean;
  }>;
}

export interface DiagnosticData {
  strugglingTopic: {
    id: string;
    title: string;
    gradeLevel: number;
    mastery: number;
  };
  rootCausePrerequisite: {
    id: string;
    title: string;
    gradeLevel: number;
    bookTitle: string;
    currentMastery: number;
    importance: number;
  };
  analysisMessage: string;
  questions: DiagnosticQuestion[];
}

interface DiagnosticTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostic: DiagnosticData | null;
  studentProfileId: string;
  onCompleted?: () => void;
}

export const DiagnosticTestModal: React.FC<DiagnosticTestModalProps> = ({
  isOpen,
  onClose,
  diagnostic,
  studentProfileId,
  onCompleted,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardedXP, setAwardedXP] = useState(0);

  if (!isOpen || !diagnostic) return null;

  const questions = diagnostic.questions;

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      const selectedOptId = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedOptId && correctOpt && selectedOptId === correctOpt.id) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(selectedAnswers).length === 0) return;

    setIsSubmitting(true);
    const correctCount = calculateScore();

    try {
      const res = await fetch("/api/mastery/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId,
          topicId: diagnostic.rootCausePrerequisite.id,
          correctCount,
          totalQuestions: questions.length,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAwardedXP(data.awardedXP || 45);
        setShowResults(true);
        setIsSubmitting(false);
        onCompleted?.();
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const correctCount = calculateScore();
  const percentage = Math.round((correctCount / (questions.length || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* هدر مدال تست تشخیصی */}
        <div className="px-6 py-4 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm">
                تست تشخیصی و عارضه‌یابی ریشه‌ای (Root-Cause Diagnostic)
              </h3>
              <p className="text-[11px] text-indigo-200">
                بررسی پیش‌نیاز پایه {diagnostic.rootCausePrerequisite.gradeLevel} («{diagnostic.rootCausePrerequisite.title}»)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوای تست تشخیصی */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* کارت تحلیل ریشه ضعف */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/90 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              نتیجه کاوش گراف پیش‌نیازها:
            </div>
            <p className="leading-relaxed">{diagnostic.analysisMessage}</p>
            <div className="text-[11px] text-amber-700 font-medium">
              حل این تست تشخیصی کوتاه مشخص می‌کند آیا ریشه اشکال در محاسبات پیش‌نیاز است یا نیاز به مرور مبحث دوازدهم دارد.
            </div>
          </div>

          {/* نتیجه پس از پاسخ‌دهی */}
          {showResults ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-200 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">عارضه‌یابی با موفقیت ثبت شد!</h4>
                <p className="text-xs text-slate-500">
                  شما به {correctCount} از {questions.length} سوال پاسخ صحیح دادید (نمره تسلط پیش‌نیاز: {percentage}٪)
                </p>
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200 text-xs mt-2">
                  <Award className="w-4 h-4" /> +{awardedXP} امتیاز تجربه (XP) پاداش داده شد
                </div>
              </div>

              {/* پاسخنامه و توضیحات KaTeX */}
              <div className="space-y-4 text-right mt-6 border-t border-slate-100 pt-4">
                <h5 className="font-bold text-xs text-slate-800">بررسی سوالات و پاسخنامه تشریحی:</h5>
                {questions.map((q, idx) => {
                  const selected = selectedAnswers[q.id];
                  const correct = q.options.find((o) => o.isCorrect);
                  const isCorrect = selected === correct?.id;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        isCorrect
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-rose-50/60 border-rose-200"
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>سوال {idx + 1}:</span>
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}
                        >
                          {isCorrect ? "پاسخ صحیح" : "پاسخ نادرست"}
                        </span>
                      </div>
                      <KaTeXRenderer content={q.content} />
                      {q.explanation && (
                        <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200 mt-2 text-slate-700">
                          <span className="font-bold text-indigo-700 block text-[11px] mb-1">
                            راه‌حل و رفع ابهام:
                          </span>
                          <KaTeXRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition"
              >
                بستن و به‌روزرسانی رادار
              </button>
            </div>
          ) : (
            /* فرم سوالات تشخیصی */
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>سوال {qIndex + 1} از {questions.length}</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                      پایه {diagnostic.rootCausePrerequisite.gradeLevel}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-900 leading-relaxed">
                    <KaTeXRenderer content={q.content} />
                  </div>

                  {/* گزینه‌ها */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={`p-3 rounded-xl border text-xs text-right transition flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold"
                              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <KaTeXRenderer content={opt.text} />
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? "border-white bg-white text-indigo-700 font-bold"
                                : "border-slate-300 text-slate-400"
                            }`}
                          >
                            {opt.orderIndex}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(selectedAnswers).length < questions.length}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت نتایج..." : "ثبت پاسخ‌ها و محاسبه نمره عارضه‌یابی"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
