"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Award,
  Clock,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Download,
  Search,
  Filter,
  Check,
  Send,
  Sparkles,
  Printer,
  ChevronLeft,
  Flame,
  BarChart3,
  Layers,
} from "lucide-react";
import { RapidAttendanceModal } from "@/components/attendance/RapidAttendanceModal";
import { DisciplineModal } from "@/components/discipline/DisciplineModal";
import { SidaManagerModal } from "@/components/sida/SidaManagerModal";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";
import { CollapsibleDashboardCard } from "@/components/common/CollapsibleDashboardCard";

export default function PrincipalDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  // وضعیت باز/بسته بودن ۴ کارت کشویی (تماماً بسته در بدو ورود طبق انتخاب کاربر)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    attendance: false,
    matrix: false,
    atrisk: false,
    sida: false,
  });

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // وضعیت مودال‌ها
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
  const [isSidaModalOpen, setIsSidaModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | undefined>(undefined);
  const [selectedStudentForDiscipline, setSelectedStudentForDiscipline] = useState<{ id: string; name: string } | undefined>(undefined);

  // فیلتر پایه در نقشه حرارتی
  const [heatmapGradeFilter, setHeatmapGradeFilter] = useState<number | "ALL">("ALL");

  // اعلان پیام
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchMatrixData = async () => {
    try {
      const res = await fetch("/api/principal/matrix");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error("Failed to load principal matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">در حال بارگذاری داشبورد کلان مدیریت مدرسه...</p>
        </div>
      </div>
    );
  }

  const { school, summary, gradeLevels, heatmapTopics, atRiskStudents, todayAttendance, recentDiscipline } = data;

  const filteredTopics = heatmapTopics.filter((t: any) => {
    if (heatmapGradeFilter === "ALL") return true;
    return t.gradeLevel === heatmapGradeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* پیام اعلان شناور */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ۱. هدر بالایی داشبورد مدیر */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">داشبورد مدیریت و نظارت کلان مدرسه</h1>
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                {school.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {school.name} • کد واحد آموزشی: <span className="font-mono font-bold text-slate-700">{school.code}</span> • سال تحصیلی ۱۴۰۳-۱۴۰۴
            </p>
          </div>
        </div>

        {/* دسترسی‌های سریع */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/analytics"
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>تحلیل آماری نمرات (SPSS)</span>
          </Link>

          <Link
            href="/sms"
            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>سامانه پیامک اولیا</span>
          </Link>
        </div>
      </div>

      {/* ۲. شاخص‌های کلیدی کلان مدرسه (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">کل دانش‌آموزان</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">{summary.totalStudents} نفر</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{summary.totalClassrooms} کلاس فعال</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">نرخ حضور امروز</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">{summary.attendanceRateToday}٪</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">
            {summary.presentToday} حاضر • {summary.absentToday} غایب
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">میانگین تسلط</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-600 font-mono">{summary.schoolMasteryAverage}٪</div>
          <div className="text-[10px] text-blue-700 mt-0.5">برآیند تمام مباحث</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">وضعیت قرمز (افت)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">{summary.atRiskCount} نفر</div>
          <div className="text-[10px] text-rose-600 mt-0.5">نیازمند مداخله فوری</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">تشویقی‌ها (+)</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">{summary.totalPositiveMerits} مورد</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">ثبت کادر آموزشی</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">تذکرات انضباطی (-)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 font-mono">{summary.totalNegativeDemerits} مورد</div>
          <div className="text-[10px] text-amber-600 mt-0.5">پرونده انضباطی</div>
        </div>
      </div>

      {/* راهنمای کوتاه شروع */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">
          💡 برای بررسی شاخص‌ها و اعمال دستورات مدیریتی، روی هر یک از ۴ کارت زیر کلیک کنید:
        </span>
        <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-block">
          ۴ بخش اصلی پنل مدیریت
        </span>
      </div>

      {/* ===================================================================== */}
      {/* ساختار ۴ کارتی کشویی داشبورد مدیر (تماماً بسته در بدو ورود) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* کارت ۱: تردد، حضور/غیاب و انضباط امروز */}
        <CollapsibleDashboardCard
          id="principal-card-attendance"
          title="۱. تردد، حضور و غیاب و انضباط امروز"
          subtitle={`نرخ حضور ${summary.attendanceRateToday}٪ • ${summary.presentToday} حاضر و ${summary.absentToday} غایب • ${recentDiscipline.length} مورد انضباطی اخیر`}
          icon={<Clock className="w-6 h-6" />}
          colorScheme="indigo"
          badge={
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {summary.attendanceRateToday}٪ حضور
            </span>
          }
          isOpen={openCards.attendance}
          onToggle={() => toggleCard("attendance")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* کارت وضعیت تردد امروز */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">گزارش لحظه‌ای تردد و حضور امروز</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition"
                >
                  ثبت حضور/غیاب کلاس
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {todayAttendance.map((rec: any) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{rec.student.fullName}</span>
                      <span className="text-[11px] text-slate-400 mr-2">({rec.classroom.name})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : rec.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {rec.status === "PRESENT" ? "حاضر" : rec.status === "LATE" ? `تاخیر (${rec.delayMinutes} دقیقه)` : "غایب"}
                      </span>
                      {rec.note && <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{rec.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* کارت سوابق انضباطی اخیر */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">سوابق تشویق و انضباط اخیر</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisciplineModalOpen(true)}
                  className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-xl border border-purple-200 transition"
                >
                  صدور کارت جدید
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {recentDiscipline.map((disc: any) => (
                  <div key={disc.id} className="py-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{disc.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          disc.type === "POSITIVE"
                            ? "bg-emerald-100 text-emerald-800 font-mono"
                            : "bg-rose-100 text-rose-800 font-mono"
                        }`}
                      >
                        {disc.type === "POSITIVE" ? `+${disc.points}` : `${disc.points}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>ثبت‌کننده: {disc.recordedBy}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(disc.date).toLocaleDateString("fa-IR")}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۲: نقشه حرارتی ضعف‌های یادگیری مدرسه */}
        <CollapsibleDashboardCard
          id="principal-card-matrix"
          title="۲. نقشه حرارتی ضعف‌های یادگیری مدرسه"
          subtitle={`میانگین تسلط کل مدرسه ${summary.schoolMasteryAverage}٪ • پایش تحلیلی مباحث دروس پایه دهم تا دوازدهم`}
          icon={<Flame className="w-6 h-6" />}
          colorScheme="purple"
          badge={
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
              میانگین تسلط {summary.schoolMasteryAverage}٪
            </span>
          }
          isOpen={openCards.matrix}
          onToggle={() => toggleCard("matrix")}
        >
          <div className="space-y-6">
            {/* مقایسه پایه‌ها */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gradeLevels.map((gl: any) => (
                <div
                  key={gl.gradeLevel}
                  className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{gl.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{gl.studentCount} دانش‌آموز ثبت‌نام‌شده</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200 font-bold font-mono">
                        میانگین: {gl.averageMastery}٪
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-bold font-mono">
                        حضور: {gl.attendanceRate}٪
                      </span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-base font-mono">
                    {gl.averageMastery}٪
                  </div>
                </div>
              ))}
            </div>

            {/* فیلتر و راهنمای رنگ */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">فیلتر پایه درسی:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
                  <button
                    type="button"
                    onClick={() => setHeatmapGradeFilter("ALL")}
                    className={`px-3 py-1 rounded-lg transition ${
                      heatmapGradeFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapGradeFilter(12)}
                    className={`px-3 py-1 rounded-lg transition ${
                      heatmapGradeFilter === 12 ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    دوازدهم
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapGradeFilter(11)}
                    className={`px-3 py-1 rounded-lg transition ${
                      heatmapGradeFilter === 11 ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    یازدهم
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 font-bold text-[11px]">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  مطلوب (+۷۵٪)
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  متوسط (۵۰-۷۵٪)
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  نیاز به اقدام (زیر ۵۰٪)
                </span>
              </div>
            </div>

            {/* ماتریس مباحث */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTopics.map((topic: any) => {
                const isCritical = topic.averageMastery < 50;
                const isHigh = topic.averageMastery >= 75;

                return (
                  <div
                    key={topic.id}
                    className={`p-4 rounded-2xl border transition ${
                      isCritical
                        ? "bg-rose-50/70 border-rose-200"
                        : isHigh
                        ? "bg-emerald-50/70 border-emerald-200"
                        : "bg-amber-50/70 border-amber-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">
                          {topic.textbookTitle} • پایه {topic.gradeLevel}
                        </span>
                        <h5 className="text-xs font-black text-slate-900">{topic.title}</h5>
                      </div>
                      <div
                        className={`text-sm font-black font-mono px-2.5 py-0.5 rounded-lg ${
                          isCritical ? "bg-rose-600 text-white" : isHigh ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                        }`}
                      >
                        {topic.averageMastery}٪
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden border border-slate-200/40">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? "bg-rose-500" : isHigh ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${topic.averageMastery}%` }}
                        ></div>
                      </div>
                    </div>

                    {isCritical && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-rose-700 font-bold">⚠️ افت تحصیلی کلاسی</span>
                        <button
                          type="button"
                          onClick={() => showToast(`دستور تشکیل کلاس جبرانی برای مبحث «${topic.title}» صادر گردید.`)}
                          className="font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-lg transition"
                        >
                          دستور کلاس جبرانی
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۳: رادار دانش‌آموزان در وضعیت قرمز (At-Risk) */}
        <CollapsibleDashboardCard
          id="principal-card-atrisk"
          title="۳. رادار دانش‌آموزان نیازمند اقدام فوری"
          subtitle={`${summary.atRiskCount} دانش‌آموز در آستانه افت تحصیلی (تسلط زیر ۶۰٪) • سامانه تشخیص زودهنگام و ارجاع`}
          icon={<AlertTriangle className="w-6 h-6" />}
          colorScheme="rose"
          badge={
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              {summary.atRiskCount} مورد قرمز
            </span>
          }
          isOpen={openCards.atrisk}
          onToggle={() => toggleCard("atrisk")}
        >
          <div className="space-y-3">
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {atRiskStudents.map((st: any) => (
                <div key={st.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-rose-300 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                      {st.avatarUrl ? <img src={st.avatarUrl} alt={st.fullName} className="w-full h-full object-cover" /> : st.fullName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{st.fullName}</span>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.2 rounded-full">
                          {st.riskLevel === "CRITICAL" ? "بحرانی" : "هشدار"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {st.classroomName} • کدملی: {st.nationalId}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {st.riskFactors.map((rf: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                          {rf}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-center px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">تسلط</span>
                    <span className="font-bold text-rose-600 font-mono">{st.averageMastery}٪</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForReport(st.id);
                        setIsReportCardOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>کارنامه</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast(`پرونده ${st.fullName} با فوریت به مشاور تحصیلی ارجاع شد.`)}
                      className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>مشاور</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForDiscipline({ id: st.id, name: st.fullName });
                        setIsDisciplineModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5 text-rose-600" />
                      <span>تذکر</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۴: درگاه سامانه سیدا و صدور کارنامه رسمی */}
        <CollapsibleDashboardCard
          id="principal-card-sida"
          title="۴. درگاه سامانه سیدا و صدور کارنامه رسمی"
          subtitle="تولید فایل اکسل استاندارد منطبق بر ساختار سیدای وزارت آموزش و پرورش و کارنامه‌ها"
          icon={<FileSpreadsheet className="w-6 h-6" />}
          colorScheme="emerald"
          badge={
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              سیدا و کارنامه
            </span>
          }
          isOpen={openCards.sida}
          onToggle={() => toggleCard("sida")}
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">اتصال و بارگذاری نمرات در سامانه سیدا (Sida)</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تولید خودکار اکسل نمرات با کدملی، نمرات مستمر و پایانی و بارگذاری با ۱ کلیک
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidaModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>مدیریت فایل اکسل سیدا</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">۱. تطابق کامل ستون‌ها با سیدا</span>
                <p className="text-emerald-700 text-[11px]">ستون‌ها دقیقاً با قالب رسمی وزارتخانه همخوانی دارند.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 block mb-1">۲. میانگین وزندار تکالیف و آزمون</span>
                <p className="text-blue-700 text-[11px]">محاسبه هوشمند نمره مستمر از کارنامه آنلاین و تکالیف.</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-900 block mb-1">۳. صدور کارنامه چاپی</span>
                <p className="text-purple-700 text-[11px]">امکان چاپ کارنامه رسمی با فرمت مصوب آموزش و پرورش.</p>
              </div>
            </div>
          </div>
        </CollapsibleDashboardCard>
      </div>

      {/* مودال‌های عملیاتی */}
      <RapidAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        classroomId={data.school.id ? data.school.id : "class-12"}
        classroomName="کلاس ۱۲/۱ (دوازدهم ریاضی)"
        onSavedSuccess={() => {
          showToast("دفتر حضور و غیاب امروز با موفقیت ذخیره شد.");
          fetchMatrixData();
        }}
      />

      <DisciplineModal
        isOpen={isDisciplineModalOpen}
        onClose={() => setIsDisciplineModalOpen(false)}
        studentId={selectedStudentForDiscipline?.id}
        studentName={selectedStudentForDiscipline?.name}
        availableStudents={data.atRiskStudents}
        onSavedSuccess={() => {
          showToast("کارت انضباطی با موفقیت در پرونده ثبت شد.");
          fetchMatrixData();
        }}
      />

      <SidaManagerModal
        isOpen={isSidaModalOpen}
        onClose={() => setIsSidaModalOpen(false)}
      />

      <OfficialReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        studentId={selectedStudentForReport}
      />
    </div>
  );
}
