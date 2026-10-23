"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileText,
  Zap,
  Target,
  RefreshCw,
  Box,
  AlertOctagon,
  Lock,
  BarChart3,
} from "lucide-react";
import { InteractivePracticeLoop } from "@/components/student/InteractivePracticeLoop";
import { StudentAssignmentView, AssignmentDetail, QuestionDetail } from "@/components/student/StudentAssignmentView";
import { MistakesNotebookTab } from "@/components/student/MistakesNotebookTab";
import { LeitnerBoxTab } from "@/components/student/LeitnerBoxTab";
import { StudyPlannerTab } from "@/components/student/StudyPlannerTab";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";
import { LiveClassAlertBanner } from "@/components/live/LiveClassAlertBanner";

interface StudentDashboardData {
  student: {
    id: string;
    profileId: string;
    fullName: string;
    nationalId: string;
    phoneNumber: string;
    avatarUrl: string;
    gradeLevel: number;
    major: string;
    schoolName: string;
    totalXP: number;
    currentStreakDays: number;
    learningStyle?: string;
    academicStrengths?: string;
    academicWeaknesses?: string;
  };
  classroom: {
    id: string;
    name: string;
    gradeLevel: number;
    major: string;
    schoolName?: string;
  } | null;
  assignments: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    maxScore: number;
    questionCount: number;
    topicTitle: string;
    textbookTitle: string;
    teacherName: string;
    submission: {
      id: string;
      status: string;
      score: number | null;
      submittedAt: string;
    } | null;
  }>;
  stats: {
    totalAssignments: number;
    completedCount: number;
    pendingCount: number;
    totalXP: number;
    streakDays: number;
  };
  masteryRecords: Array<{
    id: string;
    topicId: string;
    topicTitle: string;
    percentage: number;
  }>;
}

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState<
    "assignments" | "practice" | "mistakes" | "leitner" | "planner"
  >("assignments");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDashboardData | null>(null);

  // وضعیت حل تکلیف فعال در همین صفحه (یا هدایت به صفحه اختصاصی)
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState<{
    assignment: AssignmentDetail;
    questions: QuestionDetail[];
    submission: any;
  } | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // فیلتر وضعیت تکالیف
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pending" | "completed">("all");

  // وضعیت کارنامه رسمی آموزش و پرورش (سیدا - روز ۸)
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [studyPackAssignments, setStudyPackAssignments] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      const d = await res.json();
      setData(d);

      if (d.student?.id) {
        const examRes = await fetch(`/api/exams?studentId=${d.student.id}`);
        const examData = await examRes.json();
        setExams(examData.exams || []);

        // دریافت تکالیف استودیوی مطالعه (MagicSchool)
        const spaRes = await fetch(`/api/study-studio/assignments?studentId=${d.student.id}`);
        const spaData = await spaRes.json();
        if (spaData.success && spaData.assignments) {
          setStudyPackAssignments(spaData.assignments);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load student dashboard:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // بارگذاری تکلیف جهت حل یا مشاهده پاسخنامه
  const handleOpenAssignment = async (assignmentId: string) => {
    setLoadingAssignment(true);
    setActiveAssignmentId(assignmentId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}?studentId=${data?.student.id || ""}`);
      const assignmentData = await res.json();
      setActiveAssignmentDetails(assignmentData);
    } catch (err) {
      console.error("Failed to load assignment:", err);
      alert("خطا در بارگذاری جزئیات تکلیف");
    } finally {
      setLoadingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال بارگذاری میز کار دانش‌آموز...</p>
      </div>
    );
  }

  const student = data?.student;
  const classroom = data?.classroom;
  const assignments = data?.assignments || [];

  const filteredAssignments = assignments.filter((a) => {
    if (assignmentFilter === "pending") return a.submission === null;
    if (assignmentFilter === "completed") return a.submission !== null;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* نمای اختصاصی حل تکلیف (در صورتی که تکلیفی انتخاب شده باشد) */}
      {activeAssignmentId && activeAssignmentDetails ? (
        <div className="space-y-4">
          <StudentAssignmentView
            assignment={activeAssignmentDetails.assignment}
            questions={activeAssignmentDetails.questions}
            studentId={student?.id || ""}
            studentName={student?.fullName || "علی رضایی"}
            initialSubmission={activeAssignmentDetails.submission}
            onBack={() => {
              setActiveAssignmentId(null);
              setActiveAssignmentDetails(null);
              fetchDashboard();
            }}
            onSubmittedSuccess={() => {
              fetchDashboard();
            }}
          />
        </div>
      ) : (
        <>
          {/* بنر اعلان کلاس آنلاین فعال */}
          <LiveClassAlertBanner studentId={data?.student?.id} classroomId={classroom?.id} />

          {/* هدر بالایی دانش‌آموز + آمار گیمیفیکیشن */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={student?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"}
                  alt={student?.fullName}
                  className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 object-cover shadow-xs"
                />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">{student?.fullName}</h1>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {classroom?.name || "دوازدهم ریاضی ۱"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {classroom?.schoolName || "دبیرستان استعدادهای درخشان علامه حلی ۱"} • کدملی:{" "}
                  {student?.nationalId}
                </p>
              </div>
            </div>

            {/* کارت‌های آماری گیمیفیکیشن و پیشرفت دانش‌آموز */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex-1 sm:flex-initial bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[11px] text-amber-800 font-bold flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  مجموع امتیاز
                </div>
                <div className="text-base font-black text-amber-950 mt-0.5">
                  {student?.totalXP || 0} XP
                </div>
              </div>

              <div className="flex-1 sm:flex-initial bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[11px] text-orange-800 font-bold flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                  زنجیره مطالعه
                </div>
                <div className="text-base font-black text-orange-950 mt-0.5">
                  {student?.currentStreakDays || 0} روز پیاپی
                </div>
              </div>

              <div className="flex-1 sm:flex-initial bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[11px] text-indigo-800 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  تکالیف تحویل‌شده
                </div>
                <div className="text-base font-black text-indigo-950 mt-0.5">
                  {data?.stats.completedCount} از {data?.stats.totalAssignments}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReportCardOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-3 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Award className="w-4 h-4 text-amber-300" />
                کارنامه رسمی آموزش و پرورش (سیدا)
              </button>
            </div>
          </div>

          {/* تب‌های اصلی دانش‌آموز: کارتابل تکالیف، تمرین، دفترچه اشتباهات و لایتنر (روزهای ۵ و ۶) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
                activeTab === "assignments"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              کارتابل تکالیف مدرسه
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === "assignments"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {assignments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("practice")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
                activeTab === "practice"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Target className="w-4 h-4" />
              تمرین هوشمند تعاملی (تمرین تا ۲۰ ⚡)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mistakes")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
                activeTab === "mistakes"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              دفترچه اشتباهات هوشمند (روز ۶)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("leitner")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
                activeTab === "leitner"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Box className="w-4 h-4" />
              جعبه ۵ خانه لایتنر (روز ۶)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("planner")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
                activeTab === "planner"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              برنامه مطالعاتی و لاگ روزانه (روز ۹ 📅)
            </button>

            <Link
              href="/study-studio"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white shadow-md shadow-orange-500/20 transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              استودیوی مطالعه هوشمند (Gizmo ⚡)
            </Link>

            <Link
              href="/live-classroom/archive"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-md transition transform hover:-translate-y-0.5 border border-slate-700"
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              آرشیو کلاس‌های آنلاین و جزوات AI 📄
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4 text-amber-300" />
              کارنامه آماری، تراز و صدک (SPSS 📊)
            </Link>
          </div>

          {/* ===================================================================== */}
          {/* محتوای تب ۱: کارتابل تکالیف و آزمون‌های آنلاین ضدتقلب (روزهای ۵ و ۷) */}
          {/* ===================================================================== */}
          {activeTab === "assignments" && (
            <div className="space-y-6">
              {/* بخش تکالیف استودیوی مطالعه هوش مصنوعی (MagicSchool Assignments ⚡) */}
              {studyPackAssignments.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 md:p-7 rounded-3xl text-white border border-indigo-700/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                      <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        تکالیف استودیوی مطالعه و آزمون هوشمند (Gizmo ⚡)
                      </span>
                    </div>
                    <span className="text-xs text-purple-200 font-mono">
                      {studyPackAssignments.filter((a) => a.isCompleted).length} از {studyPackAssignments.length} تکمیل شده
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studyPackAssignments.map((spa) => (
                      <div
                        key={spa.id}
                        className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex flex-col justify-between gap-4 hover:border-purple-400/50 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-purple-300 font-bold bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                              هدف تسلط: حداقل {spa.minMasteryScore}٪
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                spa.isCompleted
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                              }`}
                            >
                              {spa.isCompleted ? "✅ تکمیل شده" : "⏳ نیازمند انجام"}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-white">{spa.studyPack?.title}</h4>
                          <p className="text-[11px] text-slate-300">
                            مبحث: {spa.studyPack?.topicTag} • دبیر: {spa.teacher?.fullName || "دبیر ریاضی"} • مهلت: {new Date(spa.dueDate).toLocaleDateString("fa-IR")}
                          </p>
                          {spa.instructions && (
                            <p className="text-[11px] text-slate-400 bg-black/20 p-2 rounded-lg italic">
                              دستورالعمل: {spa.instructions}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <span className="text-[11px] font-mono text-purple-200">
                            بهترین نمره شما: {spa.bestPercentage}٪
                          </span>
                          <Link
                            href={`/study-studio/${spa.studyPackId}`}
                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition ${
                              spa.isCompleted
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/30"
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>
                              {spa.isCompleted ? "مرور مجدد در استودیو" : "ورود به استودیو و شروع تکلیف 🚀"}
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* بخش آزمون‌های آنلاین ضدتقلب (روز ۷ 🔒) */}
              {exams.length > 0 && (
                <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 md:p-7 rounded-3xl text-white border border-rose-800/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        سامانه آزمون آنلاین ضدتقلب (Zero-Cheat Exam - روز ۷)
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{exams.length} آزمون کلاسی فعال</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exams.map((ex) => {
                      const attempt = ex.attempts?.[0];
                      const isAttempted = !!attempt?.submittedAt;

                      return (
                        <div
                          key={ex.id}
                          className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-rose-400/50 transition"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-rose-300 font-bold bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/40">
                                مدت زمان: {ex.durationMinutes} دقیقه
                              </span>
                              {isAttempted ? (
                                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  تراز: {attempt.taraz || 6500} (درصد: {attempt.percentage}٪)
                                </span>
                              ) : (
                                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  آماده ورود به آزمون
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-white">{ex.title}</h4>
                            <p className="text-[11px] text-slate-300">
                              مبحث: {ex.topic?.title || "حسابان و ریاضی ۳"} • دبیر: {ex.teacher?.fullName}
                            </p>
                          </div>

                          <Link
                            href={`/student/exams/${ex.id}`}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition ${
                              isAttempted
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/30"
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isAttempted ? "مشاهده کارنامه و تراز آزمون" : "ورود به اتاق آزمون تمام‌صفحه 🔒"}
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* فیلتر وضعیت تکالیف */}
              <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">فیلتر تکالیف:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        assignmentFilter === "all"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      همه ({assignments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("pending")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        assignmentFilter === "pending"
                          ? "bg-white text-rose-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      نیازمند انجام ({data?.stats.pendingCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("completed")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        assignmentFilter === "completed"
                          ? "bg-white text-emerald-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      تحویل‌شده ({data?.stats.completedCount || 0})
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {filteredAssignments.length} تکلیف یافت شد
                </div>
              </div>

              {/* کارت‌های تکالیف */}
              {filteredAssignments.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">تکلیفی در این وضعیت موجود نیست!</h4>
                  <p className="text-xs text-slate-500">تمامی تکالیف مورد نظر با موفقیت انجام شده‌اند.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAssignments.map((item) => {
                    const isSubmitted = item.submission !== null;
                    const isGraded = item.submission?.status === "GRADED";

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* نوار بالای کارت تکلیف */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                              {item.textbookTitle}
                            </span>

                            {/* برچسب وضعیت */}
                            {isGraded ? (
                              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                تصحیح‌شده: {item.submission?.score} از {item.maxScore}
                              </span>
                            ) : isSubmitted ? (
                              <span className="text-[11px] bg-blue-50 text-blue-700 font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                                تحویل داده شده (در انتظار بازبینی)
                              </span>
                            ) : (
                              <span className="text-[11px] bg-rose-50 text-rose-700 font-black px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                انجام‌نشده
                              </span>
                            )}
                          </div>

                          {/* عنوان تکلیف */}
                          <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            مبحث: {item.topicTitle} • دبیر: {item.teacherName}
                          </p>
                        </div>

                        {/* اطلاعات پایینی کارت + دکمه اقدام */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              مهلت: {new Date(item.dueDate).toLocaleDateString("fa-IR")}
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold">
                              {item.questionCount} سوال • بارم: {item.maxScore} نمره
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={loadingAssignment && activeAssignmentId === item.id}
                            onClick={() => handleOpenAssignment(item.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
                              isGraded
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                : isSubmitted
                                ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                            }`}
                          >
                            <span>
                              {isGraded
                                ? "مشاهده کارنامه و کلید"
                                : isSubmitted
                                ? "مشاهده پاسخ‌های ارسالی"
                                : "شروع حل آنلاین / چاپی"}
                            </span>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* محتوای تب ۲: تمرین هوشمند تعاملی (تمرین تا ۲۰) */}
          {/* ===================================================================== */}
          {activeTab === "practice" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 font-black px-2.5 py-0.5 rounded-full">
                      موتور تمرین تطبیقی Endoora
                    </span>
                    <span className="text-xs bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-amber-950" />
                      +۵ XP برای هر پاسخ درست
                    </span>
                  </div>
                  <h2 className="text-lg font-black mt-2">سامانه تمرین تا ۲۰ (تثبیت و تسلط مفهومی)</h2>
                  <p className="text-xs text-white/80 mt-1 max-w-xl">
                    با پاسخ به هر سوال، نتیجه را بلافاصله مشاهده کنید. در صورت نیاز به راهنمایی، تشریح کامل
                    فرمول‌های KaTeX در اختیارتان قرار می‌گیرد.
                  </p>
                </div>
              </div>

              {/* موتور تعاملی تمرین */}
              <InteractivePracticeLoop
                initialTopicId="ALL"
                studentId={student?.id || ""}
                onFinishRound={(score, total, earnedXP) => {
                  fetchDashboard();
                }}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* محتوای تب ۳: دفترچه اشتباهات هوشمند (Smart Mistakes Notebook - روز ۶) */}
          {/* ===================================================================== */}
          {activeTab === "mistakes" && (
            <MistakesNotebookTab
              studentId={student?.id || ""}
              onRefreshStats={() => fetchDashboard()}
            />
          )}

          {/* ===================================================================== */}
          {/* محتوای تب ۴: سیستم مرور فاصله‌دار لایتنر (Leitner Box - روز ۶) */}
          {/* ===================================================================== */}
          {activeTab === "leitner" && (
            <LeitnerBoxTab
              studentId={student?.id || ""}
              onRefreshStats={() => fetchDashboard()}
            />
          )}

          {/* ===================================================================== */}
          {/* محتوای تب ۵: برنامه مطالعاتی و ثبت لاگ روزانه (روز ۹ 📅) */}
          {/* ===================================================================== */}
          {activeTab === "planner" && (
            <StudyPlannerTab
              studentId={student?.id || ""}
              onRefreshStats={() => fetchDashboard()}
            />
          )}

          {/* مودال کارنامه رسمی آموزش و پرورش (سیدا - روز ۸) */}
          <OfficialReportCardModal
            isOpen={isReportCardOpen}
            onClose={() => setIsReportCardOpen(false)}
            studentId={student?.id}
          />
        </>
      )}
    </div>
  );
}
