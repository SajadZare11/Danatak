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
  const [title, setTitle] = useState("آزمون تستی آنلاین جامع فصل مشتق و حد");
  const [description, setDescription] = useState("آزمون رسمی آنلاین با فعال بودن سیستم ضدتقلب و ثبت در پورتفولیو");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isSequential, setIsSequential] = useState(false);
  const [enableAntiCheat, setEnableAntiCheat] = useState(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);

  // سوالات انتخابی از بانک
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
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

  // واکشی سوالات تستی برای آزمون
  useEffect(() => {
    if (!isOpen) return;
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const url = selectedTopicId ? `/api/questions?topicId=${selectedTopicId}` : "/api/questions";
        const res = await fetch(url);
        const data = await res.json();
        const mcq = (data.questions || []).filter(
          (q: any) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"
        );
        setAvailableQuestions(mcq);
        // به صورت پیش‌فرض تمام سوالات را تیک می‌زنیم یا ۵ تای اول
        setSelectedQuestionIds(mcq.slice(0, 10).map((q: any) => q.id));
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert("لطفاً حداقل ۱ سوال برای آزمون انتخاب کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
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
          enableAntiCheat,
          maxTabSwitches,
          questionIds: selectedQuestionIds,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* هدر مودال */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                طراحی آزمون آنلاین فوق‌پیشرفته و ضدتقلب (Zero-Cheat Exam)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                کلاس هدف: {classroomName} • امنیت مرورگر، واترمارک شناور و تصحیح خودکار کنکوری
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم تنظیمات */}
        <form onSubmit={handleCreateExam} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">عنوان آزمون:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">مبحث کتاب درسی:</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
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

          {/* تنظیمات زمان و مدت آزمون */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                مدت زمان آزمون (دقیقه):
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-center font-black text-indigo-700 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                حداکثر خروج از تب مجاز:
              </label>
              <select
                value={maxTabSwitches}
                onChange={(e) => setMaxTabSwitches(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value={1}>۱ بار (بسیار سخت‌گیرانه)</option>
                <option value={2}>۲ بار</option>
                <option value={3}>۳ بار اخطار (پیش‌فرض استاندارد)</option>
                <option value={5}>۵ بار</option>
              </select>
            </div>

            <div className="flex flex-col justify-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={enableAntiCheat}
                  onChange={(e) => setEnableAntiCheat(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                فعال‌سازی قفل تمام‌صفحه و واترمارک
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isSequential}
                  onChange={(e) => setIsSequential(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                ناوبری ترتیبی (عدم امکان بازگشت به سوال قبل)
              </label>
            </div>
          </div>

          {/* انتخاب سوالات آزمون از بانک سوالات */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-600" />
                انتخاب سوالات آزمون ({selectedQuestionIds.length} سوال انتخاب شده):
              </label>
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

            {loadingQuestions ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[11px] text-slate-500 font-bold mt-2">در حال بارگذاری سوالات...</p>
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">سوالی در این مبحث یافت نشد.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                {availableQuestions.map((q, idx) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelectQuestion(q.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {q.topic?.title || "حسابان"}
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
                        <div className="text-xs text-slate-800 line-clamp-2">
                          <KaTeXRenderer content={q.content} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* دکمه‌های پایانی ثبت */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              بارم هر سوال به صورت خودکار از ۲۰ نمره کل تقسیم‌بندی خواهد شد.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedQuestionIds.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl font-black text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "در حال استقرار..." : "تایید و فعال‌سازی اتاق آزمون ضدتقلب 🚀"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
