"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileCode, Check, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  textbooks: Array<{
    id: string;
    title: string;
    topics: Array<{
      id: string;
      title: string;
      subTopics?: Array<{ id: string; title: string }>;
    }>;
  }>;
  authorId?: string;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  textbooks,
  authorId,
  onSuccess,
}) => {
  const [defaultTopicId, setDefaultTopicId] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  // استخراج تمام زیرمباحث برای انتخاب مبحث پیش‌فرض
  const flatTopics: Array<{ id: string; title: string; book: string }> = [];
  textbooks.forEach((book) => {
    book.topics.forEach((t) => {
      if (t.subTopics && t.subTopics.length > 0) {
        t.subTopics.forEach((st) => {
          flatTopics.push({
            id: st.id,
            title: `${t.title} ⬅ ${st.title}`,
            book: `${book.title}`,
          });
        });
      } else {
        flatTopics.push({
          id: t.id,
          title: t.title,
          book: `${book.title}`,
        });
      }
    });
  });

  // قالب آماده نمونه
  const loadSampleTemplate = () => {
    const sample = [
      {
        content: "مشتق تابع $f(x) = \\sqrt{3x^2 + 1}$ در نقطه $x = 1$ کدام است؟",
        type: "MULTIPLE_CHOICE",
        difficulty: "MEDIUM",
        tags: "نهایی, حسابان۲",
        explanation: "فرمول مشتق رادیکالی: $f'(x) = \\frac{6x}{2\\sqrt{3x^2+1}}$. در نقطه $x=1$ داریم $\\frac{6}{4} = \\frac{3}{2}$.",
        options: [
          { text: "$\\frac{3}{2}$", isCorrect: true },
          { text: "$3$", isCorrect: false },
          { text: "$\\frac{1}{2}$", isCorrect: false },
          { text: "$\\frac{\\sqrt{3}}{2}$", isCorrect: false },
        ],
      },
      {
        content: "اگر $f(x) = x \\cdot \\sin(x)$ باشد، مقدار مشتق در $x = \\pi$ برابر با چند است؟",
        type: "MULTIPLE_CHOICE",
        difficulty: "HARD",
        tags: "کنکور, مثلثات",
        explanation: "مشتق ضرب دو تابع: $f'(x) = \\sin(x) + x\\cos(x)$. در $\\pi$ داریم $0 + \\pi(-1) = -\\pi$.",
        options: [
          { text: "$-\\pi$", isCorrect: true },
          { text: "$\\pi$", isCorrect: false },
          { text: "$0$", isCorrect: false },
          { text: "$1$", isCorrect: false },
        ],
      },
      {
        content: "مفهوم فیزیکی مشتق دوم تابع مکان-زمان $x(t)$ کدام کمیت فیزیکی را نشان می‌دهد؟",
        type: "MULTIPLE_CHOICE",
        difficulty: "EASY",
        tags: "فیزیک, کاربرد مشتق",
        explanation: "مشتق اول معرف سرعت لحظه‌ای و مشتق دوم معرف شتاب لحظه‌ای متحرک است.",
        options: [
          { text: "شتاب لحظه‌ای متحرک ($a$)", isCorrect: true },
          { text: "سرعت متوسط", isCorrect: false },
          { text: "جابجایی کل", isCorrect: false },
          { text: "مسافت پیموده‌شده", isCorrect: false },
        ],
      },
    ];

    setJsonInput(JSON.stringify(sample, null, 2));
    setParsedQuestions(sample);
    setParseError(null);
  };

  const handleParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setParseError("ورودی باید یک آرایه معتبر از سوالات باشد.");
        setParsedQuestions([]);
        return;
      }
      setParsedQuestions(parsed);
      setParseError(null);
    } catch {
      setParseError("فرمت JSON واردشده نامعتبر است. لطفاً کاراکترها و ویرگول‌ها را بررسی فرمایید.");
      setParsedQuestions([]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultTopicId || parsedQuestions.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: parsedQuestions,
          defaultTopicId,
          authorId: authorId || null,
        }),
      });

      if (res.ok) {
        setIsSubmitting(false);
        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          onSuccess?.();
          onClose();
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* هدر مدال ورود گروهی */}
        <div className="px-6 py-4 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl font-black">
              <UploadCloud className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm">
                ورود گروهی سوالات به بانک (Bulk Import Engine)
              </h3>
              <p className="text-[11px] text-indigo-200">
                پشتیبانی از فرمت استاندارد، پیش‌نمایش اعتبارسنجی و ثبت یکجای سوالات
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

        {/* فرم ورود گروهی */}
        <form onSubmit={handleImportSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* انتخاب مبحث پیش‌فرض */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              مبحث پیش‌فرض برای سوالات واردشده:
            </label>
            <select
              required
              value={defaultTopicId}
              onChange={(e) => setDefaultTopicId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
            >
              <option value="">-- لطفاً یک مبحث را انتخاب فرمایید --</option>
              {flatTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.book}] {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* کادر ورود متن و دکمه بارگذاری نمونه */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" /> ورودی با فرمت استاندارد JSON:
              </label>
              <button
                type="button"
                onClick={loadSampleTemplate}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> بارگذاری ۳ سوال نمونه آماده
              </button>
            </div>

            <textarea
              rows={8}
              required
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onBlur={handleParse}
              placeholder="کد JSON سوالات را اینجا قرار دهید یا دکمه «بارگذاری ۳ سوال نمونه» را بزنید..."
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono resize-none leading-relaxed text-left"
              dir="ltr"
            />

            {parseError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* پیش‌نمایش سوالات تفکیک‌شده قبل از ثبت نهایی */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  پیش‌نمایش {parsedQuestions.length} سوال شناسایی‌شده:
                </span>
                <span className="text-[11px] text-slate-400">آماده ثبت در دیتابیس</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>سوال {idx + 1}:</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                        {q.difficulty || "MEDIUM"} • {q.tags || "ورود گروهی"}
                      </span>
                    </div>
                    <KaTeXRenderer content={q.content} />
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-md border ${
                              opt.isCorrect
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            <KaTeXRenderer content={opt.text} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* دکمه‌های تایید و ارسال */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || importSuccess || !defaultTopicId || parsedQuestions.length === 0}
              className={`flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition ${
                importSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {importSuccess ? (
                <>
                  <Check className="w-4 h-4" /> {parsedQuestions.length} سوال با موفقیت ذخیره شد!
                </>
              ) : isSubmitting ? (
                "در حال ذخیره گروهی..."
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> تایید و ورود {parsedQuestions.length} سوال به بانک
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
