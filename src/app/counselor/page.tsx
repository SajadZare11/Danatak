"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Clock,
  Sparkles,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Send,
  Save,
  Flame,
  Award,
  ChevronLeft,
  BookOpen,
  Check,
  TrendingUp,
} from "lucide-react";

export default function CounselorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tracker" | "planner" | "atrisk">("tracker");
  const [data, setData] = useState<any | null>(null);

  // دانش‌آموز انتخابی برای برنامه‌ریزی
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentPlanData, setStudentPlanData] = useState<any | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [counselorNoteInput, setCounselorNoteInput] = useState<string>("");

  // پیام اعلان
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchCounselorData = async () => {
    try {
      const res = await fetch("/api/counselor/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.students && d.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(d.students[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load counselor dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPlan = async (studentId: string) => {
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/counselor/plan?studentId=${studentId}`);
      if (res.ok) {
        const p = await res.json();
        setStudentPlanData(p);
        setCounselorNoteInput(p.plan?.counselorNote || "");
      }
    } catch (err) {
      console.error("Failed to load student plan:", err);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselorData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentPlan(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleGenerateAiPlan = async () => {
    if (!selectedStudentId) return;
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/counselor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          action: "GENERATE_AI",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        showToast("برنامه مطالعاتی هوشمند بر مبنای ضعف‌های رادار تسلط با موفقیت تدوین و تایید شد!");
        fetchStudentPlan(selectedStudentId);
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedStudentId || !studentPlanData?.plan?.schedule) return;
    try {
      const res = await fetch("/api/counselor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          action: "SAVE",
          schedule: studentPlanData.plan.schedule,
          counselorNote: counselorNoteInput,
        }),
      });

      if (res.ok) {
        showToast("تغییرات برنامه هفتگی ذخیره شد و به کارتابل دانش‌آموز ابلاغ گردید.");
        fetchStudentPlan(selectedStudentId);
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Compass className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">در حال بارگذاری پنل مشاور ارشد تحصیلی...</p>
        </div>
      </div>
    );
  }

  const { counselor, stats, students } = data;
  const currentStudent = students.find((s: any) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* هدر بالایی پنل مشاور */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">داشبورد مشاور ارشد تحصیلی و کنکور</h1>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {counselor.fullName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              رصد ساعات مطالعه، مدیریت برنامه‌ریزی هفتگی هوشمند و پرونده‌های ارجاعی
            </p>
          </div>
        </div>

        {/* اکشن‌های سریع مشاور */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600">
            انتخاب دانش‌آموز:
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            {students.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* اعلان‌های سیستم */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* نوار کارت‌های شاخص‌های کلیدی مشاور */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">دانش‌آموزان تحت پوشش</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{stats.totalStudents} نفر</div>
          <div className="text-[10px] text-slate-400 mt-0.5">پایه‌های دوازدهم و یازدهم</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">میانگین ساعات مطالعه هفتگی</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">{stats.avgWeeklyHoursSchool} ساعت</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">در کل پایه دوازدهم</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">برنامه‌های ابلاغ‌شده فعال</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 font-mono">{stats.activePlansCount} برنامه</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">جدول هفتگی تاییدشده</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">پرونده‌های در وضعیت قرمز</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{stats.atRiskCount} نفر</div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">نیازمند جلسه مشاوره</div>
        </div>
      </div>

      {/* تب‌های ناوبری پنل مشاور */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "tracker"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          رصد ساعات مطالعه و تست روزانه
        </button>

        <button
          onClick={() => setActiveTab("planner")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "planner"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          دستیار هوشمند برنامه‌ریزی هفتگی (AI Study Planner)
        </button>

        <button
          onClick={() => setActiveTab("atrisk")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "atrisk"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          پرونده‌های ارجاعی و وضعیت قرمز ({stats.atRiskCount})
        </button>
      </div>

      {/* تب ۱: رصد ساعات مطالعه و تست روزانه (Study Log Tracker) */}
      {activeTab === "tracker" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">جدول رصد عملکرد هفتگی دانش‌آموزان</h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-4 text-right">نام و نام خانوادگی</th>
                    <th className="py-3 px-3">کلاس</th>
                    <th className="py-3 px-3 bg-amber-50/50">ساعات مطالعه هفته</th>
                    <th className="py-3 px-3 bg-emerald-50/50">تعداد تست حل‌شده</th>
                    <th className="py-3 px-3">میانگین تسلط</th>
                    <th className="py-3 px-3">استمرار (Streak)</th>
                    <th className="py-3 px-3">وضعیت برنامه</th>
                    <th className="py-3 px-4">اقدام مشاور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s: any, idx: number) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{s.fullName}</td>
                      <td className="py-3 px-3 text-slate-600">{s.className}</td>
                      <td className="py-3 px-3 font-black font-mono text-amber-900 bg-amber-50/30">
                        {s.weeklyHours} ساعت
                      </td>
                      <td className="py-3 px-3 font-black font-mono text-emerald-800 bg-emerald-50/30">
                        {s.totalTests} تست
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{s.avgMastery}٪</td>
                      <td className="py-3 px-3 font-bold text-orange-600">
                        <span className="flex items-center justify-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                          {s.streakDays} روز
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.isPlanApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.isPlanApproved ? "ابلاغ شده ✓" : "بدون برنامه"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedStudentId(s.id);
                            setActiveTab("planner");
                          }}
                          className="px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold transition mx-auto flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          تنظیم برنامه
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: دستیار هوشمند برنامه‌ریزی مطالعاتی هفتگی (AI Study Planner) */}
      {activeTab === "planner" && (
        <div className="space-y-6">
          {/* کارت وضعیت دانش‌آموز انتخابی و اکشن هوش مصنوعی */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  برنامه مطالعاتی هفتگی: {currentStudent?.fullName || "علی رضایی"}
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                  {currentStudent?.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تنظیم ساعات مطالعه و سهم تست بر اساس رادار تسلط مفهومی و اولویت‌های آزمون
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateAiPlan}
                disabled={generatingAi}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                {generatingAi ? "در حال تدوین هوشمند..." : "تدوین خودکار با هوش مصنوعی (AI Draft)"}
              </button>

              <button
                type="button"
                onClick={handleSavePlan}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                تایید و ابلاغ به دانش‌آموز
              </button>
            </div>
          </div>

          {/* پیش‌نویس جدول هفتگی (Timetable Grid) */}
          {planLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              در حال بارگذاری جدول مطالعاتی...
            </div>
          ) : !studentPlanData?.plan?.schedule ? (
            <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              هنوز برنامه‌ای برای این دانش‌آموز تدوین نشده است. روی دکمه «تدوین خودکار با هوش مصنوعی» کلیک کنید.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {studentPlanData.plan.schedule.map((dayPlan: any, dIdx: number) => (
                  <div
                    key={dIdx}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-sm">{dayPlan.day}</span>
                      <span className="text-[10px] text-slate-400">روز {dIdx + 1}</span>
                    </div>

                    <div className="space-y-2.5">
                      {dayPlan.slots.map((slot: any, sIdx: number) => (
                        <div
                          key={sIdx}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                            slot.isFocusTopic
                              ? "bg-rose-50/70 border-rose-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800">{slot.subject}</span>
                            <span className="font-mono text-[10px] text-slate-500">{slot.time}</span>
                          </div>

                          <p className="text-[11px] text-slate-700 font-bold">{slot.topic}</p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                            <span>⏱ {slot.targetMinutes} دقیقه</span>
                            <span>🎯 {slot.targetTests} تست</span>
                            {slot.isFocusTopic && (
                              <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                                اولویت جبرانی
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* یادداشت مشاور به دانش‌آموز */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  یادداشت و توصیه‌های مشاور ارشد به دانش‌آموز:
                </label>
                <textarea
                  rows={2}
                  value={counselorNoteInput}
                  onChange={(e) => setCounselorNoteInput(e.target.value)}
                  placeholder="نکات انگیزشی، شیوه تست‌زنی و توصیه‌های این هفته..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* تب ۳: پرونده‌های ارجاعی و وضعیت قرمز */}
      {activeTab === "atrisk" && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-900">پرونده‌های ارجاع‌شده از مدیریت و کادر آموزشی</h3>
              <p className="text-xs text-rose-700 mt-0.5">
                دانش‌آموزان نیازمند مداخله مشاوره‌ای، جلسه با اولیا یا تغییر برنامه مطالعاتی
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
            {students
              .filter((s: any) => s.isAtRisk)
              .map((st: any) => (
                <div key={st.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{st.fullName}</h4>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-300">
                        وضعیت بحرانی
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {st.className} • میانگین تسلط: <span className="font-mono font-bold text-rose-600">{st.avgMastery}٪</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`پیامک دعوت به جلسه مشاوره برای ولی ${st.fullName} ارسال شد.`)}
                      className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      دعوت اولیا به جلسه مشاوره
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActiveTab("planner");
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      تنظیم برنامه فشرده جبرانی
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
