"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import { QuestionCard, QuestionItem } from "@/components/questions/QuestionCard";
import { QuestionFilterBar } from "@/components/questions/QuestionFilterBar";
import { QuestionEditorModal } from "@/components/questions/QuestionEditorModal";
import { BulkImportModal } from "@/components/questions/BulkImportModal";
import {
  BookOpen,
  PlusCircle,
  UploadCloud,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  SearchX,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

export default function QuestionBankPage() {
  const { currentUser } = useRole();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // فیلترها
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("all");

  // مودال‌ها
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedGrade !== "ALL") params.append("gradeLevel", selectedGrade);
      if (selectedDifficulty !== "ALL") params.append("difficulty", selectedDifficulty);
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (selectedSource !== "all") params.append("source", selectedSource);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (currentUser?.id) params.append("authorId", currentUser.id);

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTextbooks(data.textbooks || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedGrade, selectedDifficulty, selectedType, selectedSource, searchQuery]);

  // شمارش‌ها
  const mcqCount = questions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const descriptiveCount = questions.filter((q) => q.type === "DESCRIPTIVE").length;
  const hardCount = questions.filter((q) => q.difficulty === "HARD" || q.difficulty === "OLYMPIAD").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast اعلان */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* هدر بانک سوالات و دکمه‌های اقدام */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              بانک سوالات طبقه‌بندی‌شده و محتواساز معلم (Question Bank Engine)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            دسته‌بندی چندسطحی بر اساس پایه، کتاب و مبحث • فرمول‌نویس ریاضی KaTeX • پاسخنامه کلیدی و تشریحی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
          >
            <UploadCloud className="w-4 h-4" /> ورود گروهی (Bulk)
          </button>

          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" /> طراحی سوال جدید با KaTeX
          </button>
        </div>
      </div>

      {/* نوارهای آماری مخزن سوالات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">کل سوالات مخزن</span>
            <strong className="text-lg font-black text-slate-900 font-mono">{questions.length}</strong>
          </div>
          <BookOpen className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">تستی ۴ گزینه‌ای</span>
            <strong className="text-lg font-black text-emerald-600 font-mono">{mcqCount}</strong>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">تشریحی (با بارم)</span>
            <strong className="text-lg font-black text-blue-600 font-mono">{descriptiveCount}</strong>
          </div>
          <FileText className="w-5 h-5 text-blue-500" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">کنکوری و المپیادی</span>
            <strong className="text-lg font-black text-purple-600 font-mono">{hardCount}</strong>
          </div>
          <SlidersHorizontal className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      {/* نوار فیلتر و جستجوی پیشرفته */}
      <QuestionFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGrade={selectedGrade}
        onGradeChange={setSelectedGrade}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        totalCount={questions.length}
      />

      {/* فهرست سوالات */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">در حال بارگذاری سوالات...</p>
        </div>
      ) : questions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onDelete={(deletedId) => {
                setQuestions((prev) => prev.filter((item) => item.id !== deletedId));
                showToast("سوال با موفقیت از بانک سوالات حذف شد.");
              }}
            />
          ))}
        </div>
      ) : (
        /* وضعیت بدون نتیجه */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800">هیچ سوالی با این مشخصات یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            می‌توانید فیلترهای جستجو را تغییر دهید یا با کلیک روی دکمه «طراحی سوال جدید» اولین سوال خود را ایجاد فرمایید.
          </p>
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-4 h-4" /> طراحی سوال جدید
          </button>
        </div>
      )}

      {/* پنجره طراح سوال */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        textbooks={textbooks}
        authorId={currentUser?.id}
        onSuccess={() => {
          showToast("سوال جدید با موفقیت در بانک سوالات ثبت شد.");
          fetchQuestions();
        }}
      />

      {/* پنجره ورود گروهی */}
      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        textbooks={textbooks}
        authorId={currentUser?.id}
        onSuccess={() => {
          showToast("بسته سوالات با موفقیت به بانک اضافه شد.");
          fetchQuestions();
        }}
      />
    </div>
  );
}
