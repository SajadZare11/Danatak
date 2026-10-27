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
  Calendar,
  Layers,
  FileText,
  Zap,
  Target,
  Box,
  AlertOctagon,
  Lock,
  BarChart3,
  Video,
  ChevronLeft,
} from "lucide-react";
import { InteractivePracticeLoop } from "@/components/student/InteractivePracticeLoop";
import { StudentAssignmentView, AssignmentDetail, QuestionDetail } from "@/components/student/StudentAssignmentView";
import { MistakesNotebookTab } from "@/components/student/MistakesNotebookTab";
import { LeitnerBoxTab } from "@/components/student/LeitnerBoxTab";
import { StudyPlannerTab } from "@/components/student/StudyPlannerTab";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";
import { LiveClassAlertBanner } from "@/components/live/LiveClassAlertBanner";
import { CollapsibleDashboardCard } from "@/components/common/CollapsibleDashboardCard";

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDashboardData | null>(null);

  // وضعیت باز/بسته بودن ۴ کارت کشویی (تماماً بسته در بدو ورود طبق انتخاب کاربر)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    homework: false,
    exams: false,
    practice: false,
    reports: false,
  });

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // تب فعال درون کارت تمرین و تثبیت
  const [practiceSubTab, setPracticeSubTab] = useState<"loop" | "mistakes" | "leitner">("loop");

  // وضعیت حل تکلیف فعال
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState<{
    assignment: AssignmentDetail;
    questions: QuestionDetail[];
    submission: any;
  } | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // فیلتر وضعیت تکالیف
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pending" | "completed">("all");

  // وضعیت کارنامه رسمی
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
      {/* نمای اختصاصی حل تکلیف (در صورت انتخاب یک تکلیف) */}
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

          {/* هدر بالای دانش‌آموز: فوق‌العاده تمیز، آرام و خلاصه وضعیت */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={student?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"}
                  alt={student?.fullName}
                  className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 object-cover shadow-2xs"
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
                  {classroom?.schoolName || "دبیرستان علامه حلی ۱"} • کدملی: {student?.nationalId}
                </p>
              </div>
            </div>

            {/* کارت‌های شاخص‌های کلیدی یادگیری دانش‌آموز */}
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
                  زنجیره پیوستگی
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
                className="flex-1 sm:flex-initial px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>کارنامه رسمی</span>
              </button>
            </div>
          </div>

          {/* راهنمای کوتاه شروع */}
          <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium">
              💡 برای مشاهده یا انجام هر بخش، کافیست روی کارت مربوط به آن کلیک کنید تا باز شود:
            </span>
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-block">
              ۴ بخش اصلی میز کار
            </span>
          </div>

          {/* ===================================================================== */}
          {/* ساختار ۴ کارتی کشویی داشبورد دانش‌آموز (تماماً بسته در بدو ورود) */}
          {/* ===================================================================== */}
          <div className="space-y-4">
            {/* کارت ۱: تکالیف درسی مدرسه */}
            <CollapsibleDashboardCard
              id="card-homework"
              title="۱. تکالیف درسی مدرسه"
              subtitle={`${data?.stats.pendingCount || 0} تکلیف نیازمند حل • ${data?.stats.completedCount || 0} تکلیف تحویل‌شده`}
              icon={<FileText className="w-6 h-6" />}
              colorScheme="indigo"
              badge={
                (data?.stats.pendingCount || 0) > 0 ? (
                  <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-600" />
                    {data?.stats.pendingCount} تکلیف انجام‌نشده
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    همه تکالیف انجام شده
                  </span>
                )
              }
              isOpen={openCards.homework}
              onToggle={() => toggleCard("homework")}
            >
              <div className="space-y-5">
                {/* تکالیف تعاملی استودیو هوشمند */}
                {studyPackAssignments.length > 0 && (
                  <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        تکالیف تعاملی استودیوی مطالعه
                      </span>
                      <span className="text-slate-400">
                        {studyPackAssignments.filter((a) => a.isCompleted).length} از {studyPackAssignments.length} تکمیل شده
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {studyPackAssignments.map((spa) => (
                        <div
                          key={spa.id}
                          className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{spa.studyPack?.title}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              مبحث: {spa.studyPack?.topicTag}
                            </div>
                          </div>
                          <Link
                            href={`/study-studio/${spa.studyPackId}`}
                            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition"
                          >
                            {spa.isCompleted ? "مرور" : "شروع تکلیف"}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* فیلتر تکالیف عادی */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("all")}
                      className={`px-3 py-1 rounded-md font-bold transition ${
                        assignmentFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                      }`}
                    >
                      همه ({assignments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("pending")}
                      className={`px-3 py-1 rounded-md font-bold transition ${
                        assignmentFilter === "pending" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600"
                      }`}
                    >
                      نیازمند انجام ({data?.stats.pendingCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentFilter("completed")}
                      className={`px-3 py-1 rounded-md font-bold transition ${
                        assignmentFilter === "completed" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600"
                      }`}
                    >
                      تحویل‌شده ({data?.stats.completedCount || 0})
                    </button>
                  </div>
                  <span className="text-slate-500">{filteredAssignments.length} تکلیف یافت شد</span>
                </div>

                {/* کارت‌های تکالیف */}
                {filteredAssignments.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                    تکلیفی در این وضعیت وجود ندارد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAssignments.map((item) => {
                      const isSubmitted = item.submission !== null;
                      const isGraded = item.submission?.status === "GRADED";

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 transition space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {item.textbookTitle}
                              </span>
                              {isGraded ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  نمره: {item.submission?.score} از {item.maxScore}
                                </span>
                              ) : isSubmitted ? (
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  تحویل داده شد
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  انجام‌نشده
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-500">
                              مبحث: {item.topicTitle} • دبیر: {item.teacherName}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                              مهلت: {new Date(item.dueDate).toLocaleDateString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignment(item.id)}
                              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                                isGraded
                                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                  : isSubmitted
                                  ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              }`}
                            >
                              <span>{isGraded ? "کارنامه و کلید" : isSubmitted ? "پاسخ‌ها" : "شروع حل"}</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CollapsibleDashboardCard>

            {/* کارت ۲: آزمون‌های آنلاین کلاسی */}
            <CollapsibleDashboardCard
              id="card-exams"
              title="۲. آزمون‌های آنلاین کلاسی"
              subtitle={`${exams.length} آزمون کلاسی فعال با محاسبه تراز و نمره آنی`}
              icon={<Lock className="w-6 h-6" />}
              colorScheme="rose"
              badge={
                <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  {exams.length} آزمون فعال
                </span>
              }
              isOpen={openCards.exams}
              onToggle={() => toggleCard("exams")}
            >
              {exams.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  در حال حاضر آزمون آنلاین فعالی برای کلاس شما تعریف نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.map((ex) => {
                    const attempt = ex.attempts?.[0];
                    const isAttempted = !!attempt?.submittedAt;

                    return (
                      <div
                        key={ex.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-rose-300 transition space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              مدت: {ex.durationMinutes} دقیقه
                            </span>
                            {isAttempted ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                تراز: {attempt.taraz || 6500} ({attempt.percentage}٪)
                              </span>
                            ) : (
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                آماده شرکت
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900">{ex.title}</h4>
                          <p className="text-xs text-slate-500">
                            مبحث: {ex.topic?.title || "ریاضی و حسابان"} • دبیر: {ex.teacher?.fullName}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <Link
                            href={`/student/exams/${ex.id}`}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              isAttempted
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{isAttempted ? "مشاهده کارنامه و تراز آزمون" : "ورود به اتاق آزمون"}</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleDashboardCard>

            {/* کارت ۳: تمرین تعاملی، دفترچه اشتباهات و لایتنر */}
            <CollapsibleDashboardCard
              id="card-practice"
              title="۳. تمرین، دفترچه اشتباهات و لایتنر"
              subtitle="سامانه تمرین تطبیقی مفهومی، مرور کارت‌های لایتنر ۵ خانه و ثبت نقاط ضعف"
              icon={<Target className="w-6 h-6" />}
              colorScheme="emerald"
              badge={
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {student?.totalXP || 0} XP
                </span>
              }
              isOpen={openCards.practice}
              onToggle={() => toggleCard("practice")}
            >
              <div className="space-y-4">
                {/* تب‌های داخلی کارت تمرین */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setPracticeSubTab("loop")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      practiceSubTab === "loop"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    حل تمرین مفهومی (+۵ XP)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPracticeSubTab("mistakes")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      practiceSubTab === "mistakes"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    دفترچه اشتباهات من
                  </button>

                  <button
                    type="button"
                    onClick={() => setPracticeSubTab("leitner")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      practiceSubTab === "leitner"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    جعبه ۵ خانه لایتنر
                  </button>
                </div>

                {practiceSubTab === "loop" && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="text-xs text-slate-500">
                      پاسخ به سوالات مفهومی و مشاهده آنی تشریح فرمول‌ها برای رفع اشکال:
                    </div>
                    <InteractivePracticeLoop
                      initialTopicId="ALL"
                      studentId={student?.id || ""}
                      onFinishRound={() => {
                        fetchDashboard();
                      }}
                    />
                  </div>
                )}

                {practiceSubTab === "mistakes" && (
                  <MistakesNotebookTab
                    studentId={student?.id || ""}
                    onRefreshStats={() => fetchDashboard()}
                  />
                )}

                {practiceSubTab === "leitner" && (
                  <LeitnerBoxTab
                    studentId={student?.id || ""}
                    onRefreshStats={() => fetchDashboard()}
                  />
                )}
              </div>
            </CollapsibleDashboardCard>

            {/* کارت ۴: برنامه هفتگی، کارنامه رسمی و کتابخانه */}
            <CollapsibleDashboardCard
              id="card-reports"
              title="۴. برنامه مطالعاتی، کارنامه و جزوات"
              subtitle="برنامه هفتگی، صدور کارنامه رسمی آموزش و پرورش (سیدا) و دسترسی به مخزن کتب"
              icon={<Award className="w-6 h-6" />}
              colorScheme="amber"
              badge={
                <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  خدمات تحصیلی
                </span>
              }
              isOpen={openCards.reports}
              onToggle={() => toggleCard("reports")}
            >
              <div className="space-y-5">
                {/* دسترسی‌های سریع به صفحات تکمیلی */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReportCardOpen(true)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 text-right transition space-y-1 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-2">کارنامه رسمی مدرسه</div>
                    <div className="text-[11px] text-slate-500">صدور فرمت رسمی با نمرات سیدا</div>
                  </button>

                  <Link
                    href="/library"
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 text-right transition space-y-1 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-2">کتابخانه و جزوات PDF</div>
                    <div className="text-[11px] text-slate-500">مشاهده نمونه‌سوالات و کتب رسمی</div>
                  </Link>

                  <Link
                    href="/classroom"
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 text-right transition space-y-1 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-2">کلاس آنلاین تصویری</div>
                    <div className="text-[11px] text-slate-500">ورود به وبینار و تخته اشتراکی</div>
                  </Link>
                </div>

                {/* برنامه‌ریز مطالعاتی روزانه */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>برنامه مطالعاتی و لاگ روزانه</span>
                  </h4>
                  <StudyPlannerTab
                    studentId={student?.id || ""}
                    onRefreshStats={() => fetchDashboard()}
                  />
                </div>
              </div>
            </CollapsibleDashboardCard>
          </div>

          {/* مودال کارنامه رسمی */}
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
