"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  ShieldAlert,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Layers,
  Eye,
  Sliders,
  Check,
  Maximize2,
  Copy,
  Shuffle,
  ArrowRight,
  HelpCircle,
  FileText,
  CheckSquare,
  PenTool,
  RotateCcw,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface ExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  teacherId: string;
  textbooks: Array<{
    id: string;
    title: string;
    topics: Array<{
      id: string;
      title: string;
      subTopics?: Array<{ id: string; title: string }>;
    }>;
  }>;
  onSuccess?: () => void;
}

export const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  teacherId,
  textbooks,
  onSuccess,
}) => {
  const [title, setTitle] = useState("آزمون جامع آنلاین فصل مشتق و حد");
  const [description, setDescription] = useState("آزمون رسمی آنلاین با فعال بودن سیستم ضدتقلب و ثبت در پورتفولیو");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);

  // تنظیمات تفکیکی و دقیق ضدتقلب (Teacher-selectable Granular Anti-Cheat Controls)
  const [enableFullscreen, setEnableFullscreen] = useState(true);
  const [detectTabSwitch, setDetectTabSwitch] = useState(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isSequential, setIsSequential] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(true);

  // سوالات انتخابی از بانک
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استخراج تمام زیرمباحث برای منوی درختی
  const flatTopics: Array<{ id: string; title: string; book: string }> = [];
  textbooks.forEach((book) => {
    book.topics.forEach((t) => {
      if (t.subTopics && t.subTopics.length > 0) {
        t.subTopics.forEach((st) => {
          flatTopics.push({
            id: st.id,
            title: `${t.title} ⬅ ${st.title}`,
            book: book.title,
          });
        });
      } else {
        flatTopics.push({
          id: t.id,
          title: t.title,
          book: book.title,
        });
      }
    });
  });

  // واکشی تمام انواع سوالات برای آزمون (تستی، صحیح/غلط، تشریحی، جای‌خالی)
  useEffect(() => {
    if (!isOpen) return;
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const url = selectedTopicId ? `/api/questions?topicId=${selectedTopicId}` : "/api/questions";
        const res = await fetch(url);
        const data = await res.json();
        const allQuestions = data.questions || [];
        setAvailableQuestions(allQuestions);
        // به صورت پیش‌فرض تمام سوالات یا ۱۰ تای اول انتخاب می‌شوند
        setSelectedQuestionIds(allQuestions.slice(0, 10).map((q: any) => q.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [isOpen, selectedTopicId]);

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  // اعمال پیش‌تنظیم‌های امنیتی سریع
  const applyPreset = (preset: "strict" | "standard" | "practice") => {
    if (preset === "strict") {
      setEnableFullscreen(true);
      setDetectTabSwitch(true);
      setMaxTabSwitches(2);
      setDisableCopyPaste(true);
      setEnableWatermark(true);
      setShuffleQuestions(true);
      setShuffleOptions(true);
      setIsSequential(true);
      setNegativeMarking(true);
    } else if (preset === "standard") {
      setEnableFullscreen(true);
      setDetectTabSwitch(true);
      setMaxTabSwitches(3);
      setDisableCopyPaste(true);
      setEnableWatermark(true);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setIsSequential(false);
      setNegativeMarking(true);
    } else {
      setEnableFullscreen(false);
      setDetectTabSwitch(false);
      setMaxTabSwitches(5);
      setDisableCopyPaste(false);
      setEnableWatermark(false);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setIsSequential(false);
      setNegativeMarking(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert("لطفاً حداقل ۱ سوال برای آزمون انتخاب کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const antiCheatSettings = {
        enableFullscreen,
        detectTabSwitch,
        maxTabSwitches,
        disableCopyPaste,
        enableWatermark,
        shuffleQuestions,
        shuffleOptions,
        isSequential,
        negativeMarking,
      };

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          classroomId,
          teacherId,
          topicId: selectedTopicId || null,
          durationMinutes,
          isSequential,
          enableAntiCheat: detectTabSwitch || enableFullscreen,
          maxTabSwitches,
          questionIds: selectedQuestionIds,
          antiCheatSettings,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data.error || "خطا در تعریف آزمون");
      }
    } catch (err) {
      console.error(err);
      alert("خطای غیرمنتظره در ایجاد آزمون");
    } finally {
      setIsSubmitting(false);
    }
  };

  // فیلتر کردن سوالات بر اساس نوع انتخاب شده در تب‌ها
  const displayedQuestions = availableQuestions.filter((q) => {
    if (selectedTypeFilter === "ALL") return true;
    return q.type === selectedTypeFilter;
  });

  // آمار انواع سوالات
  const countMCQ = availableQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const countTF = availableQuestions.filter((q) => q.type === "TRUE_FALSE").length;
  const countDesc = availableQuestions.filter((q) => q.type === "DESCRIPTIVE").length;
  const countBlank = availableQuestions.filter((q) => q.type === "FILL_BLANK").length;

  const selectedQuestions = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  const selectedMCQ = selectedQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const selectedTF = selectedQuestions.filter((q) => q.type === "TRUE_FALSE").length;
  const selectedDesc = selectedQuestions.filter((q) => q.type === "DESCRIPTIVE").length;
  const selectedBlank = selectedQuestions.filter((q) => q.type === "FILL_BLANK").length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return {
          label: "چهارگزینه‌ای (تستی)",
          icon: <CheckSquare className="w-3 h-3" />,
          style: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "TRUE_FALSE":
        return {
          label: "صحیح / غلط",
          icon: <HelpCircle className="w-3 h-3" />,
          style: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "DESCRIPTIVE":
        return {
          label: "تشریحی / بازپاسخ",
          icon: <FileText className="w-3 h-3" />,
          style: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "FILL_BLANK":
        return {
          label: "جای‌خالی / کوتاه‌پاسخ",
          icon: <PenTool className="w-3 h-3" />,
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          label: "تستی",
          icon: <CheckSquare className="w-3 h-3" />,
          style: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* هدر مودال */}
        <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black flex items-center gap-2">
                طراحی آزمون آنلاین فوق‌پیشرفته و چندنوعی (Zero-Cheat Exam Room)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                کلاس هدف: {classroomName} • پشتیبانی از ۴ نوع سوال، قفل ضدتقلب با انتخاب معلم و تصحیح هوشمند
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم تنظیمات */}
        <form onSubmit={handleCreateExam} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 text-xs text-slate-800">
          {/* بخش ۱: اطلاعات پایه آزمون */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">عنوان آزمون:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 md:p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">مبحث کتاب درسی:</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-2.5 md:p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 text-xs"
              >
                <option value="">تمام مباحث و سرفصل‌ها</option>
                {flatTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.book}: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* بخش ۲: تنظیمات پیشرفته و گزینه‌های ضدتقلب (Teacher Selectable Controls) */}
          <div className="bg-slate-50/80 rounded-3xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-xs md:text-sm">
                    گزینه‌های پیشگیری از تقلب و امنیت آزمون (Anti-Cheat Suite)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    معلم گرامی، تدابیر امنیتی و محدودیت‌های مورد نظر خود را برای این آزمون تیک بزنید.
                  </p>
                </div>
              </div>

              {/* پیش‌تنظیم‌های سریع */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold px-2">الگوها:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("strict")}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                >
                  کنکوری سخت‌گیرانه
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("standard")}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                >
                  استاندارد کلاسی
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("practice")}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  آزمونک سبک
                </button>
              </div>
            </div>

            {/* کارت‌های چک‌باکس گزینه‌های ضدتقلب */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* ۱. قفل تمام‌صفحه */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  enableFullscreen
                    ? "bg-rose-50/70 border-rose-200 ring-1 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableFullscreen}
                  onChange={(e) => setEnableFullscreen(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-rose-600" />
                    قفل تمام‌صفحه اجباری
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    اجبار دانش‌آموز به حالت Fullscreen هنگام ورود و هشدار در صورت خروج
                  </span>
                </div>
              </label>

              {/* ۲. رصد خروج از تب */}
              <div
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                  detectTabSwitch
                    ? "bg-rose-50/70 border-rose-200 ring-1 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <label className="cursor-pointer flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={detectTabSwitch}
                    onChange={(e) => setDetectTabSwitch(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      شمارش خروج از تب
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      ثبت لاگ و اخطار تخلف هنگام ترک تب آزمون
                    </span>
                  </div>
                </label>

                {detectTabSwitch && (
                  <div className="mt-2 pt-2 border-t border-rose-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">سقف مجاز اخطار:</span>
                    <select
                      value={maxTabSwitches}
                      onChange={(e) => setMaxTabSwitches(Number(e.target.value))}
                      className="p-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-rose-700"
                    >
                      <option value={1}>۱ اخطار (قطع فوری)</option>
                      <option value={2}>۲ اخطار</option>
                      <option value={3}>۳ اخطار (پیش‌فرض)</option>
                      <option value={5}>۵ اخطار</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ۳. مسدودسازی کپی و پیست */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  disableCopyPaste
                    ? "bg-rose-50/70 border-rose-200 ring-1 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={disableCopyPaste}
                  onChange={(e) => setDisableCopyPaste(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5 text-rose-600" />
                    مسدودسازی کپی/پیست
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    غیرفعال‌سازی راست‌کلیک، کپی متن سوال و کلیدهای میانبر F12 و Ctrl+C/V
                  </span>
                </div>
              </label>

              {/* ۴. واترمارک امنیتی متحرک */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  enableWatermark
                    ? "bg-rose-50/70 border-rose-200 ring-1 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-rose-600" />
                    واترمارک شناور کدملی
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    نمایش شناور کدملی و نام دانش‌آموز روی صفحه جهت جلوگیری از عکس‌برداری
                  </span>
                </div>
              </label>

              {/* ۵. بهم‌ریختن تصادفی سوالات */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  shuffleQuestions
                    ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                    ترتیب تصادفی سوالات
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    نمایش سوالات با ترتیب متفاوت برای هر دانش‌آموز جهت جلوگیری از همیاری
                  </span>
                </div>
              </label>

              {/* ۶. بهم‌ریختن تصادفی گزینه‌ها */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  shuffleOptions
                    ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    بهم‌ریختن گزینه‌ها
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    تغییر ترتیب گزینه‌های ۱ تا ۴ در سوالات تستی برای هر دانش‌آموز
                  </span>
                </div>
              </label>

              {/* ۷. ناوبری ترتیبی خطی */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  isSequential
                    ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSequential}
                  onChange={(e) => setIsSequential(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                    ناوبری خطی (بدون بازگشت)
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    دانش‌آموز پس از عبور از هر سوال، امکان بازگشت و تغییر پاسخ را ندارد
                  </span>
                </div>
              </label>

              {/* ۸. نمره منفی کنکوری */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  negativeMarking
                    ? "bg-emerald-50/70 border-emerald-200 ring-1 ring-emerald-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    نمره منفی کنکوری (۱/۳)
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    کسر یک‌سوم نمره به ازای هر پاسخ نادرست در تستی‌ها و محاسبه تراز سنجش
                  </span>
                </div>
              </label>
            </div>

            {/* مدت زمان */}
            <div className="pt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-700">مدت زمان آزمون:</span>
              </div>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-24 p-2 rounded-xl border border-slate-300 text-center font-black text-indigo-700 bg-white"
              />
              <span className="text-slate-500 font-medium">دقیقه</span>
            </div>
          </div>

          {/* بخش ۳: انتخاب سوالات آزمون با فیلتر انواع سوالات (MCQ, True/False, Descriptive, Fill-Blank) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-black text-slate-900 flex items-center gap-2 text-xs md:text-sm">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  انتخاب سوالات آزمون ({selectedQuestionIds.length} سوال انتخاب شده):
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ترکیب فعلی: {selectedMCQ} تستی • {selectedTF} صحیح/غلط • {selectedDesc} تشریحی • {selectedBlank} جای‌خالی
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuestionIds(
                      selectedQuestionIds.length === availableQuestions.length
                        ? []
                        : availableQuestions.map((q) => q.id)
                    )
                  }
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  {selectedQuestionIds.length === availableQuestions.length
                    ? "لغو انتخاب همه"
                    : "انتخاب همه سوالات"}
                </button>
              </div>
            </div>

            {/* نوار تب فیلتر انواع سوالات */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTypeFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>همه سوالات</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-200">
                  {availableQuestions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTypeFilter("MULTIPLE_CHOICE")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTypeFilter === "MULTIPLE_CHOICE"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>چهارگزینه‌ای (تستی)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                  {countMCQ}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTypeFilter("TRUE_FALSE")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTypeFilter === "TRUE_FALSE"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>صحیح / غلط</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                  {countTF}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTypeFilter("DESCRIPTIVE")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTypeFilter === "DESCRIPTIVE"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تشریحی (پاسخ باز)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                  {countDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTypeFilter("FILL_BLANK")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTypeFilter === "FILL_BLANK"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>جای‌خالی (کوتاه‌پاسخ)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                  {countBlank}
                </span>
              </button>
            </div>

            {/* لیست سوالات */}
            {loadingQuestions ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[11px] text-slate-500 font-bold mt-2">در حال بارگذاری سوالات از بانک سوالات...</p>
              </div>
            ) : displayedQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">سوالی در این دسته‌بندی یافت نشد.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto p-1">
                {displayedQuestions.map((q, idx) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  const typeBadge = getTypeBadge(q.type);

                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelectQuestion(q.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        isChecked
                          ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded text-rose-600 w-4 h-4"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>

                          {/* نشانگر نوع سوال */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${typeBadge.style}`}
                          >
                            {typeBadge.icon}
                            {typeBadge.label}
                          </span>

                          <span className="text-[11px] font-bold text-slate-600">
                            {q.topic?.title || "ریاضی و حسابان"}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              q.difficulty === "HARD"
                                ? "bg-rose-100 text-rose-700"
                                : q.difficulty === "MEDIUM"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {q.difficulty === "HARD"
                              ? "دشوار"
                              : q.difficulty === "MEDIUM"
                              ? "متوسط"
                              : "ساده"}
                          </span>
                        </div>

                        {/* صورت سوال با KaTeX */}
                        <div className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                          <KaTeXRenderer content={q.content} />
                        </div>

                        {/* پیش‌نمایش گزینه‌ها بر حسب نوع سوال */}
                        {q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0 && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {q.options.length} گزینه تستی تعریف شده
                          </div>
                        )}
                        {q.type === "TRUE_FALSE" && (
                          <div className="text-[10px] text-sky-600 font-medium">
                            دو گزینه‌ای (صحیح / غلط)
                          </div>
                        )}
                        {q.type === "FILL_BLANK" && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            پاسخ صحیح کلید:{" "}
                            {q.options?.find((o: any) => o.isCorrect)?.optionText || "متن کلیدی"}
                          </div>
                        )}
                        {q.type === "DESCRIPTIVE" && (
                          <div className="text-[10px] text-amber-800 font-medium">
                            پاسخ تشریحی • ارسال مستقیم به کارتابل تصحیح دبیر
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* دکمه‌های پایانی ثبت */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium text-center sm:text-right">
              بارم هر سوال به صورت خودکار از ۲۰ نمره کل محاسبه شده و سوالات تشریحی در کارتابل دبیر قرار خواهند گرفت.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedQuestionIds.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl font-black text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                {isSubmitting ? "در حال ایجاد آزمون..." : "تایید و ایجاد اتاق آزمون ضدتقلب 🚀"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
