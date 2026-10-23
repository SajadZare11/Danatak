"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Check,
  Percent,
  AlertCircle,
} from "lucide-react";

interface StudentAttendanceItem {
  id: string;
  fullName: string;
  nationalId: string;
  avatarUrl?: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "NOT_MARKED";
  delayMinutes: number;
  note: string;
}

interface RapidAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  onSavedSuccess?: () => void;
}

export const RapidAttendanceModal: React.FC<RapidAttendanceModalProps> = ({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  onSavedSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?classroomId=${classroomId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(
          data.students.map((s: any) => ({
            ...s,
            status: s.status === "NOT_MARKED" ? "PRESENT" : s.status,
          }))
        );
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, classroomId]);

  if (!isOpen) return null;

  const handleStatusChange = (id: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const handleDelayChange = (id: string, delayMinutes: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, delayMinutes } : s))
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, note } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "PRESENT", delayMinutes: 0 }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          records: students.map((s) => ({
            studentId: s.id,
            status: s.status === "NOT_MARKED" ? "PRESENT" : s.status,
            delayMinutes: s.status === "LATE" ? s.delayMinutes : 0,
            note: s.note,
          })),
        }),
      });

      if (res.ok) {
        setSuccessMessage("دفتر حضور و غیاب امروز با موفقیت ذخیره و ثبت رسمی شد.");
        if (onSavedSuccess) onSavedSuccess();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  // آمار زنده
  const total = students.length;
  const presents = students.filter((s) => s.status === "PRESENT").length;
  const absents = students.filter((s) => s.status === "ABSENT").length;
  const lates = students.filter((s) => s.status === "LATE").length;
  const rate = total > 0 ? Math.round(((presents + lates) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* هدر مدال */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">دفتر حضور و غیاب کلاسی هوشمند</h3>
                <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  {classroomName}
                </span>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5">
                ثبت بلادرنگ وضعیت، درج تاخیر، و ارسال خودکار به پرونده انضباطی و سیدا
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

        {/* نوار وضعیت زنده و اکشن‌های سریع */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              حاضر: {presents} نفر
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 font-bold">
              <XCircle className="w-4 h-4 text-rose-600" />
              غایب: {absents} نفر
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200 font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              با تاخیر: {lates} نفر
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 font-bold">
              <Percent className="w-4 h-4 text-blue-600" />
              نرخ حضور: {rate}٪
            </div>
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            علامت‌گذاری همه به عنوان «حاضر»
          </button>
        </div>

        {/* پیام موفقیت ثبت */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {/* محتوای لیست دانش‌آموزان */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              در حال بارگذاری لیست اسامی کلاس...
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              هیچ دانش‌آموزی در این کلاس ثبت‌نام نشده است.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className={`p-3.5 flex flex-wrap items-center justify-between gap-3 transition ${
                    student.status === "ABSENT"
                      ? "bg-rose-50/40"
                      : student.status === "LATE"
                      ? "bg-amber-50/40"
                      : "bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* اطلاعات دانش‌آموز */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
                      ) : (
                        student.fullName[0]
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{student.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">کد ملی: {student.nationalId}</p>
                    </div>
                  </div>

                  {/* دکمه‌های ۳‌گانه انتخاب وضعیت */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "PRESENT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        student.status === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      حاضر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "LATE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        student.status === "LATE"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      تاخیر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "ABSENT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        student.status === "ABSENT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      غایب
                    </button>
                  </div>

                  {/* فیلد تاخیر (اگر وضعیت تاخیر باشد) */}
                  {student.status === "LATE" && (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <span className="text-[11px] text-slate-500 font-medium">دقایق تاخیر:</span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={student.delayMinutes || 15}
                        onChange={(e) => handleDelayChange(student.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs text-center font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[11px] text-slate-400">دقیقه</span>
                    </div>
                  )}

                  {/* یادداشت سریع معلم */}
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      placeholder="یادداشت معلم (مثلاً: غیبت موجه با گواهی، تاخیر زنگ اول)..."
                      value={student.note || ""}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر مدال با دکمه ذخیره */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-indigo-500" />
            اطلاعات حضور و غیاب بلافاصله در پنل مدیر، پرونده انضباطی و کارنامه رسمی همگام می‌شود.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "در حال ذخیره‌سازی..." : "ذخیره نهایی دفتر حضور و غیاب"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
