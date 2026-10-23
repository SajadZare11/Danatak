"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  FileText,
  CheckCircle,
  Eye,
  Settings2,
  BookOpen,
  Award,
  Layers,
} from "lucide-react";
import { StudyPackDetail } from "@/lib/study-studio/types";

interface WorksheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyPack: StudyPackDetail;
}

export const WorksheetPrintModal: React.FC<WorksheetPrintModalProps> = ({
  isOpen,
  onClose,
  studyPack,
}) => {
  const [printMode, setPrintMode] = useState<"student" | "teacher">("student");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeGlossary, setIncludeGlossary] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const primaryQuiz = studyPack.quizzes?.[0];
  const questions = primaryQuiz?.questions || [];

  const summary = studyPack.summary || (studyPack.summaryJson ? JSON.parse(studyPack.summaryJson) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* استایل‌های اختصاصی پرینت بدون کادرهای اضافی و متناسب با استاندارد کاغذ A4 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-worksheet,
          #printable-worksheet * {
            visibility: visible;
          }
          #printable-worksheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 15mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-4xl w-full h-[95vh] flex flex-col overflow-hidden">
        {/* نوار تنظیمات و دکمه‌های کنترل پرینت (در حالت پرینت مخفی می‌شود) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                خروجی پرینت و PDF استاندارد A4 (کاربرگ و آزمون)
              </h3>
              <p className="text-[11px] text-slate-400">
                پیکربندی برگه امتحانی و پاسخ‌نامه تشریحی بر اساس مبحث {studyPack.topicTag}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* انتخاب حالت برگه: دانش‌آموز در برابر دبیر */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintMode("student")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  printMode === "student"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                برگه آزمون (دانش‌آموز)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("teacher")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  printMode === "teacher"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                کلید و پاسخ تشریحی (دبیر)
              </button>
            </div>

            {/* دکمه پرینت */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              پرینت یا ذخیره PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* سوییچ‌های تکمیلی تنظیمات */}
        <div className="no-print bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-6 text-xs text-slate-700 font-bold">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span>ضمیمه شدن درس‌نامه و خلاصه مبحث در ابتدای برگه</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGlossary}
              onChange={(e) => setIncludeGlossary(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span>ضمیمه شدن واژه‌نامه تخصصی و تعاریف کلیدی</span>
          </label>
        </div>

        {/* ناحیه قابل پرینت (Printable Container) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/60 flex justify-center">
          <div
            id="printable-worksheet"
            className="bg-white max-w-[210mm] w-full min-h-[297mm] p-10 rounded-2xl shadow-xl border border-slate-300 text-slate-900 font-sans space-y-6 text-right"
            dir="rtl"
          >
            {/* سربرگ رسمی وزارت آموزش و پرورش */}
            <div className="border-2 border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-600">جمهوری اسلامی ایران</div>
                  <div className="text-xs font-bold text-slate-700">وزارت آموزش و پرورش</div>
                  <div className="text-sm font-black text-slate-900">
                    دبیرستان علامه حلی ۱ تهران (دوره دوم تیزهوشان)
                  </div>
                </div>

                {/* آرم / عنوان وسط */}
                <div className="text-center space-y-1">
                  <div className="text-base font-black text-slate-950">
                    {printMode === "student" ? "برگه سوالات آزمون و کاربرگ درسی" : "کلید و راهنمای تصحیح تشریحی دبیر"}
                  </div>
                  <div className="text-xs font-bold text-indigo-700">
                    مبحث: {studyPack.title}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    سال تحصیلی ۱۴۰۳-۱۴۰۴
                  </div>
                </div>

                <div className="text-left space-y-1 text-xs">
                  <div>تاریخ آزمون: <span className="font-mono font-bold">۱۴۰۳/۰۸/۰۱</span></div>
                  <div>مدت پاسخگویی: <span className="font-mono font-bold">۴۵ دقیقه</span></div>
                  <div>تعداد صفحات: <span className="font-mono font-bold">۲ برگ</span></div>
                </div>
              </div>

              {/* کادر مشخصات داوطلب */}
              <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">نام و نام‌خانوادگی: </span>
                  <span className="font-bold border-b border-dotted border-slate-400 pb-0.5 inline-block w-28">
                    {printMode === "teacher" ? "نسخه رسمی دبیر" : "........................"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">شماره داوطلب / کدملی: </span>
                  <span className="font-bold border-b border-dotted border-slate-400 pb-0.5 inline-block w-24 font-mono">
                    {printMode === "teacher" ? "کلید آزمون" : "................"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">پایه و رشته: </span>
                  <span className="font-bold">دوازدهم ریاضی و فیزیک</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500">نمره نهایی: </span>
                  <span className="font-bold border border-slate-400 px-4 py-0.5 rounded inline-block font-mono">
                    {printMode === "teacher" ? "۲۰ / ۲۰" : "..... از ۲۰"}
                  </span>
                </div>
              </div>
            </div>

            {/* بخش خلاصه درس و نکات طلایی (در صورت انتخاب) */}
            {includeSummary && summary && (
              <div className="page-break-avoid p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-2">
                <div className="text-xs font-black text-indigo-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  درس‌نامه فشرده و نکات کلیدی آزمون:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {summary.overview}
                </p>
                {summary.keyTakeaways && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
                    {summary.keyTakeaways.slice(0, 4).map((t: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* جدول کلید تستی (فقط در حالت دبیر) */}
            {printMode === "teacher" && (
              <div className="page-break-avoid p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-2">
                <div className="text-xs font-black text-emerald-950 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  جدول کلید سریع پاسخ‌های چهارگزینه‌ای:
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="px-3 py-1 bg-white border border-emerald-400 rounded-lg flex items-center gap-2 font-bold"
                    >
                      <span className="text-slate-500 font-sans">سوال {idx + 1}:</span>
                      <span className="text-emerald-700 font-black">
                        گزینه {q.correctAnswer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* بخش سوالات آزمون */}
            <div className="space-y-6">
              <div className="text-xs font-black text-slate-900 border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                <span>سوالات آزمون تشخیصی و کاربرگ تمرین ({questions.length} سوال)</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  لطفاً پاسخ صحیح را در کادر مربوطه علامت بزنید.
                </span>
              </div>

              {questions.map((q, idx) => {
                const options = (q.optionsJson ? JSON.parse(q.optionsJson) : []) as string[];

                return (
                  <div
                    key={q.id}
                    className="page-break-avoid p-3.5 rounded-xl border border-slate-200 bg-white space-y-3"
                  >
                    {/* صورت سوال */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="pt-0.5" dir="auto">{q.questionText}</div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 font-mono">
                        <span>بارم:</span>
                        <span className="font-bold border border-slate-300 px-1.5 py-0.5 rounded">
                          {(20 / Math.max(1, questions.length)).toFixed(1)} نمره
                        </span>
                      </div>
                    </div>

                    {/* گزینه‌های چهارگزینه‌ای */}
                    {options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pr-8">
                        {options.map((opt, optIdx) => {
                          const optNumber = (optIdx + 1).toString();
                          const isCorrect = printMode === "teacher" && q.correctAnswer === optNumber;

                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg border flex items-center gap-2.5 transition ${
                                isCorrect
                                  ? "bg-emerald-100/90 border-emerald-500 font-black text-emerald-950"
                                  : "bg-slate-50/60 border-slate-200 text-slate-800"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-mono shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-slate-400 bg-white"
                                }`}
                              >
                                {isCorrect ? "✓" : optNumber}
                              </div>
                              <span dir="auto">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* تحلیل و پاسخ تشریحی (فقط در حالت دبیر) */}
                    {printMode === "teacher" && (
                      <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                        <div className="font-bold text-emerald-900 flex items-center justify-between">
                          <span>پاسخ‌نامه تشریحی و راهنمای حل:</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-sans">
                            سطح شناختی بلوم: {q.bloomLevel || "تحلیل و کاربرد"}
                          </span>
                        </div>
                        <p className="text-emerald-950 leading-relaxed text-justify text-[11px]" dir="auto">
                          {q.explanation || "پاسخ صحیح بر اساس تعاریف استاندارد سرفصل آموزشی محاسبه شده است."}
                        </p>
                      </div>
                    )}

                    {/* فضای پاسخ برای حالت دانش‌آموز (اگر سوال تستی نباشد یا برای نوشتن محاسبات) */}
                    {printMode === "student" && (
                      <div className="pt-1 text-[10px] text-slate-400 border-t border-dotted border-slate-200 flex justify-between items-center">
                        <span>محل انجام محاسبات و چک‌نویس داوطلب:</span>
                        <span className="font-mono">....................................................................</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* بخش واژه‌نامه تخصصی (در صورت انتخاب) */}
            {includeGlossary && summary?.glossary && (
              <div className="page-break-avoid p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-2 mt-6">
                <div className="text-xs font-black text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  واژه‌نامه اصطلاحات تخصصی و فرمول‌ها:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {summary.glossary.map((g: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-black text-indigo-900">{g.term}: </span>
                      <span className="text-slate-600 text-[11px]">{g.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* پاورقی آزمون */}
            <div className="border-t border-slate-300 pt-3 text-[11px] text-slate-500 flex justify-between items-center">
              <span>سامانه هوشمند مدیریت آموزشی مدارس و استودیوی یادگیری هوش مصنوعی</span>
              <span>«موفق و پیروز باشید»</span>
              <span className="font-mono">صفحه ۱ از ۱</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
