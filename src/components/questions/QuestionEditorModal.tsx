"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Check, Sparkles, BookOpen, Lock, Globe, Save } from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { KaTeXFormulaHelper } from "./KaTeXFormulaHelper";

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  textbooks: Array<{
    id: string;
    title: string;
    gradeLevel: number;
    major: string;
    topics: Array<{
      id: string;
      title: string;
      subTopics?: Array<{ id: string; title: string }>;
    }>;
  }>;
  authorId?: string;
  onSuccess?: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  textbooks,
  authorId,
  onSuccess,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "DESCRIPTIVE" | "TRUE_FALSE" | "FILL_BLANK">(
    "MULTIPLE_CHOICE"
  );
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "OLYMPIAD">("MEDIUM");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState("تالیفی, حسابان۲");
  const [explanation, setExplanation] = useState("");

  // گزینه‌های تستی
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // استخراج تمام زیرمباحث برای دراپ‌داون
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

  const handleInsertSnippet = (snippet: string) => {
    setContent((prev) => prev + " " + snippet);
  };

  const handleOptionChange = (index: number, text: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index].text = text;
      return copy;
    });
  };

  const handleSetCorrectOption = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        topicId: selectedTopicId,
        authorId: authorId || null,
        content,
        type,
        difficulty,
        isPublic,
        explanation: explanation.trim() ? explanation : null,
        tags,
        options:
          type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE"
            ? options.map((opt, idx) => ({
                optionText: opt.text,
                orderIndex: idx + 1,
                isCorrect: opt.isCorrect,
              }))
            : [],
      };

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSubmitting(false);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onSuccess?.();
          onClose();
        }, 800);
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
        {/* هدر پنجره طراح سوال */}
        <div className="px-6 py-4 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl font-black">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm">
                طراح سوال و محتواساز دبیر (Question Bank Studio)
              </h3>
              <p className="text-[11px] text-indigo-200">
                پشتیبانی از فرمول‌های ریاضی KaTeX، بارم‌بندی تشریحی و کلید تستی
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

        {/* بدنه فرم طراحی سوال */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ردیف اول: سرفصل، نوع سوال و درجه دشواری */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                انتخاب کتاب و مبحث درسی:
              </label>
              <select
                required
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- لطفاً یک مبحث را انتخاب فرمایید --</option>
                {flatTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.book}] {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع سوال:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="MULTIPLE_CHOICE">تستی (چهار گزینه‌ای)</option>
                <option value="DESCRIPTIVE">تشریحی (با بارم و راه‌حل)</option>
                <option value="TRUE_FALSE">صحیح / غلط</option>
                <option value="FILL_BLANK">جای خالی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سطح دشواری:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
              >
                <option value="EASY">ساده (مفاهیم اولیه)</option>
                <option value="MEDIUM">متوسط (سطح کتاب و نهایی)</option>
                <option value="HARD">سخت (کنکوری)</option>
                <option value="OLYMPIAD">المپیادی / تیزهوشان ویژه</option>
              </select>
            </div>
          </div>

          {/* جعبه ابزار فرمول KaTeX */}
          <KaTeXFormulaHelper onInsert={handleInsertSnippet} />

          {/* ویرایشگر صورت سوال + پیش‌نمایش آنی Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                صورت سوال (با فرمول‌های $math$ یا $$display$$):
              </label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="مشتق تابع $f(x) = \frac{2x - 1}{x^2 + 1}$ را در نقطه $x = 1$ بیابید..."
                className="w-full text-xs p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> پیش‌نمایش رندرشده زنده (Live Preview):
              </label>
              <div className="w-full h-[142px] p-3.5 bg-slate-50 rounded-2xl border border-indigo-100 overflow-y-auto text-xs leading-relaxed">
                {content.trim() ? (
                  <KaTeXRenderer content={content} />
                ) : (
                  <span className="text-slate-400 italic">
                    با تایپ متن یا فرمول در کادر روبرو، نمایش رندرشده ریاضی آن اینجا ظاهر می‌شود...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* بخش گزینه‌ها (برای سوالات تستی و صحیح/غلط) */}
          {(type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  گزینه‌ها و تعیین پاسخ صحیح:
                </label>
                {type === "MULTIPLE_CHOICE" && options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن گزینه
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-2xl border-2 transition space-y-2 ${
                      opt.isCorrect
                        ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">گزینه {index + 1}:</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] cursor-pointer text-emerald-800 font-bold">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => handleSetCorrectOption(index)}
                            className="accent-emerald-600"
                          />
                          پاسخ صحیح
                        </label>
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={
                        index === 0
                          ? "$\\frac{1}{2}$"
                          : index === 1
                          ? "$1$"
                          : index === 2
                          ? "$-\\frac{1}{2}$"
                          : "$0$"
                      }
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />

                    {opt.text.trim() && (
                      <div className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <KaTeXRenderer content={opt.text} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* پاسخنامه تشریحی و بارم‌بندی */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              راهنمای تصحیح، بارم‌بندی و پاسخ تشریحی:
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="با استفاده از فرمول مشتق کسری... بارم نمره: محاسبه مشتق صورت (۰.۵ نمره)، اعمال مخرج (۰.۵ نمره)..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono resize-none leading-relaxed"
            />
            {explanation.trim() && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                <span className="text-[11px] font-bold text-indigo-700 block mb-1">
                  پیش‌نمایش راهنمای تصحیح:
                </span>
                <KaTeXRenderer content={explanation} />
              </div>
            )}
          </div>

          {/* برچسب‌ها و تنظیمات حریم خصوصی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                برچسب‌ها (با کاما جدا کنید):
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="نهایی, کنکور, تیزهوشان, تالیفی"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">سطح دسترسی و اشتراک‌گذاری:</span>
                <span className="text-[11px] text-slate-500">
                  {isPublic ? "اشتراک در بانک سوالات مدرسه" : "فقط در پنل اختصاصی من"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isPublic
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isPublic ? (
                  <>
                    <Globe className="w-3.5 h-3.5" /> عمومی
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> خصوصی
                  </>
                )}
              </button>
            </div>
          </div>

          {/* دکمه‌های پایانی فرم */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || savedSuccess || !selectedTopicId || !content.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition ${
                savedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> سوال در بانک ذخیره شد!
                </>
              ) : isSubmitting ? (
                "در حال ذخیره در بانک..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> ذخیره در بانک سوالات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
