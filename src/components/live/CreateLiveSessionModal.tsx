"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Video,
  Radio,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ClassroomOption {
  id: string;
  name: string;
  gradeLevel: number;
  major: string;
}

interface CreateLiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
  onCreated?: (sessionId: string) => void;
}

export const CreateLiveSessionModal: React.FC<CreateLiveSessionModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  onCreated,
}) => {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // فرم
  const [isInstant, setIsInstant] = useState(true);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [title, setTitle] = useState("تدریس تعاملی و حل مسئله پای تخته");
  const [subjectTitle, setSubjectTitle] = useState("حسابان و ریاضی ۳");
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchClassrooms();
      setErrorMsg(null);
    }
  }, [isOpen]);

  const fetchClassrooms = async () => {
    setLoadingClassrooms(true);
    try {
      const res = await fetch("/api/study-studio/assignments?classrooms=true");
      const data = await res.json();
      if (data.success && data.classrooms) {
        setClassrooms(data.classrooms);
        if (data.classrooms.length > 0) {
          setSelectedClassroomId(data.classrooms[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch classrooms:", err);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        classroomId: selectedClassroomId,
        hostTeacherId: teacherId,
        title,
        subjectTitle,
        isInstant,
        scheduledStartTime: !isInstant && scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
      };

      const res = await fetch("/api/live/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.session) {
        if (onCreated) onCreated(data.session.id);
        onClose();
        if (isInstant) {
          router.push(`/live-classroom/${data.session.id}`);
        }
      } else {
        setErrorMsg(data.error || "خطا در ایجاد جلسه کلاس آنلاین");
      }
    } catch (err: any) {
      setErrorMsg("خطا در برقراری ارتباط با سرور: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-right">
        {/* هدر مدال */}
        <div className="px-6 py-4 bg-gradient-to-l from-rose-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black">راه‌اندازی کلاس آنلاین و تخته‌سیاه زنده</h3>
              <p className="text-[11px] text-slate-300">پخش ویدیویی بومی WebRTC با حاشیه‌نویسی ریاضی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم ثبت کلاس */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* نوع شروع: فوری یا زمان‌بندی‌شده */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsInstant(true)}
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right ${
                isInstant
                  ? "bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Radio className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <div className="font-black">شروع فوری هم‌اکنون 🔴</div>
                <div className="text-[10px] text-slate-400 font-normal">ورود مستقیم به استودیو تدریس</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsInstant(false)}
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right ${
                !isInstant
                  ? "bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-black">زمان‌بندی برای بعد 📅</div>
                <div className="text-[10px] text-slate-400 font-normal">نمایش در تقویم کلاسی</div>
              </div>
            </button>
          </div>

          {/* انتخاب کلاس */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              کلاس درس مخاطب:
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* عنوان جلسه */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              موضوع تدریس و عنوان جلسه:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              placeholder="مثال: رفع اشکال مشتق مراتب بالاتر و حل تست"
            />
          </div>

          {/* عنوان درس */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">نام درس:</label>
            <input
              type="text"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* انتخاب تاریخ و زمان (اگر زمان‌بندی شده باشد) */}
          {!isInstant && (
            <div className="space-y-1.5 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200">
              <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                تاریخ و ساعت شروع کلاس:
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-mono text-slate-800 text-xs"
              />
            </div>
          )}

          {/* دکمه‌های پایین مدال */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting || loadingClassrooms}
              className={`px-6 py-2.5 text-white rounded-xl font-black shadow-md hover:shadow-lg transition flex items-center gap-2 ${
                isInstant
                  ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ایجاد اتاق...</span>
                </>
              ) : isInstant ? (
                <>
                  <Radio className="w-4 h-4" />
                  <span>آغاز فوری کلاس زنده 🔴</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>ثبت و زمان‌بندی کلاس</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
