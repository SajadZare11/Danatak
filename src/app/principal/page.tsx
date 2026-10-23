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
} from "lucide-react";
import { RapidAttendanceModal } from "@/components/attendance/RapidAttendanceModal";
import { DisciplineModal } from "@/components/discipline/DisciplineModal";
import { SidaManagerModal } from "@/components/sida/SidaManagerModal";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";

export default function PrincipalDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "atrisk" | "sida" | "attendance">("matrix");
  const [data, setData] = useState<any | null>(null);

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
          <p className="text-sm font-bold text-slate-700">در حال بارگذاری ماتریس سلامت تحصیلی و داده‌های کلان مدرسه...</p>
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
      {/* هدر بالایی داشبورد مدیر */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">داشبورد مدیر و ماتریس سلامت مدرسه</h1>
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                {school.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {school.name} • کد آموزش و پرورش: <span className="font-mono font-bold text-slate-700">{school.code}</span> • سال تحصیلی ۱۴۰۳-۱۴۰۴
            </p>
          </div>
        </div>

        {/* اکشن‌های سریع مدیر */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            حضور و غیاب امروز
          </button>

          <button
            onClick={() => {
              setSelectedStudentForDiscipline(undefined);
              setIsDisciplineModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Award className="w-4 h-4 text-rose-600" />
            ثبت کارت انضباطی
          </button>

          <button
            onClick={() => setIsSidaModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            خروجی اکسل سیدا (Sida)
          </button>
        </div>
      </div>

      {/* نوتیفیکیشن تست */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* نوار کارت‌های شاخص‌های کلیدی مدرسه (Executive KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">کل دانش‌آموزان</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{summary.totalStudents} نفر</div>
          <div className="text-[10px] text-slate-400 mt-0.5">در {summary.totalClassrooms} کلاس فعال</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">نرخ حضور امروز</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">{summary.attendanceRateToday}٪</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">
            {summary.presentToday} حاضر • {summary.absentToday} غایب
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">میانگین تسلط مدرسه</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 font-mono">{summary.schoolMasteryAverage}٪</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">برآیند تمام مباحث</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">وضعیت قرمز (At-Risk)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{summary.atRiskCount} نفر</div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">نیازمند مداخله فوری</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">کارت‌های تشویقی (+)</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">{summary.totalPositiveMerits} مورد</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">ثبت‌شده توسط کادر</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">تذکرات انضباطی (-)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">{summary.totalNegativeDemerits} مورد</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">در پرونده انضباطی</div>
        </div>
      </div>

      {/* تب‌های ناوبری اصلی پنل مدیر */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "matrix"
              ? "bg-purple-700 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Flame className="w-4 h-4" />
          نقشه حرارتی ضعف‌های مدرسه (School Heatmap)
        </button>

        <button
          onClick={() => setActiveTab("atrisk")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "atrisk"
              ? "bg-purple-700 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          رادار دانش‌آموزان در وضعیت قرمز ({atRiskStudents.length} نفر)
        </button>

        <button
          onClick={() => setActiveTab("sida")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "sida"
              ? "bg-purple-700 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          درگاه یکپارچه سامانه سیدا و کارنامه
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "attendance"
              ? "bg-purple-700 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4 text-blue-500" />
          پایش تردد، حضور/غیاب و انضباط
        </button>

        <Link
          href="/analytics"
          className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm"
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          سوئیت آمار تحلیلی و روان‌سنجی (SPSS 📊)
        </Link>
      </div>

      {/* تب ۱: نقشه حرارتی ضعف‌های مدرسه (School Weakness Heatmap) */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* کارت‌های مقایسه پایه‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradeLevels.map((gl: any) => (
              <div
                key={gl.gradeLevel}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{gl.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{gl.studentCount} دانش‌آموز ثبت‌نام‌شده</p>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold font-mono">
                      میانگین تسلط: {gl.averageMastery}٪
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold font-mono">
                      حضور: {gl.attendanceRate}٪
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg font-mono">
                  {gl.averageMastery}٪
                </div>
              </div>
            ))}
          </div>

          {/* فیلتر پایه و راهنمای رنگ‌بندی حرارتی */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">فیلتر پایه درسی:</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setHeatmapGradeFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    heatmapGradeFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  همه پایه‌ها
                </button>
                <button
                  onClick={() => setHeatmapGradeFilter(12)}
                  className={`px-3 py-1 rounded-lg transition ${
                    heatmapGradeFilter === 12 ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  پایه دوازدهم
                </button>
                <button
                  onClick={() => setHeatmapGradeFilter(11)}
                  className={`px-3 py-1 rounded-lg transition ${
                    heatmapGradeFilter === 11 ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  پایه یازدهم
                </button>
              </div>
            </div>

            {/* راهنمای رنگ‌های نقشه حرارتی */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                تسلط مطلوب (بالای ۷۵٪)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                متوسط (۵۰ تا ۷۵٪)
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                ضعف بحرانی مدرسه (زیر ۵۰٪)
              </span>
            </div>
          </div>

          {/* ماتریس شبکه‌ای مباحث (Heatmap Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic: any) => {
              const isCritical = topic.averageMastery < 50;
              const isHigh = topic.averageMastery >= 75;

              return (
                <div
                  key={topic.id}
                  className={`p-5 rounded-2xl border transition shadow-sm ${
                    isCritical
                      ? "bg-rose-50/70 border-rose-200 hover:border-rose-300"
                      : isHigh
                      ? "bg-emerald-50/70 border-emerald-200 hover:border-emerald-300"
                      : "bg-amber-50/70 border-amber-200 hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        {topic.textbookTitle} • پایه {topic.gradeLevel}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{topic.title}</h4>
                    </div>

                    <div
                      className={`text-base font-black font-mono px-3 py-1 rounded-xl shadow-xs ${
                        isCritical
                          ? "bg-rose-600 text-white"
                          : isHigh
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {topic.averageMastery}٪
                    </div>
                  </div>

                  {/* نوار پیشرفت تسلط */}
                  <div className="mt-4">
                    <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden border border-slate-200/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? "bg-rose-500" : isHigh ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${topic.averageMastery}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* تحلیل مدیر و دکمه اقدام */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px]">
                      {isCritical ? "⚠️ نیاز به کلاس جبرانی فوری" : isHigh ? "✓ وضعیت تثبیت‌شده" : "نیازمند تمرین مکمل"}
                    </span>

                    {isCritical && (
                      <button
                        onClick={() => showToast(`دستور تشکیل کلاس جبرانی برای مبحث «${topic.title}» به دبیر مربوطه ابلاغ شد.`)}
                        className="text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-lg transition shadow-xs"
                      >
                        صدور دستور کلاس جبرانی
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تب ۲: رادار دانش‌آموزان در وضعیت قرمز (At-Risk Registry) */}
      {activeTab === "atrisk" && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">سامانه تشخیص زودهنگام افت تحصیلی (Early Warning System)</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  دانش‌آموزانی که برآیند شاخص تسلط، غیبت‌ها یا کارت‌های منفی آن‌ها نشان‌دهنده ریسک افت است
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {atRiskStudents.map((st: any) => (
                <div key={st.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-rose-300 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                      {st.avatarUrl ? <img src={st.avatarUrl} alt={st.fullName} className="w-full h-full object-cover" /> : st.fullName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{st.fullName}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st.riskLevel === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {st.riskLevel === "CRITICAL" ? "ریسک بحرانی" : "هشدار افت"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {st.classroomName} • کد ملی: <span className="font-mono">{st.nationalId}</span>
                      </p>
                    </div>
                  </div>

                  {/* عوامل خطر */}
                  <div className="flex-1 min-w-[260px] space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">عوامل خطر شناسایی‌شده:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {st.riskFactors.map((rf: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg font-medium"
                        >
                          {rf}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* شاخص تسلط و غیبت */}
                  <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">میانگین تسلط</span>
                    <span className="text-sm font-black text-rose-600 font-mono">{st.averageMastery}٪</span>
                  </div>

                  {/* دکمه‌های اقدام سریع مدیر */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudentForReport(st.id);
                        setIsReportCardOpen(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      کارنامه رسمی
                    </button>

                    <button
                      onClick={() => showToast(`پرونده تحصیلی ${st.fullName} با اولویت قرمز به مشاور ارشد ارجاع شد.`)}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ارجاع به مشاور
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStudentForDiscipline({ id: st.id, name: st.fullName });
                        setIsDisciplineModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-rose-600" />
                      ثبت تذکر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: درگاه سامانه سیدا (Sida Portal) */}
      {activeTab === "sida" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">درگاه تولید و بارگذاری نمرات سامانه سیدا (Sida)</h3>
              <p className="text-xs text-slate-500 mt-1">
                تولید فایل اکسل استاندارد مطابق قالب نهایی وزارت آموزش و پرورش برای بارگذاری با ۱ کلیک در سامانه سیدا
              </p>
            </div>

            <button
              onClick={() => setIsSidaModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              مدیریت و دانلود فایل اکسل سیدا
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
              <span className="font-bold text-emerald-900 block mb-1">۱. تطابق کامل ستون‌ها با سیدا</span>
              <p className="text-emerald-700 text-[11px] leading-relaxed">
                ستون‌های کد ملی، نمرات مستمر ۱ و ۲، پایانی ۱ و ۲، نمره سالانه استاندارد، انضباط و غیبت‌ها دقیقا با فیلدهای ورودی سیدا همخوانی دارند.
              </p>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
              <span className="font-bold text-blue-900 block mb-1">۲. اتصال نمرات تکالیف و آزمون‌ها</span>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                نمرات مستمر بر اساس میانگین وزندار تکالیف و آزمون‌های آنلاین ضدتقلب سامانه به صورت خودکار محاسبه و آماده پیش‌نمایش هستند.
              </p>
            </div>

            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl">
              <span className="font-bold text-purple-900 block mb-1">۳. کارنامه دوگانه رسمی</span>
              <p className="text-purple-700 text-[11px] leading-relaxed">
                امکان چاپ کارنامه رسمی با سربرگ آموزش و پرورش در دو قالب متوسطه (۰ تا ۲۰) و ابتدایی (توصیفی کیفی).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* تب ۴: پایش تردد، حضور/غیاب و انضباط (Attendance & Discipline Hub) */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* کارت وضعیت تردد امروز */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">گزارش لحظه‌ای تردد و حضور امروز</h3>
              </div>
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition"
              >
                ثبت حضور/غیاب کلاس
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">سوابق انضباطی و تشویقی‌های اخیر</h3>
              </div>
              <button
                onClick={() => setIsDisciplineModalOpen(true)}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-xl border border-purple-200 transition"
              >
                صدور کارت جدید
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
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
      )}

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
