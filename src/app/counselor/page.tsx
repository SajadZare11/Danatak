"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  BarChart3,
  Layers,
  MessageSquare,
} from "lucide-react";
import { CollapsibleDashboardCard } from "@/components/common/CollapsibleDashboardCard";

export default function CounselorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  // وضعیت باز/بسته بودن ۴ کارت کشویی (تماماً بسته در بدو ورود طبق انتخاب کاربر)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    tracker: false,
    planner: false,
    atrisk: false,
    tools: false,
  });

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

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
        showToast("برنامه مطالعاتی هوشمند بر مبنای نقاط ضعف رادار تسلط تدوین شد.");
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
        showToast("برنامه هفتگی با موفقیت تایید و به کارتابل دانش‌آموز ابلاغ شد.");
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
      {/* اعلان‌های شناور */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ۱. هدر بالای پنل مشاور */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">داشبورد مشاوره و برنامه‌ریزی تحصیلی</h1>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {counselor.fullName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              رصد ساعات مطالعه، تنظیم برنامه هفتگی هوشمند و پرونده‌های ارجاعی
            </p>
          </div>
        </div>

        {/* انتخاب سریع دانش‌آموز */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-600">دانش‌آموز فعال:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
          >
            {students.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ۲. کارت‌های شاخص‌های کلیدی مشاوره */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">دانش‌آموزان تحت پوشش</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">{stats.totalStudents} نفر</div>
          <div className="text-[10px] text-slate-400 mt-0.5">پایه‌های دوازدهم و یازدهم</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">میانگین ساعات مطالعه</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">{stats.avgWeeklyHoursSchool} ساعت</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">هفتگی در کل پایه</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">برنامه‌های ابلاغ‌شده</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-600 font-mono">{stats.activePlansCount} برنامه</div>
          <div className="text-[10px] text-blue-700 mt-0.5">جدول مطالعاتی فعال</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">پرونده‌های قرمز (افت)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">{stats.atRiskCount} نفر</div>
          <div className="text-[10px] text-rose-700 mt-0.5">نیازمند جلسه فوری</div>
        </div>
      </div>

      {/* راهنمای کوتاه شروع */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">
          💡 برای بررسی عملکرد، تدوین برنامه یا مدیریت پرونده‌ها، روی هر یک از ۴ کارت زیر کلیک کنید:
        </span>
        <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-block">
          ۴ بخش کارتابل مشاور
        </span>
      </div>

      {/* ===================================================================== */}
      {/* ساختار ۴ کارتی کشویی داشبورد مشاور (تماماً بسته در بدو ورود) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* کارت ۱: رصد ساعات مطالعه و تست روزانه */}
        <CollapsibleDashboardCard
          id="counselor-card-tracker"
          title="۱. رصد ساعات مطالعه و عملکرد هفتگی"
          subtitle={`بررسی لاگ مطالعه هفتگی ${stats.totalStudents} دانش‌آموز • تست‌های حل‌شده و استمرار مطالعه`}
          icon={<Clock className="w-6 h-6" />}
          colorScheme="amber"
          badge={
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
              میانگین {stats.avgWeeklyHoursSchool} ساعت
            </span>
          }
          isOpen={openCards.tracker}
          onToggle={() => toggleCard("tracker")}
        >
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">ردیف</th>
                  <th className="py-2.5 px-4 text-right">نام دانش‌آموز</th>
                  <th className="py-2.5 px-3">کلاس</th>
                  <th className="py-2.5 px-3 bg-amber-50/50">ساعات مطالعه</th>
                  <th className="py-2.5 px-3 bg-emerald-50/50">تعداد تست</th>
                  <th className="py-2.5 px-3">تسلط</th>
                  <th className="py-2.5 px-3">استمرار</th>
                  <th className="py-2.5 px-3">برنامه</th>
                  <th className="py-2.5 px-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">{s.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.className}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-amber-900 bg-amber-50/30">
                      {s.weeklyHours} ساعت
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-800 bg-emerald-50/30">
                      {s.totalTests} تست
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{s.avgMastery}٪</td>
                    <td className="py-2.5 px-3 font-bold text-orange-600">
                      <span className="flex items-center justify-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                        {s.streakDays} روز
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.isPlanApproved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.isPlanApproved ? "ابلاغ شده ✓" : "بدون برنامه"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setOpenCards((prev) => ({ ...prev, planner: true }));
                        }}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تنظیم برنامه</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۲: دستیار هوشمند برنامه‌ریزی هفتگی (AI) */}
        <CollapsibleDashboardCard
          id="counselor-card-planner"
          title="۲. دستیار هوشمند برنامه‌ریزی هفتگی (AI)"
          subtitle={`تدوین هوشمند جدول هفتگی برای ${currentStudent?.fullName || "علی رضایی"} بر مبنای ضعف‌های رادار تسلط`}
          icon={<Sparkles className="w-6 h-6" />}
          colorScheme="indigo"
          badge={
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              هوش مصنوعی
            </span>
          }
          isOpen={openCards.planner}
          onToggle={() => toggleCard("planner")}
        >
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  دانش‌آموز منتخب: {currentStudent?.fullName} ({currentStudent?.className})
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تنظیم زمان مطالعه و سهم تست متناسب با دروس ضعیف کارنامه
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiPlan}
                  disabled={generatingAi}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{generatingAi ? "در حال تدوین..." : "تدوین هوشمند با AI"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>تایید و ابلاغ به دانش‌آموز</span>
                </button>
              </div>
            </div>

            {planLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">در حال بارگذاری جدول مطالعاتی...</div>
            ) : !studentPlanData?.plan?.schedule ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                برنامه‌ای تدوین نشده است. روی «تدوین هوشمند با AI» کلیک فرمایید.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {studentPlanData.plan.schedule.map((dayPlan: any, dIdx: number) => (
                    <div key={dIdx} className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-black text-slate-900 text-xs">{dayPlan.day}</span>
                        <span className="text-[10px] text-slate-400">روز {dIdx + 1}</span>
                      </div>

                      <div className="space-y-2">
                        {dayPlan.slots.map((slot: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              slot.isFocusTopic ? "bg-rose-50/70 border-rose-300" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800">{slot.subject}</span>
                              <span className="font-mono text-[10px] text-slate-500">{slot.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-700">{slot.topic}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                              <span>⏱ {slot.targetMinutes} دقیقه</span>
                              <span>🎯 {slot.targetTests} تست</span>
                              {slot.isFocusTopic && (
                                <span className="text-rose-700 font-bold bg-rose-100 px-1 py-0.2 rounded">
                                  جبرانی
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    توصیه‌ها و نکات مشاور ارشد برای این هفته:
                  </label>
                  <textarea
                    rows={2}
                    value={counselorNoteInput}
                    onChange={(e) => setCounselorNoteInput(e.target.value)}
                    placeholder="نکات انگیزشی و شیوه حل تست..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۳: پرونده‌های ارجاعی و دانش‌آموزان در وضعیت قرمز */}
        <CollapsibleDashboardCard
          id="counselor-card-atrisk"
          title="۳. پرونده‌های ارجاعی و وضعیت قرمز"
          subtitle={`${stats.atRiskCount} دانش‌آموز با افت ساعت مطالعه یا تراز تحصیلی • دعوت اولیا و جلسات مشاوره`}
          icon={<AlertTriangle className="w-6 h-6" />}
          colorScheme="rose"
          badge={
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              {stats.atRiskCount} پرونده
            </span>
          }
          isOpen={openCards.atrisk}
          onToggle={() => toggleCard("atrisk")}
        >
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {students
              .filter((s: any) => s.isAtRisk)
              .map((st: any) => (
                <div key={st.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{st.fullName}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.2 rounded-full border border-rose-200">
                        افت تراز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {st.className} • میانگین تسلط: <span className="font-bold text-rose-600">{st.avgMastery}٪</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast(`پیامک دعوت به جلسه مشاوره برای ولی ${st.fullName} ارسال شد.`)}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>دعوت اولیا</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setOpenCards((prev) => ({ ...prev, planner: true }));
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تدوین برنامه فشرده</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۴: ابزارهای تکمیلی هدایت تحصیلی */}
        <CollapsibleDashboardCard
          id="counselor-card-tools"
          title="۴. ابزارهای تکمیلی هدایت تحصیلی"
          subtitle="رادار تسلط و گراف پیش‌نیازها، داشبورد تحلیل نمرات و ارتباط مستقیم با اولیا"
          icon={<Layers className="w-6 h-6" />}
          colorScheme="purple"
          badge={
            <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
              ابزارهای تحلیلی
            </span>
          }
          isOpen={openCards.tools}
          onToggle={() => toggleCard("tools")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/mastery"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition space-y-2 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-900">رادار تسلط و گراف پیش‌نیازها</h5>
              <p className="text-[11px] text-slate-500">مشاهده نمودار عنکبوتی Recharts و زنجیره مباحث</p>
            </Link>

            <Link
              href="/analytics"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition space-y-2 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-900">داشبورد آمار و تحلیل نمرات (SPSS)</h5>
              <p className="text-[11px] text-slate-500">تحلیل همبستگی ساعت مطالعه با نمره و تراز</p>
            </Link>

            <Link
              href="/messages"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition space-y-2 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-900">پیام‌ها و ارتباط با اولیا</h5>
              <p className="text-[11px] text-slate-500">کانال ارتباطی محرمانه مشاور با والدین و دبیران</p>
            </Link>
          </div>
        </CollapsibleDashboardCard>
      </div>
    </div>
  );
}
