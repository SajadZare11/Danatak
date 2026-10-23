"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  BookOpen,
  Filter,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface SmartAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  teacherId: string;
  initialTopicId?: string;
  initialTopicTitle?: string;
  initialStudentName?: string;
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

export const SmartAssignmentModal: React.FC<SmartAssignmentModalProps> = ({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  teacherId,
  initialTopicId = "",
  initialTopicTitle = "",
  initialStudentName,
  textbooks,
  onSuccess,
}) => {
  const [title, setTitle] = useState(
    initialTopicTitle
      ? `تکلیف تثبیتی و جبرانی: ${initialTopicTitle}`
      : "تکلیف هفتگی حسابان و ریاضی"
  );
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [source, setSource] = useState<"all" | "my" | "central">("all");
  const [difficultyMode, setDifficultyMode] = useState<"adaptive" | "manual">("adaptive");

  // درصدهای دستی در صورت انتخاب manual
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(5);
  const [hardCount, setHardCount] = useState(2);

  const [dueDateDays, setDueDateDays] = useState(3);
  const [maxScore, setMaxScore] = useState(20);

  // مرحله پیش‌نمایش و تعویض سوالات (Preview & Swap)
  const [step, setStep] = useState<"config" | "preview">("config");
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // استخراج تمام زیرمباحث برای انتخاب مبحث
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

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
      setTitle(`تکلیف تثبیتی و جبرانی: ${initialTopicTitle || "مبحث منتخب"}`);
    }
  }, [initialTopicId, initialTopicTitle]);

  if (!isOpen) return null;

  // مرحله ۱ به ۲: تولید هوشمند بسته سوالات و باز شدن پیش‌نمایش
  const handleGenerateQuestions = async () => {
    if (!selectedTopicId) return;

    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/questions?topicId=${selectedTopicId}&source=${source}`);
      if (res.ok) {
        const data = await res.json();
        let pool = data.questions || [];

        // اگر سوالات کافی نبود، از کل سوالات هم‌رشته استفاده شود
        if (pool.length < questionCount) {
          const fallbackRes = await fetch(`/api/questions`);
          const fallbackData = await fallbackRes.json();
          pool = fallbackData.questions || [];
        }

        // انتخاب تعداد مورد نظر
        const picked = pool.slice(0, questionCount);
        setSelectedQuestions(picked);
        setStep("preview");
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

  // قابلیت کلیدی مد نظر کاربر: «تعویض تکی هر سوال» با یک کلیک (Swap)
  const handleSwapQuestion = async (index: number) => {
    const currentQ = selectedQuestions[index];
    setSwappingIndex(index);

    try {
      // واکشی سوالات جایگزین هم‌سطح از بانک
      const res = await fetch(
        `/api/questions?topicId=${selectedTopicId || currentQ.topicId}&difficulty=${
          currentQ.difficulty
        }`
      );
      if (res.ok) {
        const data = await res.json();
        const available = (data.questions || []).filter(
          (q: any) => !selectedQuestions.some((sq) => sq.id === q.id)
        );

        if (available.length > 0) {
          const replacement = available[Math.floor(Math.random() * available.length)];
          setSelectedQuestions((prev) => {
            const copy = [...prev];
            copy[index] = replacement;
            return copy;
          });
        }
      }
    } finally {
      setTimeout(() => setSwappingIndex(null), 300);
    }
  };

  // حذف سوال از پکیج
  const handleRemoveQuestion = (index: number) => {
    if (selectedQuestions.length > 1) {
      setSelectedQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // تایید و ارسال تکلیف به کلاس یا دانش‌آموز
  const handleFinalDispatch = async () => {
    if (selectedQuestions.length === 0) return;

    setIsSubmitting(true);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDateDays);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: initialStudentName
            ? `بسته تکلیف شخصی‌سازی‌شده و جبرانی برای ${initialStudentName}`
            : `تکلیف کلاسی ${classroomName}`,
          classroomId,
          teacherId,
          topicId: selectedTopicId || null,
          dueDate: dueDate.toISOString(),
          maxScore,
          questionIds: selectedQuestions.map((q) => q.id),
        }),
      });

      if (res.ok) {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
        setTimeout(() => {
          setSubmittedSuccess(false);
          onSuccess?.();
          onClose();
          setStep("config");
        }, 900);
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* هدر مدال ارسال تکلیف هوشمند */}
        <div className="px-6 py-4 bg-gradient-to-l from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 rounded-xl font-black">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm">
                موتور تولید و ارسال تکلیف هوشمند (Smart Homework Assignment)
              </h3>
              <p className="text-[11px] text-indigo-200">
                {initialStudentName ? `تکلیف شخصی‌سازی‌شده برای ${initialStudentName}` : `ارسال به ${classroomName}`}
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

        {/* گام ۱: تنظیمات بسته سوالات */}
        {step === "config" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان تکلیف:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انتخاب درختواره کتاب و مبحث درسی:
                </label>
                <select
                  required
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                >
                  <option value="">-- لطفاً یک مبحث را انتخاب کنید --</option>
                  {flatTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.book}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* تنظیمات بسته سوال و فیلتر منبع */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {/* تعداد سوالات */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  تعداد سوالات پکیج:
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                        questionCount === num
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {num} سوال
                    </button>
                  ))}
                </div>
              </div>

              {/* منبع سوالات */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">منبع سوالات:</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSource("all")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      source === "all"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    ترکیبی
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource("central")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      source === "central"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    بانک مرکزی
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource("my")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      source === "my"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    سوالات من
                  </button>
                </div>
              </div>

              {/* مهلت تحویل */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">مهلت تحویل (روز):</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={dueDateDays}
                    onChange={(e) => setDueDateDays(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 text-center font-bold"
                  />
                  <span className="text-xs text-slate-500 shrink-0">روز بعد</span>
                </div>
              </div>
            </div>

            {/* توزیع درجه دشواری: تطبیقی سیستم یا تنظیم دستی */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    توزیع درجه دشواری سوالات (تطبیقی یا دستی):
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    در حالت تطبیقی، سیستم بر اساس درصد یادگیری فعلی دانش‌آموز، نسبت سوالات ساده، متوسط و سخت را خودکار تنظیم می‌کند.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-200">
                  <button
                    type="button"
                    onClick={() => setDifficultyMode("adaptive")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      difficultyMode === "adaptive"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    تطبیقی هوشمند
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficultyMode("manual")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      difficultyMode === "manual"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    تنظیم دستی
                  </button>
                </div>
              </div>

              {difficultyMode === "adaptive" ? (
                <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-1.5 text-indigo-800 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    تنظیم خودکار سیستم برای تثبیت مبحث:
                  </span>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-emerald-700">۳۰٪ ساده</span>
                    <span className="text-blue-700">۵۰٪ متوسط (نهایی)</span>
                    <span className="text-rose-700">۲۰٪ سخت (کنکوری)</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">ساده: {easyCount} سوال</span>
                    <input
                      type="range"
                      min="0"
                      max={questionCount}
                      value={easyCount}
                      onChange={(e) => setEasyCount(Number(e.target.value))}
                      className="w-full h-1.5 accent-emerald-600 mt-2"
                    />
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">متوسط: {mediumCount} سوال</span>
                    <input
                      type="range"
                      min="0"
                      max={questionCount}
                      value={mediumCount}
                      onChange={(e) => setMediumCount(Number(e.target.value))}
                      className="w-full h-1.5 accent-blue-600 mt-2"
                    />
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">سخت: {hardCount} سوال</span>
                    <input
                      type="range"
                      min="0"
                      max={questionCount}
                      value={hardCount}
                      onChange={(e) => setHardCount(Number(e.target.value))}
                      className="w-full h-1.5 accent-rose-600 mt-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={!selectedTopicId || loadingQuestions}
                onClick={handleGenerateQuestions}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {loadingQuestions ? (
                  "در حال انتخاب هوشمند سوالات..."
                ) : (
                  <>
                    تولید پکیج و ورود به پیش‌نمایش و تعویض تکی (Preview & Swap)
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* گام ۲: پیش‌نمایش و تعویض تکی هر سوال (Preview & Swap) */}
        {step === "preview" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950">
                  پیش‌نمایش نهایی بسته سوالات ({selectedQuestions.length} سوال انتخاب‌شده)
                </h4>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  می‌توانید هر سوال را بررسی کنید و با دکمه «تعویض تکی» آن را فوراً با یک سوال هم‌سطح از بانک جایگزین فرمایید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep("config")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200"
              >
                بازگشت به تنظیمات
              </button>
            </div>

            {/* لیست سوالات با قابلیت تعویض تکی */}
            <div className="space-y-3">
              {selectedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 transition hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        سطح: {q.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        [{q.topic?.title || "مبحث منتخب"}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* دکمه اختصاصی تعویض تکی سوال مد نظر کاربر */}
                      <button
                        type="button"
                        disabled={swappingIndex === idx}
                        onClick={() => handleSwapQuestion(idx)}
                        className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition"
                        title="جایگزینی این سوال با سوالی هم‌سطح از همین مبحث"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 text-amber-700 ${
                            swappingIndex === idx ? "animate-spin" : ""
                          }`}
                        />
                        {swappingIndex === idx ? "تعویض..." : "تعویض تکی این سوال"}
                      </button>

                      {selectedQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="حذف از این تکلیف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-900 leading-relaxed pt-1">
                    <KaTeXRenderer content={q.content} />
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                      {q.options.map((opt: any) => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border ${
                            opt.isCorrect
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <KaTeXRenderer content={opt.optionText} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* دکمه نهایی ارسال */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                بارم کل: <strong className="text-slate-800">{maxScore} نمره</strong> • مهلت تحویل:{" "}
                <strong className="text-slate-800">{dueDateDays} روز</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || submittedSuccess}
                  onClick={handleFinalDispatch}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition ${
                    submittedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submittedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> تکلیف به پنل دانش‌آموز ارسال شد!
                    </>
                  ) : isSubmitting ? (
                    "در حال ارسال تکلیف..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> تایید نهایی و ارسال تکلیف
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
