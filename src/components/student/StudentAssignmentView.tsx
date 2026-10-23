"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  Check,
  ChevronLeft,
  X,
  Award,
  Layers,
  BookOpen,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

export interface AssignmentDetail {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string | Date;
  maxScore: number;
  classroom?: {
    name: string;
    gradeLevel: number;
    major: string;
    school?: { name: string };
  };
  teacher?: {
    fullName: string;
  };
  topic?: {
    title: string;
    textbook?: {
      title: string;
    };
  };
}

export interface QuestionDetail {
  id: string;
  questionText: string;
  type: string;
  difficulty: string;
  solution?: string | null;
  options: Array<{
    id: string;
    orderIndex: number;
    text: string;
    isCorrect: boolean;
  }>;
  topic?: {
    title: string;
  };
}

interface StudentAssignmentViewProps {
  assignment: AssignmentDetail;
  questions: QuestionDetail[];
  studentId: string;
  studentName: string;
  initialSubmission?: {
    id: string;
    status: string;
    score: number | null;
    submittedAt: string | Date;
    answersJson?: string;
  } | null;
  onBack?: () => void;
  onSubmittedSuccess?: () => void;
}

export const StudentAssignmentView: React.FC<StudentAssignmentViewProps> = ({
  assignment,
  questions,
  studentId,
  studentName,
  initialSubmission,
  onBack,
  onSubmittedSuccess,
}) => {
  // حالت پاسخگویی: حل آنلاین (online) یا نسخه چاپی + پاسخ‌برگ سریع (print)
  const [activeMode, setActiveMode] = useState<"online" | "print">("online");

  // پاسخ‌های ثبت‌شده دانش‌آموز { questionId: chosenOptionId or text }
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (initialSubmission?.answersJson) {
      try {
        return JSON.parse(initialSubmission.answersJson);
      } catch {
        return {};
      }
    }
    return {};
  });

  // وضعیت فایل آپلود شده در حالت چاپی
  const [uploadedSheetName, setUploadedSheetName] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    percentage: number;
    correctCount: number;
    totalAutoGradable: number;
    awardedXP: number;
    message: string;
  } | null>(null);

  // بررسی وضعیت انجام تکلیف
  const isAlreadyGraded = initialSubmission?.status === "GRADED" || !!submissionResult;

  const handleSelectOption = (questionId: string, optionValue: string) => {
    if (isAlreadyGraded) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue,
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    if (isAlreadyGraded) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  // ارسال پاسخنامه
  const handleSubmitAssignment = async (isPrintSheet = false) => {
    if (isAlreadyGraded) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0 && !uploadedSheetName) {
      alert("لطفاً حداقل به یکی از سوالات پاسخ دهید یا عکس برگه را بارگذاری کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentId,
          answers,
          isPrintSheet,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionResult({
          score: data.score,
          percentage: data.percentage,
          correctCount: data.correctCount,
          totalAutoGradable: data.totalAutoGradable,
          awardedXP: data.awardedXP || 30,
          message: data.message,
        });
        if (onSubmittedSuccess) onSubmittedSuccess();
      } else {
        alert(data.error || "خطا در ثبت پاسخنامه");
      }
    } catch (err) {
      console.error(err);
      alert("خطای غیرمنتظره در ارسال تکلیف.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* هدر بالای صفحه و سوئیچ حالت دوگانه (Dual-Mode) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="بازگشت به کارتابل تکالیف"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                {assignment.topic?.textbook?.title || "حسابان و ریاضی ۳"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                دبیر: {assignment.teacher?.fullName || "استاد محمدی"}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">{assignment.title}</h1>
          </div>
        </div>

        {/* دکمه‌های سوئیچ بین حالت حل آنلاین و نسخه چاپی */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMode("online")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeMode === "online"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            پاسخگویی آنلاین
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("print")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeMode === "print"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Printer className="w-4 h-4" />
            نسخه چاپی + پاسخ‌برگ سریع
          </button>
        </div>
      </div>

      {/* بنر نتیجه نهایی پس از ارسال / تصحیح */}
      {submissionResult && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 print:hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-white/25 px-2.5 py-0.5 rounded-full">
                  تکلیف تحویل و تصحیح شد
                </span>
                <span className="text-xs bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-amber-950" />
                  +{submissionResult.awardedXP} امتیاز تجربه (XP)
                </span>
              </div>
              <h2 className="text-xl font-black mt-1">
                نمره شما: {submissionResult.score} از {assignment.maxScore} ({submissionResult.percentage}٪)
              </h2>
              <p className="text-xs text-white/90 mt-1">
                {submissionResult.correctCount} پاسخ صحیح از {submissionResult.totalAutoGradable} سوال تستی.
                پاسخنامه تشریحی و راهنماها در پایین برای مرور شما فعال گردید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
              className="w-full md:w-auto px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-black text-xs shadow-md hover:bg-emerald-50 transition"
            >
              مشاهده کلید و پاسخ تشریحی
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* حالت اول: پاسخگویی آنلاین (Online Solving Mode) */}
      {/* ========================================================================= */}
      {activeMode === "online" && (
        <div className="space-y-6">
          {/* نوار شناور وضعیت پیشرفت */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">وضعیت پاسخ‌دهی:</span>
              <span className="text-xs font-black text-indigo-700">
                {answeredCount} از {questions.length} سوال ({progressPercent}٪)
              </span>
            </div>

            <div className="flex-1 max-w-xs bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                مهلت تحویل: {new Date(assignment.dueDate).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>

          {/* لیست کارت‌های سوالات */}
          <div className="space-y-4">
            {questions.map((q, index) => {
              const selectedValue = answers[q.id];
              const isAnswered = !!selectedValue;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl p-6 border transition-all ${
                    isAnswered
                      ? "border-indigo-200 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* سربرگ هر سوال */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {q.topic?.title || "ریاضی و حسابان"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                        {q.type === "MULTIPLE_CHOICE"
                          ? "چهارگزینه‌ای"
                          : q.type === "TRUE_FALSE"
                          ? "صحیح / غلط"
                          : "تشریحی"}
                      </span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          q.difficulty === "HARD"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {q.difficulty === "HARD"
                          ? "سخت"
                          : q.difficulty === "MEDIUM"
                          ? "متوسط"
                          : "ساده"}
                      </span>
                    </div>
                  </div>

                  {/* صورت سوال با رندرر فرمول KaTeX */}
                  <div className="text-sm font-semibold text-slate-800 leading-relaxed mb-6">
                    <KaTeXRenderer content={q.questionText} />
                  </div>

                  {/* بخش گزینه‌ها یا فیلد پاسخ */}
                  {q.type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt) => {
                        const isSelected = selectedValue === opt.id || selectedValue === String(opt.orderIndex);
                        const isCorrectOpt = opt.isCorrect;

                        let cardStyle = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
                        if (isSelected) {
                          cardStyle = "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-600/20";
                        }
                        if (isAlreadyGraded) {
                          if (isCorrectOpt) {
                            cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30";
                          } else if (isSelected && !isCorrectOpt) {
                            cardStyle = "border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/30";
                          }
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isAlreadyGraded}
                            onClick={() => handleSelectOption(q.id, opt.id)}
                            className={`flex items-start gap-3 p-4 rounded-2xl border text-right transition-all cursor-pointer text-xs ${cardStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {opt.orderIndex}
                            </span>
                            <div className="flex-1 mt-0.5">
                              <KaTeXRenderer content={opt.text} />
                            </div>
                            {isAlreadyGraded && isCorrectOpt && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "TRUE_FALSE" && (
                    <div className="flex gap-4">
                      {["درست", "نادرست"].map((label, idx) => {
                        const isSelected = selectedValue === (idx === 0 ? "TRUE" : "FALSE");
                        return (
                          <button
                            key={label}
                            type="button"
                            disabled={isAlreadyGraded}
                            onClick={() => handleSelectOption(q.id, idx === 0 ? "TRUE" : "FALSE")}
                            className={`flex-1 p-3.5 rounded-2xl border text-center text-xs font-black transition ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20"
                                : "border-slate-200 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "DESCRIPTIVE" && (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        disabled={isAlreadyGraded}
                        placeholder="راه‌حل تشریحی خود را اینجا تایپ کنید یا فرمول نهایی را بنویسید..."
                        value={selectedValue || ""}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50"
                      />
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>یا تصویر دست‌نویس پاسخ خود را در نسخه چاپی آپلود کنید.</span>
                      </div>
                    </div>
                  )}

                  {/* پاسخ تشریحی (بعد از تحویل و تصحیح فعال می‌شود) */}
                  {isAlreadyGraded && q.solution && (
                    <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 font-black text-amber-900">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                        <span>راهنمای حل تشریحی دبیر:</span>
                      </div>
                      <div className="text-amber-950 font-medium leading-relaxed">
                        <KaTeXRenderer content={q.solution} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* نوار پایانی ارسال تکلیف */}
          {!isAlreadyGraded && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">اتمام پاسخ‌گویی آنلاین</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  با کلیک روی دکمه زیر، پاسخ‌های شما ثبت و سوالات تستی بلافاصله تصحیح خواهند شد.
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitAssignment(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black text-xs shadow-lg hover:shadow-indigo-500/25 transition transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting ? "در حال ثبت و تصحیح..." : "ثبت و تحویل نهایی تکلیف 🚀"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* حالت دوم: نسخه چاپی استاندارد + ثبت سریع پاسخ‌برگ آنلاین (Print Mode) */}
      {/* ========================================================================= */}
      {activeMode === "print" && (
        <div className="space-y-6">
          {/* نوار ابزار دستورات چاپ و ثبت سریع */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">نسخه چاپی و پاسخ‌برگ سنکرون</h3>
                <p className="text-xs text-slate-500">
                  سوالات را روی کاغذ پرینت کنید و گزینه‌ها را در پاسخ‌برگ سریع زیر کلیک نمایید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                چاپ برگه روی کاغذ A4 (Print)
              </button>
            </div>
          </div>

          {/* پاسخ‌برگ آنلاین سریع (Bubble-Sheet Grid) برای وارد کردن گزینه‌ها */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-6 rounded-3xl border border-indigo-100 print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  پاسخ‌برگ آنلاین تستی (تکمیل سریع کلید)
                </h4>
                <p className="text-xs text-indigo-800/80 mt-0.5">
                  پس از حل سوالات روی برگه چاپی، گزینه‌های انتخابی خود را در این جدول علامت بزنید.
                </p>
              </div>
              <span className="text-xs bg-white text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
                {answeredCount} از {questions.length} سوال پر شده
              </span>
            </div>

            {/* گرید شماره سوالات و دایره‌های ۱ تا ۴ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {questions.map((q, idx) => {
                const currentAns = answers[q.id];

                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-2xs"
                  >
                    <span className="text-xs font-black text-slate-700 w-6">
                      {idx + 1}.
                    </span>

                    {/* دایره‌های پاسخ چهارگزینه‌ای */}
                    {q.type === "MULTIPLE_CHOICE" ? (
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((optNum) => {
                          const optObj = q.options.find((o) => o.orderIndex === optNum);
                          const isPicked =
                            currentAns === optObj?.id || currentAns === String(optNum);

                          return (
                            <button
                              key={optNum}
                              type="button"
                              disabled={isAlreadyGraded}
                              onClick={() => {
                                if (optObj) handleSelectOption(q.id, optObj.id);
                                else handleSelectOption(q.id, String(optNum));
                              }}
                              className={`w-7 h-7 rounded-full text-xs font-black transition ${
                                isPicked
                                  ? "bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {optNum}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">تشریحی</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* بخش آپلود تصویر برگه حل‌شده */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900">آپلود عکس برگه حل‌شده (اختیاری)</h5>
                  <p className="text-[11px] text-slate-500">
                    برای سوالات تشریحی، عکس برگه را ارسال کنید تا دبیر در صف تصحیح قلم‌گذاری کند.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                  انتخاب فایل تصویر
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedSheetName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
                {uploadedSheetName && (
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {uploadedSheetName}
                  </span>
                )}
              </div>
            </div>

            {/* دکمه ارسال پاسخبرگ سریع */}
            {!isAlreadyGraded && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitAssignment(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ارسال..." : "ثبت پاسخ‌برگ چاپی و تصحیح آنی ⚡"}
                </button>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* قالب اصلی برگه چاپی رسمی مدارس ایران (A4 Print Layout) */}
          {/* ===================================================================== */}
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6 text-slate-900">
            {/* سربرگ رسمی وزارت آموزش و پرورش */}
            <div className="border-2 border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <div className="text-right space-y-1">
                  <p className="text-[11px] font-bold text-slate-600">جمهوری اسلامی ایران</p>
                  <p className="text-xs font-black text-slate-900">
                    {assignment.classroom?.school?.name || "دبیرستان استعدادهای درخشان علامه حلی ۱"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    کلاس: {assignment.classroom?.name || "دوازدهم ریاضی ۱"} • سال تحصیلی ۱۴۰۳-۱۴۰۴
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-slate-800 rounded-full mx-auto flex items-center justify-center font-black text-xs text-slate-800">
                    آموزش
                    <br />
                    پرورش
                  </div>
                  <h2 className="text-sm font-black mt-1 text-slate-900">برگه آزمون و تکلیف</h2>
                </div>

                <div className="text-left space-y-1 text-[11px]">
                  <p>
                    <span className="font-bold">نام و نام خانوادگی:</span> {studentName}
                  </p>
                  <p>
                    <span className="font-bold">نام دبیر:</span> {assignment.teacher?.fullName || "استاد محمدی"}
                  </p>
                  <p>
                    <span className="font-bold">بارم کل:</span> {assignment.maxScore} نمره
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="font-bold">عنوان تکلیف:</span> {assignment.title}
                </div>
                <div>
                  <span className="font-bold">مبحث:</span> {assignment.topic?.title || "حسابان و ریاضی ۳"}
                </div>
                <div>
                  <span className="font-bold">مهلت تحویل:</span>{" "}
                  {new Date(assignment.dueDate).toLocaleDateString("fa-IR")}
                </div>
              </div>
            </div>

            {/* لیست سوالات نسخه چاپی با فاصله‌گذاری مناسب برای حل دستی */}
            <div className="space-y-8 pt-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border-b border-slate-200 pb-6 break-inside-avoid space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-sm bg-slate-100 border border-slate-300 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed pt-0.5">
                        <KaTeXRenderer content={q.questionText} />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-bold shrink-0">
                      ({q.type === "MULTIPLE_CHOICE" ? "تستی" : "تشریحی"})
                    </span>
                  </div>

                  {/* گزینه‌ها در فرمت چاپی ۲ ستونی */}
                  {q.type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pr-8 pt-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50"
                        >
                          <span className="w-5 h-5 rounded-full border border-slate-400 text-center leading-4 font-bold text-[10px]">
                            {opt.orderIndex}
                          </span>
                          <div>
                            <KaTeXRenderer content={opt.text} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* فضای خالی جهت حل روی کاغذ برای سوالات تشریحی */}
                  {q.type === "DESCRIPTIVE" && (
                    <div className="h-28 border border-dashed border-slate-300 rounded-xl p-3 text-[11px] text-slate-400">
                      محل نوشتن راه‌حل و محاسبات دانش‌آموز...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* پانویس برگه آزمون */}
            <div className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
              «موفقیت حاصل تداوم در تلاش هوشمندانه است» — دبیرستان علامه حلی ۱
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
