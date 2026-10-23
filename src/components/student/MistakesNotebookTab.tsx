"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Tag,
  ArrowRight,
  Zap,
  Target,
  Box,
  Check,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface QuestionOption {
  id: string;
  orderIndex: number;
  text?: string;
  optionText?: string;
  isCorrect: boolean;
}

interface MistakeItem {
  id: string;
  studentId: string;
  questionId: string;
  source: string;
  selectedOpt: string | null;
  errorReason: string | null;
  isResolved: boolean;
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  question: {
    id: string;
    content: string;
    type: string;
    difficulty: string;
    explanation?: string | null;
    topic?: {
      id: string;
      title: string;
      textbook?: {
        title: string;
      };
    };
    options: QuestionOption[];
  };
}

interface MistakesNotebookTabProps {
  studentId: string;
  onRefreshStats?: () => void;
  onSendToLeitner?: (front: string, back: string, topicId?: string, questionId?: string) => void;
}

export const MistakesNotebookTab: React.FC<MistakesNotebookTabProps> = ({
  studentId,
  onRefreshStats,
  onSendToLeitner,
}) => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");

  // باز شدن راه‌حل تشریحی برای هر کارت { mistakeId: boolean }
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // حالت آزمون مجدد درون کارت { mistakeId: chosenOptionId }
  const [retestAnswers, setRetestAnswers] = useState<Record<string, string>>({});
  const [retestFeedback, setRetestFeedback] = useState<Record<string, { isCorrect: boolean; msg: string }>>({});

  // پیام اعلان موفقیت
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/mistakes?studentId=${studentId}&status=${filterStatus}&topicId=${selectedTopic}`);
      const data = await res.json();
      setMistakes(data.mistakes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, [filterStatus, selectedTopic]);

  // تغییر برچسب دلیل اشتباه
  const handleUpdateReason = async (mistakeId: string, reason: string) => {
    try {
      const res = await fetch("/api/student/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateReason",
          mistakeId,
          errorReason: reason,
        }),
      });
      if (res.ok) {
        setMistakes((prev) =>
          prev.map((m) => (m.id === mistakeId ? { ...m, errorReason: reason } : m))
        );
        showToast(`دلیل اشتباه به «${reason}» تغییر یافت.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // بررسی پاسخ آزمون مجدد
  const handleVerifyRetest = async (mistakeId: string, chosenOpt: string) => {
    try {
      const res = await fetch("/api/student/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verifyRetest",
          mistakeId,
          answer: chosenOpt,
        }),
      });
      const data = await res.json();
      setRetestFeedback((prev) => ({
        ...prev,
        [mistakeId]: { isCorrect: data.isCorrect, msg: data.message },
      }));

      if (data.isCorrect) {
        showToast(data.message);
        if (onRefreshStats) onRefreshStats();
        // به‌روزرسانی محلی وضعیت
        setMistakes((prev) =>
          prev.map((m) => (m.id === mistakeId ? { ...m, isResolved: true } : m))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ارسال سوال به جعبه لایتنر
  const handleTransferToLeitner = async (m: MistakeItem) => {
    const front = m.question.content;
    const back =
      m.question.explanation ||
      m.question.options.find((o) => o.isCorrect)?.optionText ||
      "پاسخ در راهنمای تشریحی";

    try {
      const res = await fetch("/api/student/leitner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createCard",
          frontContent: front,
          backContent: back,
          topicId: m.question.topic?.id,
          questionId: m.question.id,
        }),
      });
      if (res.ok) {
        showToast("سوال با موفقیت به خانه ۱ جعبه لایتنر اضافه شد 📦");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const reasonList = [
    "بی‌دقتی محاسباتی",
    "عدم تسلط مفهومی",
    "کمبود زمان",
    "بدخوانی صورت سوال",
  ];

  const unresolvedCount = mistakes.filter((m) => !m.isResolved).length;
  const resolvedCount = mistakes.filter((m) => m.isResolved).length;

  return (
    <div className="space-y-6">
      {/* پیام شناور Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* بنر معرفی دفترچه اشتباهات هوشمند */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-800 p-6 md:p-8 rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-rose-100 border border-white/30 text-xs px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            دفترچه اشتباهات هوشمند (Smart Mistakes Notebook)
          </div>
          <h2 className="text-xl md:text-2xl font-black">تحلیل و یادگیری از اشتباهات گذشته</h2>
          <p className="text-xs text-rose-100/90 max-w-xl leading-relaxed">
            تمامی سوالاتی که در تکالیف یا آزمون‌ها اشتباه پاسخ داده‌اید، به صورت هوشمند اینجا ذخیره
            شده‌اند تا بتوانید دلیل خطا را ریشه‌یابی کرده و با آزمون مجدد روی آنها مسلط شوید.
          </p>
        </div>

        {/* جعبه آمار */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
          <div className="text-center px-3">
            <span className="text-[11px] text-rose-200 block">نیازمند تمرین</span>
            <span className="text-xl font-black text-amber-300">{unresolvedCount} سوال</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-3">
            <span className="text-[11px] text-rose-200 block">رفع نقص شده</span>
            <span className="text-xl font-black text-emerald-300">{resolvedCount} سوال</span>
          </div>
        </div>
      </div>

      {/* نوار فیلترها و وضعیت‌ها */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">نمایش:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterStatus("unresolved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === "unresolved"
                  ? "bg-white text-rose-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              نیازمند رفع نقص ({unresolvedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("resolved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === "resolved"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              رفع نقص شده ({resolvedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === "all"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              همه اشتباهات
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {mistakes.length} مورد در این بخش موجود است
        </div>
      </div>

      {/* لیست کارت‌های اشتباهات */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">در حال فراخوانی دفترچه اشتباهات...</p>
        </div>
      ) : mistakes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-black text-slate-800">عالی است! هیچ اشتباه فعالی در این بخش ندارید</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            تمامی سوالات این بخش به درستی رفع نقص شده‌اند یا هنوز تکلیفی با پاسخ غلط ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((m, idx) => {
            const isResolved = m.isResolved;
            const isSolutionOpen = expandedSolutions[m.id];
            const retestAns = retestAnswers[m.id];
            const feedback = retestFeedback[m.id];

            return (
              <div
                key={m.id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isResolved
                    ? "border-emerald-200 bg-emerald-50/10"
                    : "border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {/* هدر کارت اشتباه */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isResolved ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {m.question.topic?.title || "حسابان و ریاضی ۳"}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                      منبع: {m.source === "ASSIGNMENT" ? "تکلیف کلاسی" : "آزمون"}
                    </span>
                  </div>

                  {/* وضعیت و دکمه انتقال به لایتنر */}
                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        رفع نقص شده ✓
                      </span>
                    ) : (
                      <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        نیازمند یادگیری
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleTransferToLeitner(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
                      title="افزودن این فرمول و سوال به جعبه لایتنر برای مرور فاصله‌دار"
                    >
                      <Box className="w-3.5 h-3.5" />
                      انتقال به لایتنر
                    </button>
                  </div>
                </div>

                {/* صورت سوال با فرمول KaTeX */}
                <div className="py-4 text-sm font-semibold text-slate-900 leading-relaxed">
                  <KaTeXRenderer content={m.question.content} />
                </div>

                {/* بخش گزینه‌ها برای آزمون مجدد درون کارت */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {m.question.options.map((opt) => {
                    const isStudentPreviousPick =
                      m.selectedOpt === opt.id || m.selectedOpt === String(opt.orderIndex);
                    const isCorrectOpt = opt.isCorrect;
                    const isRetestPick = retestAns === opt.id;

                    let optStyle = "border-slate-200 hover:border-indigo-400 bg-slate-50/70";

                    if (isCorrectOpt && (isResolved || isSolutionOpen)) {
                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                    } else if (isStudentPreviousPick && !isCorrectOpt) {
                      optStyle =
                        "border-rose-400 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-300";
                    }

                    if (isRetestPick) {
                      optStyle = "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500";
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRetestAnswers((prev) => ({ ...prev, [m.id]: opt.id }));
                          handleVerifyRetest(m.id, opt.id);
                        }}
                        className={`p-3 rounded-2xl border text-right text-xs transition-all flex items-start gap-2.5 ${optStyle}`}
                      >
                        <span className="w-5 h-5 rounded-lg bg-white border border-slate-300 text-slate-800 text-[10px] font-black flex items-center justify-center shrink-0">
                          {opt.orderIndex}
                        </span>
                        <div className="flex-1">
                          <KaTeXRenderer content={opt.optionText || opt.text || ""} />
                        </div>
                        {isStudentPreviousPick && !isCorrectOpt && (
                          <span className="text-[10px] text-rose-600 font-bold shrink-0">
                            (گزینه اشتباه قبلی شما)
                          </span>
                        )}
                        {isCorrectOpt && (isResolved || isSolutionOpen) && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* بازخورد آزمون مجدد */}
                {feedback && (
                  <div
                    className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      feedback.isCorrect
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-rose-50 text-rose-900 border border-rose-200"
                    }`}
                  >
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{feedback.msg}</span>
                  </div>
                )}

                {/* نوار انتخاب دلیل اشتباه (Error Root-Cause Tagging) */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      علت وقوع خطا:
                    </span>
                    {reasonList.map((reason) => {
                      const isSelected = m.errorReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => handleUpdateReason(m.id, reason)}
                          className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition ${
                            isSelected
                              ? "bg-rose-600 text-white shadow-2xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>

                  {/* دکمه مشاهده راه‌حل تشریحی */}
                  {m.question.explanation && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSolutions((prev) => ({
                          ...prev,
                          [m.id]: !prev[m.id],
                        }))
                      }
                      className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <span>{isSolutionOpen ? "بستن راه‌حل" : "مشاهده تحلیل تشریحی و کلید"}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isSolutionOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* آکاردئون راهنمای تشریحی KaTeX */}
                {isSolutionOpen && m.question.explanation && (
                  <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-800 leading-relaxed animate-in fade-in">
                    <div className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      تحلیل و راه‌حل استاندارد:
                    </div>
                    <KaTeXRenderer content={m.question.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
