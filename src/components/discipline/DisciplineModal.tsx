"use client";

import React, { useState } from "react";
import {
  X,
  Award,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Save,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface DisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  availableStudents?: Array<{ id: string; fullName: string; nationalId: string }>;
  onSavedSuccess?: () => void;
}

export const DisciplineModal: React.FC<DisciplineModalProps> = ({
  isOpen,
  onClose,
  studentId: initialStudentId,
  studentName: initialStudentName,
  availableStudents = [],
  onSavedSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || (availableStudents[0]?.id || ""));
  const [cardType, setCardType] = useState<"POSITIVE" | "NEGATIVE">("POSITIVE");
  const [title, setTitle] = useState<string>("");
  const [points, setPoints] = useState<number>(1);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // عناوین استاندارد پیشنهادی آموزش و پرورش
  const positivePresets = [
    "مشارکت فعال و حل مسائل دشوار پای تخته",
    "همکاری در اداره کلاس و کمک علمی به همکلاسی‌ها",
    "کسب بالاترین نمره در کوییز کلاسی یا آزمون",
    "رعایت کامل نظم، ادب و اخلاق اسلامی",
    "ارائه پروژه یا سمینار علمی برتر کلاسی",
  ];

  const negativePresets = [
    "بی‌نظمی، صحبت مکرر حین تدریس و برهم‌زدن تمرکز کلاس",
    "عدم انجام تکالیف درسی و تمرین‌های تعیین‌شده",
    "تاخیر مکرر در ورود به کلاس درس",
    "استفاده غیرمجاز از تلفن همراه در ساعت آموزش",
    "بی‌توجهی به تذکرات انضباطی دبیر یا ناظم",
  ];

  if (!isOpen) return null;

  const currentPresets = cardType === "POSITIVE" ? positivePresets : negativePresets;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/discipline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          type: cardType,
          title: title.trim(),
          points: Math.abs(points),
          recordedBy: "استاد احسان محمدی (دبیر ریاضی)",
          note: note.trim(),
        }),
      });

      if (res.ok) {
        setSuccessMsg(`کارت ${cardType === "POSITIVE" ? "تشویقی" : "انضباطی"} با موفقیت در پرونده ثبت شد.`);
        if (onSavedSuccess) onSavedSuccess();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to record discipline card:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col border border-slate-200 overflow-hidden">
        {/* هدر مدال */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between transition-colors ${
            cardType === "POSITIVE"
              ? "bg-gradient-to-r from-emerald-600 to-teal-700"
              : "bg-gradient-to-r from-rose-600 to-red-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              {cardType === "POSITIVE" ? (
                <Award className="w-5 h-5 text-emerald-200" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-200" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {cardType === "POSITIVE" ? "صدور کارت تشویق انضباطی (مثبت)" : "ثبت تذکر و کارت منفی انضباطی"}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                ثبت رسمی در پرونده تحصیلی دانش‌آموز و کارنامه جامع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* سوییچ نوع کارت (مثبت یا منفی) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCardType("POSITIVE");
              setTitle("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition border ${
              cardType === "POSITIVE"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            کارت تشویقی (سبز / امتیاز مثبت +)
          </button>
          <button
            type="button"
            onClick={() => {
              setCardType("NEGATIVE");
              setTitle("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition border ${
              cardType === "NEGATIVE"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            کارت منفی (قرمز / کسر امتیاز -)
          </button>
        </div>

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* فرم ثبت */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* انتخاب دانش‌آموز */}
          {initialStudentName ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">دانش‌آموز هدف:</label>
              <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-800 border border-slate-200">
                {initialStudentName}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">انتخاب دانش‌آموز:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} (کد ملی: {s.nationalId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* پیش‌فرض‌های سریع آموزش و پرورش */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              عناوین استاندارد پیشنهادی:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {currentPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    title === preset
                      ? cardType === "POSITIVE"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                        : "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* عنوان کارت */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان دقیق مورد انضباطی:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: حل سوالات سطح بالا، تاخیر در ورود به کلاس..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          {/* امتیاز */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {cardType === "POSITIVE" ? "امتیاز تشویقی:" : "میزان کسر امتیاز:"}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPoints(val)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black border transition ${
                      points === val
                        ? cardType === "POSITIVE"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cardType === "POSITIVE" ? `+${val}` : `-${val}`}
                  </button>
                ))}
              </div>
            </div>

            {cardType === "POSITIVE" && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center gap-1.5 mt-5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                اعطای {points * 15} XP به دانش‌آموز
              </div>
            )}
          </div>

          {/* توضیحات تکمیلی */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات تکمیلی دبیر/ناظم:</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="توضیح زمینه رفتار، زمان وقوع و تذکرات داده شده..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* دکمه‌های اکشن */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 ${
                cardType === "POSITIVE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? "در حال ثبت..." : "ثبت رسمی کارت"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
