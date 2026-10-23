"use client";

import React, { useState } from "react";
import { X, Zap, PlusCircle, BookPlus, FileText, Check } from "lucide-react";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (type: string, title: string) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeType, setActiveType] = useState<"question" | "homework" | "quiz">("question");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onSuccess?.(activeType, title);
        onClose();
        setTitle("");
        setContent("");
      }, 900);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* هدر پنجره ساخت سریع */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-l from-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-400 text-slate-900 rounded-lg font-black text-sm">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h3 className="font-bold text-sm">پنجره ساخت سریع محتوا (Quick Create)</h3>
              <p className="text-[11px] text-slate-300">افزودن فوری بدون ترک صفحه کلاسی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* انتخاب نوع ساخت */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveType("question")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
                activeType === "question"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> سوال جدید
            </button>
            <button
              type="button"
              onClick={() => setActiveType("homework")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
                activeType === "homework"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookPlus className="w-3.5 h-3.5" /> تکلیف سریع
            </button>
            <button
              type="button"
              onClick={() => setActiveType("quiz")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
                activeType === "quiz"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> کوییز کلاسی
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {activeType === "question"
                  ? "مبحث و عنوان سوال"
                  : activeType === "homework"
                  ? "عنوان تکلیف"
                  : "عنوان کوییز سریع"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: تست مشتق توابع کسری (کنکور ۱۴۰۱)"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                توضیحات یا صورت سوال (پشتیبانی از فرمول $KaTeX$)
              </label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="مشتق تابع $f(x) = \frac{x}{x+1}$ را بیابید..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none font-mono"
              />
            </div>

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
                disabled={isSubmitting || savedSuccess}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition ${
                  savedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> ذخیره شد!
                  </>
                ) : isSubmitting ? (
                  "در حال ثبت..."
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" /> ثبت فوری در پنل
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
