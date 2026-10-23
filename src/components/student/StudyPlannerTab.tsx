"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Save,
  Flame,
  Award,
  Plus,
  TrendingUp,
} from "lucide-react";

interface StudyPlannerTabProps {
  studentId: string;
  onRefreshStats?: () => void;
}

export const StudyPlannerTab: React.FC<StudyPlannerTabProps> = ({
  studentId,
  onRefreshStats,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  // فرم ثبت مطالعه امروز
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [studyMinutes, setStudyMinutes] = useState<number>(90);
  const [testCount, setTestCount] = useState<number>(25);
  const [note, setNote] = useState<string>("");
  const [savingLog, setSavingLog] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // تیک زدن کارهای انجام‌شده
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/student/study-log?studentId=${studentId}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.subjects && d.subjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(d.subjects[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load study planner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const handleSubmitStudyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || studyMinutes <= 0) return;

    setSavingLog(true);
    try {
      const res = await fetch("/api/student/study-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubjectId,
          studyMinutes,
          testCount,
          note: note.trim(),
        }),
      });

      if (res.ok) {
        setSuccessToast("گزارش مطالعه روزانه ثبت شد و +۱۰ XP به شما تعلق گرفت!");
        setNote("");
        fetchData();
        if (onRefreshStats) onRefreshStats();
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (err) {
      console.error("Failed to log study session:", err);
    } finally {
      setSavingLog(false);
    }
  };

  const toggleSlotCompleted = (slotKey: string) => {
    setCompletedSlots((prev) => ({
      ...prev,
      [slotKey]: !prev[slotKey],
    }));
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        در حال بارگذاری جدول مطالعاتی و لاگ‌های روزانه...
      </div>
    );
  }

  const { stats, logs, activePlan, subjects } = data;

  return (
    <div className="space-y-6">
      {/* پیام موفقیت ثبت */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successToast}
        </div>
      )}

      {/* نوار آمار استمرار و ساعات مطالعه */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">مجموع ساعات مطالعه هفته</span>
            <span className="text-xl font-black text-indigo-700 font-mono mt-0.5 block">
              {stats.weeklyHours} ساعت
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">تست‌های حل‌شده این هفته</span>
            <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">
              {stats.totalTests} تست
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">استمرار مطالعه روزانه</span>
            <span className="text-xl font-black text-orange-600 font-mono mt-0.5 block flex items-center gap-1">
              <Flame className="w-5 h-5 fill-orange-400 text-orange-400" />
              {stats.streakDays} روز پیاپی
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
            +۱۰ XP
          </div>
        </div>
      </div>

      {/* فرم سریع ثبت ساعت مطالعه امروز */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">ثبت گزارش مطالعه و تست امروز (+۱۰ XP)</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">امروز {new Date().toLocaleDateString("fa-IR")}</span>
        </div>

        <form onSubmit={handleSubmitStudyLog} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">انتخاب درس:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">دقایق مطالعه مفید:</label>
            <input
              type="number"
              min="15"
              max="600"
              step="15"
              value={studyMinutes}
              onChange={(e) => setStudyMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">تعداد تست‌های حل‌شده:</label>
            <input
              type="number"
              min="0"
              max="200"
              value={testCount}
              onChange={(e) => setTestCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingLog}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingLog ? "در حال ثبت..." : "ثبت در لاگ مطالعه"}
            </button>
          </div>
        </form>
      </div>

      {/* برنامه مطالعاتی ابلاغ‌شده توسط مشاور */}
      {activePlan && activePlan.schedule ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900">برنامه مطالعاتی هفتگی مشاور ارشد (خانم صابری)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  شخصی‌سازی‌شده بر اساس نقاط ضعف شناسایی‌شده در رادار تسلط فصل مشتق
                </p>
              </div>
            </div>

            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200 font-bold">
              تایید رسمی مشاور ✓
            </span>
          </div>

          {activePlan.counselorNote && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
              <span className="font-bold block mb-1">توصیه مشاور به شما:</span>
              {activePlan.counselorNote}
            </div>
          )}

          {/* ماتریس شبکه‌ای روزهای هفته */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePlan.schedule.map((dayPlan: any, dIdx: number) => (
              <div key={dIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="font-black text-slate-900 text-xs">{dayPlan.day}</span>
                  <span className="text-[10px] text-slate-400">روز {dIdx + 1}</span>
                </div>

                <div className="space-y-2">
                  {dayPlan.slots.map((slot: any, sIdx: number) => {
                    const slotKey = `${dIdx}-${sIdx}`;
                    const isDone = completedSlots[slotKey];

                    return (
                      <div
                        key={sIdx}
                        onClick={() => toggleSlotCompleted(slotKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition select-none ${
                          isDone
                            ? "bg-emerald-50/80 border-emerald-300 opacity-80"
                            : slot.isFocusTopic
                            ? "bg-rose-50/60 border-rose-300 hover:bg-rose-100/50"
                            : "bg-white border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isDone ? "line-through text-emerald-800" : "text-slate-900"
                            }`}
                          >
                            {slot.subject}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{slot.time}</span>
                        </div>

                        <p
                          className={`text-[11px] mt-1 font-medium ${
                            isDone ? "line-through text-emerald-700" : "text-slate-600"
                          }`}
                        >
                          {slot.topic}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500 mt-2">
                          <span>⏱ {slot.targetMinutes} دقیقه</span>
                          <span>🎯 {slot.targetTests} تست</span>
                          <span className="font-bold text-emerald-600">
                            {isDone ? "انجام شد ✓" : "کلیک برای تایید"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* تاریخچه گزارش‌های مطالعه اخیر */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">سوابق مطالعه ثبت‌شده روزهای اخیر</h3>

        <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
          {logs.map((item: any) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">{item.subjectName}</span>
                <span className="text-[11px] text-slate-400 mr-2 font-mono">({item.dateFa})</span>
                {item.note && <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>}
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 font-mono font-bold">
                  {item.studyMinutes} دقیقه
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono font-bold">
                  {item.testCount} تست
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
