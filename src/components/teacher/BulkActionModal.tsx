"use client";

import React, { useState } from "react";
import { X, Users, Check, AlertCircle } from "lucide-react";

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomName: string;
  studentCount: number;
  topics: Array<{ id: string; title: string; subTopics?: Array<{ id: string; title: string }> }>;
  onApplyBulk: (topicId: string, percentage: number) => Promise<void>;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  classroomName,
  studentCount,
  topics,
  onApplyBulk,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [percentage, setPercentage] = useState<number>(70);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  // استخراج تمام زیرمباحث برای انتخاب
  const flatTopics: Array<{ id: string; title: string }> = [];
  topics.forEach((t) => {
    if (t.subTopics && t.subTopics.length > 0) {
      t.subTopics.forEach((st) => flatTopics.push({ id: st.id, title: `${t.title} ⬅ ${st.title}` }));
    } else {
      flatTopics.push({ id: t.id, title: t.title });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;

    setIsSubmitting(true);
    try {
      await onApplyBulk(selectedTopicId, percentage);
      setAppliedSuccess(true);
      setTimeout(() => {
        setAppliedSuccess(false);
        onClose();
      }, 1000);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* هدر عملیات گروهی */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-l from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/30 text-blue-200 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm">عملیات گروهی / کل کلاس</h3>
              <p className="text-[11px] text-blue-200">{classroomName} ({studentCount} دانش‌آموز)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              با این عملیات، یک درصد پایه یادگیری به صورت یکجا برای تمامی {studentCount} دانش‌آموز کلاس ثبت می‌شود و سپس می‌توانید در صورت نیاز برای دانش‌آموزان خاص تکی ویرایش کنید.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">انتخاب مبحث درسی</label>
            <select
              required
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
            >
              <option value="">-- لطفاً یک مبحث را انتخاب کنید --</option>
              {flatTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">درصد یادگیری پایه کلاسی</label>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {percentage}٪
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>۰٪ (نیاز به آموزش مجدد)</span>
              <span>۵۰٪ (متوسط)</span>
              <span>۱۰۰٪ (تسلط کامل)</span>
            </div>
          </div>

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
              disabled={isSubmitting || !selectedTopicId}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition ${
                appliedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> با موفقیت ثبت شد!
                </>
              ) : isSubmitting ? (
                "در حال اعمال به کل کلاس..."
              ) : (
                "ثبت برای کل کلاس"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
