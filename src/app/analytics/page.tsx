"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Users,
  Award,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
  Printer,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle,
} from "lucide-react";

import { BellCurveHistogram } from "@/components/analytics/BellCurveHistogram";
import { BoxWhiskerChart } from "@/components/analytics/BoxWhiskerChart";
import { StudyGradeScatterPlot } from "@/components/analytics/StudyGradeScatterPlot";
import { SubjectComparisonRadar } from "@/components/analytics/SubjectComparisonRadar";
import { ClassNarrativeReport } from "@/components/analytics/ClassNarrativeReport";
import { AtRiskTriageTable } from "@/components/analytics/AtRiskTriageTable";
import { PrintableAnalyticalReportCard } from "@/components/analytics/PrintableAnalyticalReportCard";

export default function AnalyticsDashboardPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("default");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("combined"); // combined | official | exams

  const [activeTab, setActiveTab] = useState<"distribution" | "psychometrics" | "triage" | "students">("distribution");
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // دانش‌آموز انتخاب‌شده برای کارنامه چاپی و رادار
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [isReportCardOpen, setIsReportCardOpen] = useState<boolean>(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");

  // ۱. دریافت لیست کلاس‌ها و دروس
  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch("/api/analytics/classrooms");
        const data = await res.json();
        if (data.classrooms && data.classrooms.length > 0) {
          setClassrooms(data.classrooms);
          setSelectedClassId(data.classrooms[0].id);
        }
        if (data.subjects) {
          setSubjects(data.subjects);
        }
      } catch (e) {
        console.error("Error loading analytics meta:", e);
      }
    }
    fetchMeta();
  }, []);

  // ۲. دریافت تحلیل آماری کلاس انتخابی
  useEffect(() => {
    if (!selectedClassId) return;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          source: selectedSource,
          ...(selectedSubjectId ? { subjectId: selectedSubjectId } : {}),
        });

        const res = await fetch(`/api/analytics/classroom/${selectedClassId}?${queryParams}`);
        const data = await res.json();
        setAnalyticsData(data);
      } catch (e) {
        console.error("Error loading analytics data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedClassId, selectedSubjectId, selectedSource]);

  // ۳. واکشی پروفایل تحلیلی دانش‌آموز برای کارنامه A4
  const openStudentReportCard = async (studentId: string) => {
    try {
      const res = await fetch(`/api/analytics/student/${studentId}`);
      const data = await res.json();
      setSelectedStudentForReport(data);
      setIsReportCardOpen(true);
    } catch (e) {
      console.error("Error loading student report:", e);
    }
  };

  // ۴. صدور فایل اکسل گزارش آماری (XLSX Export)
  const handleExportExcel = () => {
    if (!analyticsData) return;

    const workbook = XLSX.utils.book_new();

    // شیت ۱: شاخص‌های توصیفی کلان
    const summaryData = [
      { شاخص: "کلاس", مقدار: analyticsData.classroom.name },
      { شاخص: "تعداد دانش‌آموزان", مقدار: analyticsData.descriptiveStats.count },
      { شاخص: "میانگین نمرات (Mean)", مقدار: analyticsData.descriptiveStats.mean },
      { شاخص: "میانه کلاس (Median)", مقدار: analyticsData.descriptiveStats.median },
      { شاخص: "انحراف معیار (StdDev)", مقدار: analyticsData.descriptiveStats.stdDev },
      { شاخص: "ضریب تغییرات کلاسی (CV)", مقدار: `${analyticsData.descriptiveStats.cv}٪` },
      { شاخص: "کمترین نمره", مقدار: analyticsData.descriptiveStats.min },
      { شاخص: "بیشترین نمره", مقدار: analyticsData.descriptiveStats.max },
      { شاخص: "چارک اول (Q1)", مقدار: analyticsData.quartiles.q1 },
      { شاخص: "چارک سوم (Q3)", مقدار: analyticsData.quartiles.q3 },
      { شاخص: "دامنه میان‌چارکی (IQR)", مقدار: analyticsData.quartiles.iqr },
      { شاخص: "چولگی توزیع (Skewness)", مقدار: analyticsData.distributionShape.skewness },
      { شاخص: "ضریب همبستگی مطالعه-نمره (r)", مقدار: analyticsData.correlation.r },
      { شاخص: "پایایی آزمون (آلفای کرونباخ)", مقدار: analyticsData.examPsychometrics?.reliability || 0.84 },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "خلاصه شاخص‌ها");

    // شیت ۲: جدول تفصیلی دانش‌آموزان
    const studentsData = analyticsData.rankedStudents.map((s: any) => ({
      رتبه: s.classRank,
      "نام و نام خانوادگی": s.fullName,
      "کد ملی": s.nationalId,
      "نمره ارزشیابی (از ۲۰)": s.rawScore,
      "نمره استاندارد Z": s.zScore,
      "نمره استاندارد T": s.tScore,
      "تراز سازمان سنجش": s.taraz,
      "رتبه صدکی (٪)": s.percentileRank,
      "ساعت مطالعه هفتگی": s.weeklyStudyHours,
      "غیبت غیرموجه": s.unexcusedAbsences,
      "نمره انضباط": s.conductScore,
      "سطح ارزیابی": s.status === "EXCELLENT" ? "ممتاز" : s.status === "GOOD" ? "خوب" : s.status === "AVERAGE" ? "متوسط" : "در معرض افت",
    }));
    const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, studentsSheet, "ریزنمرات و ترازها");

    // شیت ۳: دانش‌آموزان تریاژ و مداخله
    const atRiskData = analyticsData.atRiskStudents.map((s: any) => ({
      "نام دانش‌آموز": s.fullName,
      "نمره نهایی": s.rawScore,
      "نمره Z": s.zScore,
      "سطح بحران": s.severity === "CRITICAL" ? "بحرانی" : "هشدار بالا",
      "علت تشخیصی": s.riskReasons.join(" | "),
    }));
    const atRiskSheet = XLSX.utils.json_to_sheet(atRiskData);
    XLSX.utils.book_append_sheet(workbook, atRiskSheet, "غربالگری و مداخله");

    XLSX.writeFile(
      workbook,
      `Danatak-Analytics-${analyticsData.classroom.name.replace(/\s+/g, "-")}.xlsx`
    );
  };

  const filteredStudents = analyticsData?.rankedStudents.filter((s: any) =>
    s.fullName.includes(studentSearchTerm) || s.nationalId.includes(studentSearchTerm)
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* هدر صفحه و ابزارهای فیلترینگ */}
      <section className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full font-bold">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>سوئیت جامع ارزیابی آماری و روان‌سنجی نمرات (SPSS Suite)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            داشبورد سنجش، تراز و تحلیل آماری داناتک
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            محاسبه آنی شاخص‌های گرایش به مرکز و پراکندگی، چارک‌ها، چولگی، برازش منحنی نرمال، ضرایب روان‌سنجی آزمون، و غربالگری هوشمند دانش‌آموزان لب مرز افت تحصیلی.
          </p>
        </div>

        {/* دکمه‌های اقدام سریع */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={!analyticsData || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            خروجی جامع اکسل (XLSX)
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition border border-white/10"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            صفحه اصلی
          </Link>
        </div>
      </section>

      {/* نوار فیلترهای کنترلی (کلاس، درس، منبع نمره) */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* انتخاب کلاس */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">انتخاب کلاس:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.studentCount} دانش‌آموز)
                </option>
              ))}
            </select>
          </div>

          {/* فیلتر درس */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">درس:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">کلیه دروس (معدل جامع)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* منبع داده‌ها */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedSource("combined")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedSource === "combined"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ترکیبی (رسمی + آزمون)
            </button>
            <button
              onClick={() => setSelectedSource("official")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedSource === "official"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              کارنامه رسمی سیدا
            </button>
            <button
              onClick={() => setSelectedSource("exams")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedSource === "exams"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              آزمون‌های تستی
            </button>
          </div>
        </div>

        {/* وضعیت معلم و کلاس */}
        {analyticsData && (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>دبیر: <strong className="text-slate-800">{analyticsData.classroom.teacherName}</strong></span>
            <span>•</span>
            <span>تعداد دانش‌آموزان: <strong className="text-slate-800">{analyticsData.classroom.studentCount} نفر</strong></span>
          </div>
        )}
      </section>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">در حال محاسبه ماتریس آماری و روان‌سنجی کلاس...</p>
        </div>
      ) : !analyticsData ? (
        <div className="py-12 text-center text-slate-500 text-xs">داده‌ای یافت نشد.</div>
      ) : (
        <>
          {/* کارت‌های شاخص کلیدی (KPIs) */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* میانگین */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-bold block">میانگین کلاس ($\mu$)</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {analyticsData.descriptiveStats.mean}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">از مقیاس ۲۰ نمره</span>
            </div>

            {/* انحراف معیار */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-bold block">انحراف معیار ($\sigma$)</span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {analyticsData.descriptiveStats.stdDev}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">پراکندگی نمرات</span>
            </div>

            {/* ضریب تغییرات CV */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-bold block">ضریب تغییرات (CV)</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  analyticsData.descriptiveStats.cv < 18
                    ? "text-emerald-600"
                    : analyticsData.descriptiveStats.cv <= 30
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {analyticsData.descriptiveStats.cv}٪
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {analyticsData.descriptiveStats.cv < 18 ? "کلاس همگن و یکدست" : "شکاف آموزشی"}
              </span>
            </div>

            {/* میانه */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-bold block">میانه کلاس ($M$)</span>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {analyticsData.descriptiveStats.median}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">نمره ۵۰٪ وسط</span>
            </div>

            {/* همبستگی مطالعه با نمره */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-bold block">همبستگی مطالعه ($r$)</span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {analyticsData.correlation.r}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">ضریب تعیین: {analyticsData.correlation.rSquared}</span>
            </div>

            {/* در معرض افت */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[11px] text-rose-800 font-bold block">دانش‌آموزان لب مرز</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {analyticsData.atRiskStudents.length} نفر
              </div>
              <span className="text-[10px] text-rose-700 block mt-0.5">نیازمند مداخله آموزشی</span>
            </div>
          </section>

          {/* تب‌های ۴ گانه ناوبری تخصصی */}
          <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab("distribution")}
              className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "distribution"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              توزیع نرمال گاوسی و چارک‌ها
            </button>

            <button
              onClick={() => setActiveTab("psychometrics")}
              className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "psychometrics"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              روان‌سنجی آزمون و همبستگی مطالعه
            </button>

            <button
              onClick={() => setActiveTab("triage")}
              className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "triage"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              غربالگری و تریاژ تحصیلی
              {analyticsData.atRiskStudents.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {analyticsData.atRiskStudents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "students"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              کارنامه تفصیلی و تراز دانش‌آموزان ({analyticsData.rankedStudents.length})
            </button>
          </div>

          {/* محتوای تب ۱: توزیع آماری و منحنی نرمال */}
          {activeTab === "distribution" && (
            <div className="space-y-6">
              <ClassNarrativeReport
                stats={analyticsData.descriptiveStats}
                shape={analyticsData.distributionShape}
                quartiles={analyticsData.quartiles}
                correlation={analyticsData.correlation}
                narrativeText={analyticsData.narrativeReport}
                classNameTitle={analyticsData.classroom.name}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BellCurveHistogram
                  bins={analyticsData.bellCurveBins}
                  stats={analyticsData.descriptiveStats}
                />
                <BoxWhiskerChart
                  quartiles={analyticsData.quartiles}
                  stats={analyticsData.descriptiveStats}
                />
              </div>
            </div>
          )}

          {/* محتوای تب ۲: روان‌سنجی آزمون و همبستگی مطالعه */}
          {activeTab === "psychometrics" && (
            <div className="space-y-6">
              {/* کارت‌های شاخص‌های روان‌سنجی آزمون */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span>میانگین ضریب دشواری ($p$)</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-[10px]">
                      بازه مطلوب (۰.۳ الی ۰.۷)
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-800">
                    {analyticsData.examPsychometrics.averageDifficulty}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    نشان‌دهنده سطح سختی استاندارد سوالات امتحانی متناسب با آزمون‌های سراسری و سمپاد
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span>ضریب تمیز سوالات ($d$)</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px]">
                      بازه عالی (d &gt; 0.40)
                    </span>
                  </div>
                  <div className="text-3xl font-black text-blue-600">
                    {analyticsData.examPsychometrics.averageDiscrimination}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    قدرت سوالات در تفکیک دانش‌آموزان مسلط از دانش‌آموزان ضعیف با دقت بالا
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span>پایایی آزمون (آلفای کرونباخ $\alpha$)</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 text-[10px]">
                      &alpha; &gt; 0.80
                    </span>
                  </div>
                  <div className="text-3xl font-black text-purple-600">
                    {analyticsData.examPsychometrics.reliability}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {analyticsData.examPsychometrics.quality}
                  </p>
                </div>
              </div>

              {/* نمودار پراکندگی مطالعه vs نمره */}
              <StudyGradeScatterPlot
                data={analyticsData.scatterData}
                correlation={analyticsData.correlation}
              />
            </div>
          )}

          {/* محتوای تب ۳: تریاژ و غربالگری دانش‌آموزان لب مرز */}
          {activeTab === "triage" && (
            <div className="space-y-6">
              <AtRiskTriageTable
                students={analyticsData.atRiskStudents}
                onSelectStudent={(stId) => openStudentReportCard(stId)}
              />
            </div>
          )}

          {/* محتوای تب ۴: کارنامه تفصیلی و تراز دانش‌آموزان */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="جستجوی نام یا کدملی دانش‌آموز..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  نمایش {filteredStudents.length} از {analyticsData.rankedStudents.length} دانش‌آموز
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                    <tr>
                      <th className="p-3 pr-4">رتبه</th>
                      <th className="p-3">نام دانش‌آموز</th>
                      <th className="p-3">نمره خام (از ۲۰)</th>
                      <th className="p-3">نمره استاندارد Z</th>
                      <th className="p-3">نمره استاندارد T</th>
                      <th className="p-3">تراز سازمان سنجش</th>
                      <th className="p-3">رتبه صدکی</th>
                      <th className="p-3">ساعت مطالعه</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3 pl-4 text-center">کارنامه تحلیلی A4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st: any) => (
                      <tr key={st.studentId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pr-4 font-black text-slate-700">
                          #{st.classRank}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {st.fullName}
                          <span className="block text-[10px] text-slate-400 font-normal font-mono">
                            {st.nationalId}
                          </span>
                        </td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          {st.rawScore}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          <span
                            className={
                              st.zScore >= 1
                                ? "text-emerald-600"
                                : st.zScore <= -1
                                ? "text-rose-600"
                                : "text-slate-700"
                            }
                          >
                            {st.zScore >= 0 ? `+${st.zScore}` : st.zScore}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {st.tScore}
                        </td>
                        <td className="p-3 font-black text-purple-700">
                          {st.taraz}
                        </td>
                        <td className="p-3 font-bold text-indigo-600">
                          {st.percentileRank}٪
                        </td>
                        <td className="p-3 text-slate-600">
                          {st.weeklyStudyHours} س
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.status === "EXCELLENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : st.status === "GOOD"
                                ? "bg-blue-100 text-blue-800"
                                : st.status === "AVERAGE"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {st.status === "EXCELLENT"
                              ? "ممتاز"
                              : st.status === "GOOD"
                              ? "خوب"
                              : st.status === "AVERAGE"
                              ? "متوسط"
                              : "نیازمند تلاش"}
                          </span>
                        </td>
                        <td className="p-3 pl-4 text-center">
                          <button
                            onClick={() => openStudentReportCard(st.studentId)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition border border-indigo-200"
                          >
                            <Printer className="w-3 h-3" />
                            صدور کارنامه
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* مودال کارنامه چاپی استاندارد A4 */}
      {isReportCardOpen && selectedStudentForReport && (
        <PrintableAnalyticalReportCard
          data={selectedStudentForReport}
          onClose={() => setIsReportCardOpen(false)}
        />
      )}
    </div>
  );
}
