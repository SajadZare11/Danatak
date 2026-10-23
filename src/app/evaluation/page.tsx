"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ChevronDown,
  X,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

interface TeacherSummary {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  totalEvaluations: number;
  studentSatisfaction: number;
  parentSatisfaction: number;
  overallScore: number;
  radarMastery: number;
  radarFairness: number;
  radarEthics: number;
  radarDiscipline: number;
  radarInspiration: number;
  radarEngagement: number;
  aiSummaryStrengths?: string | null;
  aiSummaryImprovements?: string | null;
}

interface EvaluationRecord {
  id: string;
  teacherName: string;
  subjectName: string;
  evaluatorRole: string;
  className: string;
  overallScore: number;
  strengthsText?: string | null;
  improvementSuggestions?: string | null;
  createdAt: string;
}

export default function TeacherEvaluationPage() {
  const { currentRole, currentUser } = useRole();
  const [summaries, setSummaries] = useState<TeacherSummary[]>([]);
  const [feedbacks, setFeedbacks] = useState<EvaluationRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("teacher-demo");

  // حالت مودال چاپ کارنامه رسمی A4
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReportTeacher, setSelectedReportTeacher] = useState<TeacherSummary | null>(null);

  // فرم نظرسنجی دانش‌آموز/اولیا
  const [surveyRole, setSurveyRole] = useState<"STUDENT" | "PARENT">("STUDENT");
  const [surveyTeacherId, setSurveyTeacherId] = useState("teacher-demo");
  const [scores, setScores] = useState({
    academicMastery: 5,
    gradingFairness: 5,
    professionalEthics: 5,
    classroomDiscipline: 5,
    inspiration: 5,
    parentEngagement: 5,
  });
  const [strengths, setStrengths] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/evaluation");
      const data = await res.json();
      if (data.success) {
        setSummaries(data.summaries);
        setFeedbacks(data.recentFeedbacks);
        setStats(data.stats);
        if (data.summaries.length > 0) {
          setSelectedReportTeacher(data.summaries[0]);
        }
      }
    } catch (err) {
      console.error("Evaluation fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScoreChange = (field: keyof typeof scores, val: number) => {
    setScores((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const targetTeacher = summaries.find((s) => s.teacherId === surveyTeacherId);

      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: surveyTeacherId,
          teacherName: targetTeacher?.teacherName || "استاد احسان محمدی",
          subjectName: targetTeacher?.subjectName || "حسابان ۲",
          evaluatorRole: currentRole === "PARENT" ? "PARENT" : "STUDENT",
          ...scores,
          strengthsText: strengths,
          improvementSuggestions: suggestions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessToast(data.message || "ارزشیابی با موفقیت ثبت شد.");
        setStrengths("");
        setSuggestions("");
        fetchData();
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTeacher = summaries.find((s) => s.teacherId === selectedTeacherId) || summaries[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* هدر صفحه */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 shadow-lg sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-slate-300 hover:text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white">
                  سامانه ارزشیابی ۳۶۰ درجه عملکرد دبیران
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  ارزیابی کیفیت آموزشی
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                پایش رضایت اولیا و دانش‌آموزان، تحلیل راداری ۶ شاخص و صدور کارنامه رسمی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/evaluation/export"
              download
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل</span>
            </a>

            <button
              onClick={() => {
                setSelectedReportTeacher(selectedTeacher);
                setIsPrintModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>کارنامه رسمی چاپی (A4)</span>
            </button>
          </div>
        </div>
      </header>

      {/* پیام بازخورد موقت */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm">{successToast}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* نوار کارت‌های شاخص‌های کلان مدرسه */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">میانگین رضایت مدرسه</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">
                {stats?.schoolAverageScore || 91.4}٪
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">کل فرم‌های تکمیل‌شده</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {stats?.totalEvaluations || 173} <span className="text-xs font-normal text-slate-400">فرم</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">دبیر رتبه اول مدرسه</p>
              <h3 className="text-base font-black text-emerald-700 mt-1 truncate max-w-[140px]">
                {stats?.topTeacherName || "استاد احسان محمدی"}
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold">امتیاز: {stats?.topTeacherScore || 94.6}٪</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">شاخص برتر کل دبیران</p>
              <h3 className="text-base font-black text-amber-600 mt-1">
                اخلاق حرفه‌ای
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">۴.۸۵ از ۵</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
        </div>

        {/* بخش اصلی: جدول رتبه‌بندی و تحلیل راداری */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ستون راست: جدول رتبه‌بندی دبیران */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">ماتریس ارزشیابی دبیران دبیرستان علامه حلی ۱</h2>
                <p className="text-xs text-slate-400 mt-0.5">رتبه‌بندی بر مبنای برآیند ۶ شاخص استانداردهای سمپاد</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-3">رتبه</th>
                    <th className="py-3 px-3">دبیر / درس</th>
                    <th className="py-3 px-3">رضایت کل</th>
                    <th className="py-3 px-3">دانش‌آموزان</th>
                    <th className="py-3 px-3">اولیا</th>
                    <th className="py-3 px-3">تعداد فرم</th>
                    <th className="py-3 px-3">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map((s, index) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedTeacherId(s.teacherId)}
                      className={`cursor-pointer transition ${
                        selectedTeacherId === s.teacherId ? "bg-indigo-50/70 font-bold" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                            index === 0
                              ? "bg-amber-100 text-amber-800 font-black border border-amber-300"
                              : "text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-bold">{s.teacherName}</div>
                        <div className="text-[10px] text-slate-400">{s.subjectName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-black text-indigo-700 font-mono text-sm">{s.overallScore}٪</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-mono">{s.studentSatisfaction}٪</td>
                      <td className="py-3 px-3 text-blue-600 font-mono">{s.parentSatisfaction}٪</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{s.totalEvaluations}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportTeacher(s);
                            setIsPrintModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition"
                        >
                          کارنامه A4
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* تحلیل کیفی هوش مصنوعی دبیر منتخب */}
            {selectedTeacher && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>تحلیل کیفی هوش مصنوعی برای {selectedTeacher.teacherName}:</span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓ نقاط قوت:</span>
                    <span>{selectedTeacher.aiSummaryStrengths}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">⚠️ محورهای بهبود:</span>
                    <span>{selectedTeacher.aiSummaryImprovements}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ستون چپ: نمودار راداری شش‌ضلعی و تفکیک ۶ شاخص */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                نمودار راداری ۶ شاخص عملکرد ({selectedTeacher?.teacherName})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">مقیاس استاندارد ۱ تا ۵ ستاره</p>
            </div>

            {/* نمودار راداری گرافیکی SVG تمیز */}
            <div className="flex justify-center py-2">
              <svg viewBox="0 0 240 240" className="w-56 h-56">
                {/* شبکه‌های چندضلعی پس‌زمینه */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, i) => {
                  const points = [
                    [120, 120 - 90 * level],
                    [120 + 78 * level, 120 - 45 * level],
                    [120 + 78 * level, 120 + 45 * level],
                    [120, 120 + 90 * level],
                    [120 - 78 * level, 120 + 45 * level],
                    [120 - 78 * level, 120 - 45 * level],
                  ]
                    .map((p) => p.join(","))
                    .join(" ");
                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* چندضلعی امتیازات دبیر */}
                {selectedTeacher && (
                  <polygon
                    points={[
                      [120, 120 - 90 * (selectedTeacher.radarMastery / 5)],
                      [120 + 78 * (selectedTeacher.radarFairness / 5), 120 - 45 * (selectedTeacher.radarFairness / 5)],
                      [120 + 78 * (selectedTeacher.radarEthics / 5), 120 + 45 * (selectedTeacher.radarEthics / 5)],
                      [120, 120 + 90 * (selectedTeacher.radarDiscipline / 5)],
                      [120 - 78 * (selectedTeacher.radarInspiration / 5), 120 + 45 * (selectedTeacher.radarInspiration / 5)],
                      [120 - 78 * (selectedTeacher.radarEngagement / 5), 120 - 45 * (selectedTeacher.radarEngagement / 5)],
                    ]
                      .map((p) => p.join(","))
                      .join(" ")}
                    fill="rgba(79, 70, 229, 0.25)"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                  />
                )}

                {/* برچسب‌های ۶ شاخص */}
                <text x="120" y="20" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="bold">
                  تسلط علمی
                </text>
                <text x="210" y="70" textAnchor="start" fontSize="9" fill="#1e293b" fontWeight="bold">
                  عدالت نمره‌دهی
                </text>
                <text x="205" y="175" textAnchor="start" fontSize="9" fill="#1e293b" fontWeight="bold">
                  اخلاق حرفه‌ای
                </text>
                <text x="120" y="225" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="bold">
                  نظم کلاسی
                </text>
                <text x="35" y="175" textAnchor="end" fontSize="9" fill="#1e293b" fontWeight="bold">
                  انگیزش‌بخشی
                </text>
                <text x="30" y="70" textAnchor="end" fontSize="9" fill="#1e293b" fontWeight="bold">
                  ارتباط با اولیا
                </text>
              </svg>
            </div>

            {/* ریز نمرات ستاره‌ای */}
            {selectedTeacher && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">تسلط علمی و انتقال:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarMastery} / ۵</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">عدالت در نمره‌دهی:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarFairness} / ۵</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">اخلاق حرفه‌ای:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarEthics} / ۵</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">نظم و بودجه‌بندی:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarDiscipline} / ۵</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">انگیزش و تفکر نقاد:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarInspiration} / ۵</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-600">ارتباط مستمر با اولیا:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selectedTeacher.radarEngagement} / ۵</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* فرم تکمیل نظرسنجی محرمانه برای دانش‌آموزان و اولیا */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">فرم ثبت ارزشیابی محرمانه دبیران</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ۱۰۰٪ ناشناس و محرمانه
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                نظرات شما مستقیماً توسط مدیر دبیرستان بررسی شده و هویت شما هرگز برای دبیر مشخص نخواهد شد.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">دبیر مورد ارزیابی:</span>
              <select
                value={surveyTeacherId}
                onChange={(e) => setSurveyTeacherId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:outline-none focus:border-indigo-500"
              >
                {summaries.map((s) => (
                  <option key={s.teacherId} value={s.teacherId}>
                    {s.teacherName} ({s.subjectName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmitSurvey} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { key: "academicMastery", label: "۱. تسلط علمی و انتقال مفاهیم درسی" },
                { key: "gradingFairness", label: "۲. عدالت در نمره‌دهی و تصحیح تکالیف" },
                { key: "professionalEthics", label: "۳. اخلاق حرفه‌ای و فن بیان محترمانه" },
                { key: "classroomDiscipline", label: "۴. نظم کلاسی و پیشروی طبق بودجه‌بندی" },
                { key: "inspiration", label: "۵. انگیزش‌بخشی و تشویق به حل تست دشوار" },
                { key: "parentEngagement", label: "۶. پاسخگویی و تعامل شفاف با اولیا" },
              ].map((crit) => (
                <div key={crit.key} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">{crit.label}</span>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleScoreChange(crit.key as any, star)}
                        className="transition transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            scores[crit.key as keyof typeof scores] >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-indigo-700 mr-2">
                      {scores[crit.key as keyof typeof scores]} از ۵
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* متون تشریحی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نقاط قوت شاخص تدریس دبیر (اختیاری):
                </label>
                <textarea
                  rows={3}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="مثلاً: شیوه تدریس مثال‌های شهودی، صبوری در رفع اشکال..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انتقادات سازنده و پیشنهادات جهت بهبود کلاس (اختیاری):
                </label>
                <textarea
                  rows={3}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="مثلاً: اختصاص وقت بیشتر برای حل تست‌های کنکور در پایان زنگ..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-60 flex items-center gap-2"
            >
              <span>ثبت نهایی ارزشیابی محرمانه</span>
            </button>
          </form>
        </div>
      </main>

      {/* مودال کارنامه رسمی ارزشیابی دبیر (A4 Print-Ready) */}
      {isPrintModalOpen && selectedReportTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative space-y-6 my-8 print:p-0 print:shadow-none print:m-0 print:border-none print:w-full">
            {/* دکمه‌های کنترلی بالای مودال */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-sm text-slate-800">پیش‌نمایش کارنامه رسمی ارزشیابی سالانه</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ رسمی (A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* بدنه کارنامه رسمی A4 (منطبق بر آموزش و پرورش و سمپاد) */}
            <div className="border-4 border-slate-900 p-6 rounded-2xl space-y-6 text-slate-950">
              {/* سربرگ رسمی */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1 relative">
                <div className="text-xs font-bold text-slate-700">جمهوری اسلامی ایران — وزارت آموزش و پرورش</div>
                <div className="text-xs text-slate-600">سازمان ملی پرورش استعدادهای درخشان (سمپاد)</div>
                <h2 className="text-lg font-black text-slate-950 pt-1">
                  کارنامه جامع ارزشیابی سالانه عملکرد آموزشی دبیر
                </h2>
                <div className="text-xs text-slate-600 font-mono">سال تحصیلی ۱۴۰۳ - ۱۴۰۴ • نوبت دوم</div>

                <div className="absolute top-0 left-0 text-left text-[10px] font-mono space-y-0.5">
                  <div>شماره نامه: ح/۱۴۰۳/۸۸۲</div>
                  <div>تاریخ صدور: ۱۴۰۳/۰۸/۰۲</div>
                  <div className="text-emerald-700 font-bold">اصالت: تایید شده ✓</div>
                </div>
              </div>

              {/* مشخصات دبیر */}
              <div className="grid grid-cols-3 gap-4 text-xs border border-slate-300 p-3 rounded-xl bg-slate-50 font-sans">
                <div>
                  <span className="text-slate-500 block text-[10px]">نام و نام خانوادگی:</span>
                  <span className="font-bold text-sm">{selectedReportTeacher.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">کد پرسنلی / شناسه:</span>
                  <span className="font-mono font-bold">98214470</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">عنوان درس و مقطع:</span>
                  <span className="font-bold">{selectedReportTeacher.subjectName} — پایه دوازدهم</span>
                </div>
              </div>

              {/* جدول ریز نمرات ۶ شاخص استاندارد */}
              <table className="w-full text-right text-xs border border-slate-400 border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                    <th className="p-2 border border-slate-400">ردیف</th>
                    <th className="p-2 border border-slate-400">شاخص استاندارد ارزشیابی</th>
                    <th className="p-2 border border-slate-400 text-center">حداکثر امتیاز</th>
                    <th className="p-2 border border-slate-400 text-center">نمره کسب‌شده (از ۵)</th>
                    <th className="p-2 border border-slate-400 text-center">درصد تحقق</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { title: "تسلط علمی و انتقال مفاهیم درسی", score: selectedReportTeacher.radarMastery },
                    { title: "عدالت در نمره‌دهی و بازخورد تکالیف", score: selectedReportTeacher.radarFairness },
                    { title: "اخلاق حرفه‌ای و تعامل با دانش‌آموزان", score: selectedReportTeacher.radarEthics },
                    { title: "نظم کلاسی و پیشروی طبق بودجه‌بندی", score: selectedReportTeacher.radarDiscipline },
                    { title: "انگیزش‌بخشی و تفکر نقاد", score: selectedReportTeacher.radarInspiration },
                    { title: "ارتباط مستمر و شفاف با اولیا", score: selectedReportTeacher.radarEngagement },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-medium">{row.title}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">۵.۰۰</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{row.score}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-indigo-900">
                        {((row.score / 5) * 100).toFixed(0)}٪
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50/60 font-black text-sm">
                    <td colSpan={3} className="p-2.5 border border-slate-400">
                      امتیاز نهایی و تراز ارزشیابی ۳۶۰ درجه:
                    </td>
                    <td colSpan={2} className="p-2.5 border border-slate-400 text-center font-mono text-indigo-900">
                      {selectedReportTeacher.overallScore} از ۱۰۰ (عالی — رتبه یک دبیرستان)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* نظر نهایی شورا و امضاها */}
              <div className="space-y-4 pt-2">
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold block text-slate-800 mb-1">جمع‌بندی شورای آموزشی دبیرستان:</span>
                  <p className="text-slate-600 leading-relaxed">
                    عملکرد آموزشی، اخلاقی و پژوهشی همکار ارجمند جناب {selectedReportTeacher.teacherName} در بالاترین سطح استاندارد مراکز استعدادهای درخشان ارزیابی گردید و نامبرده شایسته تشویق کتبی در پرونده پرسنلی می‌باشند.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs font-bold border-t border-slate-300">
                  <div>
                    <span>دبیر مربوطه</span>
                    <div className="text-[10px] text-slate-400 mt-6">(امضا و رویت)</div>
                  </div>
                  <div>
                    <span>مسئول ارزشیابی عملکرد منطقه</span>
                    <div className="text-[10px] text-slate-400 mt-6">(مهر و امضا)</div>
                  </div>
                  <div>
                    <span>مدیر دبیرستان علامه حلی ۱</span>
                    <div className="text-[10px] text-slate-800 font-bold mt-2">دکتر مسعود حسینی</div>
                    <div className="text-[9px] text-emerald-800 mt-1 font-mono">ممهور به مهر دیجیتال آموزشگاه</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
