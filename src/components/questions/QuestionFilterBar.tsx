"use client";

import React from "react";
import { Search, Filter, BookOpen, Layers, Check } from "lucide-react";

interface QuestionFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGrade: string;
  onGradeChange: (g: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (d: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedSource: string;
  onSourceChange: (s: string) => void;
  totalCount: number;
}

export const QuestionFilterBar: React.FC<QuestionFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedGrade,
  onGradeChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedType,
  onTypeChange,
  selectedSource,
  onSourceChange,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* ردیف اول: جستجو و منبع سوالات */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* اینپوت جستجو */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجوی کلمه، فرمول، یا برچسب (مثلاً مشتق، کنکور، حد)..."
            className="w-full text-xs pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* سوییچ منبع سوالات */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSourceChange("all")}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedSource === "all" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            همه سوالات
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("central")}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedSource === "central" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            بانک مرکزی
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("my")}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedSource === "my" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            سوالات من
          </button>
        </div>
      </div>

      {/* ردیف دوم: دراپ‌داون‌های فیلتر چندسطحی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* فیلتر پایه */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">پایه تحصیلی:</label>
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">همه پایه‌ها (۱۰، ۱۱، ۱۲)</option>
            <option value="12">پایه دوازدهم (کنکوری و نهایی)</option>
            <option value="11">پایه یازدهم</option>
            <option value="10">پایه دهم</option>
          </select>
        </div>

        {/* فیلتر سطح دشواری */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">درجه دشواری:</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">همه سطوح</option>
            <option value="EASY">ساده (مفهومی)</option>
            <option value="MEDIUM">متوسط (نهایی)</option>
            <option value="HARD">سخت (کنکوری)</option>
            <option value="OLYMPIAD">المپیادی / تیزهوشان</option>
          </select>
        </div>

        {/* فیلتر نوع سوال */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع سوال:</label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">همه انواع</option>
            <option value="MULTIPLE_CHOICE">تستی ۴ گزینه‌ای</option>
            <option value="DESCRIPTIVE">تشریحی (با بارم)</option>
            <option value="TRUE_FALSE">صحیح / غلط</option>
            <option value="FILL_BLANK">جای خالی</option>
          </select>
        </div>

        {/* شمارنده نتایج */}
        <div className="flex flex-col justify-end">
          <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
            <span className="text-[10px] text-indigo-700 block">سوالات یافت‌شده:</span>
            <span className="text-xs font-black text-indigo-950 font-mono">{totalCount} مورد</span>
          </div>
        </div>
      </div>
    </div>
  );
};
