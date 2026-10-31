"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClassroomRosterTab } from "@/components/teacher/ClassroomRosterTab";
import { InterventionsTab } from "@/components/teacher/InterventionsTab";
import { GradingQueueTab } from "@/components/teacher/GradingQueueTab";
import { StudentProfileModal, StudentData } from "@/components/teacher/StudentProfileModal";
import { QuickCreateModal } from "@/components/teacher/QuickCreateModal";
import { BulkActionModal } from "@/components/teacher/BulkActionModal";
import { SmartAssignmentModal } from "@/components/homework/SmartAssignmentModal";
import { GradingDeskModal } from "@/components/teacher/GradingDeskModal";
import { ExamBuilderModal } from "@/components/exam/ExamBuilderModal";
import { RapidAttendanceModal } from "@/components/attendance/RapidAttendanceModal";
import { DisciplineModal } from "@/components/discipline/DisciplineModal";
import { SidaManagerModal } from "@/components/sida/SidaManagerModal";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";
import { CreateLiveSessionModal } from "@/components/live/CreateLiveSessionModal";
import { LiveClassAlertBanner } from "@/components/live/LiveClassAlertBanner";
import { CollapsibleDashboardCard } from "@/components/common/CollapsibleDashboardCard";
import { TeacherGradebookModal } from "@/components/teacher/TeacherGradebookModal";
import { CreateClassroomModal } from "@/components/teacher/CreateClassroomModal";
import {
  Users,
  AlertTriangle,
  CheckSquare,
  Zap,
  Sparkles,
  Check,
  BookOpen,
  Lock,
  Calendar,
  Award,
  FileSpreadsheet,
  BarChart3,
  Video,
  Layers,
  ArrowLeft,
  Plus,
  ClipboardList,
  Clock,
  PenTool,
  Trash2,
} from "lucide-react";

export default function TeacherPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    teacher: { id: string; fullName: string; specialty: string; schoolName: string };
    classrooms?: Array<{
      id: string;
      name: string;
      gradeLevel: number;
      major: string;
      subjects?: string;
      studentCount: number;
    }>;
    classroom: {
      id: string;
      name: string;
      gradeLevel: number;
      major: string;
      subjects?: string;
      students: StudentData[];
    } | null;
    availableStudents?: Array<{
      id: string;
      userId?: string;
      fullName: string;
      nationalId: string;
      phoneNumber?: string | null;
      gradeLevel?: number;
      major?: string;
    }>;
    textbookTopics: Array<{
      id: string;
      title: string;
      subTopics?: Array<{ id: string; title: string }>;
    }>;
    allTextbooks?: Array<{
      id: string;
      title: string;
      gradeLevel: number;
      topics: Array<{
        id: string;
        title: string;
        subTopics: Array<{ id: string; title: string }>;
      }>;
    }>;
    pendingSubmissions: Array<{
      id: string;
      assignmentId: string;
      assignment: { title: string; maxScore: number };
      student: { fullName: string; nationalId: string };
      status: string;
    }>;
  } | null>(null);

  // وضعیت باز/بسته بودن ۴ کارت کشویی (تماماً بسته در بدو ورود طبق انتخاب کاربر)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    roster: false,
    assignments: false,
    exams: false,
    tools: false,
  });

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // تب فرعی درون کارت کلاس و دانش‌آموزان
  const [rosterSubTab, setRosterSubTab] = useState<"students" | "interventions">("students");

  // وضعیت مودال‌ها
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // وضعیت مودال تکلیف هوشمند (Smart Homework)
  const [isSmartAssignmentOpen, setIsSmartAssignmentOpen] = useState(false);
  const [smartInitialTopicId, setSmartInitialTopicId] = useState("");
  const [smartInitialTopicTitle, setSmartInitialTopicTitle] = useState("");
  const [smartInitialStudentName, setSmartInitialStudentName] = useState<string | undefined>(undefined);

  // وضعیت میز تصحیح و قلم‌گذاری برگه تشریحی (Grading Desk Studio)
  const [isGradingDeskOpen, setIsGradingDeskOpen] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

  // وضعیت مودال طراحی آزمون آنلاین ضدتقلب 🔒
  const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);

  // وضعیت مودال‌های اداری (حضور و غیاب، انضباط، سیدا و کارنامه)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
  const [isSidaModalOpen, setIsSidaModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardStudentId, setReportCardStudentId] = useState<string | undefined>(undefined);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // وضعیت دفتر نمرات و تحلیل ارزشیابی‌ها
  const [isGradebookOpen, setIsGradebookOpen] = useState(false);
  const [gradebookDefaultTab, setGradebookDefaultTab] = useState<"entry" | "records">("records");

  // وضعیت مودال افزودن کلاس جدید
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");

  // پیام اعلان موفقیت (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboardData = async (targetClassroomId?: string) => {
    try {
      const activeId = targetClassroomId || selectedClassroomId;
      const url = activeId
        ? `/api/teacher/dashboard?classroomId=${activeId}`
        : "/api/teacher/dashboard";
      const res = await fetch(url);
      const data = await res.json();
      setDashboardData(data);
      if (data.classroom) {
        setSelectedClassroomId(data.classroom.id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // جابجایی کلاس فعال
  const handleClassroomChange = async (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    await fetchDashboardData(classroomId);
  };

  // حذف کلاس
  const handleDeleteClassroom = async (classroomId: string, classroomName: string) => {
    if (!confirm(`آیا از حذف کلاس «${classroomName}» اطمینان دارید؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/teacher/classrooms?classroomId=${classroomId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "کلاس با موفقیت حذف شد.");
        setSelectedClassroomId("");
        await fetchDashboardData();
      } else {
        alert(data.error || "خطا در حذف کلاس");
      }
    } catch (err: any) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    }
  };

  // ذخیره درصد یادگیری تکی
  const handleSaveMastery = async (studentProfileId: string, topicId: string, percentage: number) => {
    try {
      const res = await fetch("/api/teacher/mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId, topicId, masteryPercentage: percentage }),
      });
      if (res.ok) {
        showToast("درصد یادگیری با موفقیت در پورتفولیوی دانش‌آموز ثبت شد");
        await fetchDashboardData();
        if (selectedStudent && selectedStudent.id === studentProfileId) {
          const updatedStudent = dashboardData?.classroom?.students.find((s) => s.id === studentProfileId);
          if (updatedStudent) setSelectedStudent(updatedStudent);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // اعمال درصد یادگیری گروهی برای کل کلاس
  const handleApplyBulk = async (topicId: string, percentage: number) => {
    if (!dashboardData?.classroom) return;
    const studentIds = dashboardData.classroom.students.map((s) => s.id);

    const res = await fetch("/api/teacher/mastery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulkStudentIds: studentIds,
        topicId,
        masteryPercentage: percentage,
      }),
    });

    if (res.ok) {
      showToast(`درصد یادگیری ${percentage}٪ برای تمامی ${studentIds.length} دانش‌آموز کلاس ثبت شد.`);
      await fetchDashboardData();
    }
  };

  // ذخیره یادداشت محرمانه
  const handleSaveNotes = async (studentProfileId: string, notes: string) => {
    const res = await fetch("/api/teacher/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentProfileId, privateNotes: notes }),
    });
    if (res.ok) {
      showToast("یادداشت محرمانه با موفقیت ذخیره شد");
      await fetchDashboardData();
    }
  };

  // کلیک روی دکمه ارسال تکلیف جبرانی یا هوشمند
  const handleTriggerRemedialHomework = (topicId: string, topicTitle: string, studentName?: string) => {
    setSmartInitialTopicId(topicId);
    setSmartInitialTopicTitle(topicTitle);
    setSmartInitialStudentName(studentName);
    setIsSmartAssignmentOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال بارگذاری میز کار دبیر...</p>
      </div>
    );
  }

  const classroom = dashboardData?.classroom;
  const students = classroom?.students || [];
  const atRiskCount = students.filter((s) => s.avgMastery < 60).length;
  const pendingCount = dashboardData?.pendingSubmissions.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* بنر اعلان کلاس آنلاین فعال */}
      <LiveClassAlertBanner teacherId={dashboardData?.teacher.id} />

      {/* پیام اعلان شناور (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* هدر بالای پنل دبیر: فوق‌العاده آرام، باوقار و خلوت */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              میز کار دبیر: {dashboardData?.teacher.fullName}
            </h1>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full">
              {dashboardData?.teacher.specialty}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dashboardData?.teacher.schoolName} • سال تحصیلی ۱۴۰۳-۱۴۰۴
          </p>
        </div>

        {/* دکمه‌های اقدام کلیدی اولیه */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsQuickCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>ساخت سریع</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSmartInitialTopicId("");
              setSmartInitialTopicTitle("");
              setSmartInitialStudentName(undefined);
              setIsSmartAssignmentOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>تکلیف هوشمند جدید</span>
          </button>
        </div>
      </div>

      {/* راهنمای کوتاه شروع */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">
          💡 برای مدیریت کلاس، تصحیح یا صدور تکالیف، روی هر یک از ۴ کارت زیر کلیک کنید:
        </span>
        <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-block">
          ۴ بخش اصلی کارتابل دبیر
        </span>
      </div>

      {/* ===================================================================== */}
      {/* ساختار ۴ کارتی کشویی داشبورد دبیر (تماماً بسته در بدو ورود) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* کارت ۱: کلاس و دانش‌آموزان */}
        <CollapsibleDashboardCard
          id="teacher-card-roster"
          title="۱. کلاس و دانش‌آموزان"
          subtitle={`کلاس ${classroom?.name || "دوازدهم"} • ${students.length} دانش‌آموز فعال • حضور و غیاب، کارتکس انضباط و پورتفولیو`}
          icon={<Users className="w-6 h-6" />}
          colorScheme="indigo"
          badge={
            atRiskCount > 0 ? (
              <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {atRiskCount} دانش‌آموز نیازمند مداخله
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                وضعیت مطلوب
              </span>
            )
          }
          isOpen={openCards.roster}
          onToggle={() => toggleCard("roster")}
        >
          <div className="space-y-4">
            {/* نوار انتخاب کلاس‌های دبیر و دکمه افزودن کلاس جدید */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-600/80 rounded-xl text-white">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-300">کلاس فعال:</span>
                </div>

                {/* سلکتور انتخاب کلاس */}
                <div className="relative">
                  <select
                    value={classroom?.id || selectedClassroomId}
                    onChange={(e) => handleClassroomChange(e.target.value)}
                    className="bg-slate-800/90 text-white text-xs font-bold px-3 py-2 pr-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {dashboardData?.classrooms?.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name} (پایه {c.gradeLevel} • {c.studentCount} دانش‌آموز)
                      </option>
                    ))}
                  </select>
                </div>

                {classroom && (
                  <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-1 rounded-lg font-medium hidden lg:inline-block">
                    {classroom.major} • {classroom.subjects || "تدریس حسابان و ریاضی"}
                  </span>
                )}
              </div>

              {/* دکمه‌های اقدام کلاس: افزودن کلاس جدید و حذف */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {dashboardData?.classrooms && dashboardData.classrooms.length > 1 && classroom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClassroom(classroom.id, classroom.name)}
                    title="حذف این کلاس"
                    className="p-2 text-rose-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition border border-rose-500/30 text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">حذف کلاس</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-md transition border border-indigo-400/40"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>افزودن کلاس جدید</span>
                </button>
              </div>
            </div>

            {/* نوار اقدامات سریع کلاسی */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {/* تب‌های فرعی */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRosterSubTab("students")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    rosterSubTab === "students"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  لیست کلاس ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRosterSubTab("interventions")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    rosterSubTab === "interventions"
                      ? "bg-white text-rose-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  پایش افت تحصیلی ({atRiskCount})
                </button>
              </div>

              {/* ابزارهای روزمره */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>ثبت حضور و غیاب امروز</span>
                </button>

                {/* دکمه ۱: ثبت نمره */}
                <button
                  type="button"
                  onClick={() => {
                    setGradebookDefaultTab("entry");
                    setIsGradebookOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ثبت نمره</span>
                </button>

                {/* دکمه ۲: نمرات ثبت‌شده */}
                <button
                  type="button"
                  onClick={() => {
                    setGradebookDefaultTab("records");
                    setIsGradebookOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نمرات ثبت‌شده</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDisciplineModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5 text-rose-600" />
                  <span>ثبت مورد انضباطی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ثبت گروهی یادگیری</span>
                </button>
              </div>
            </div>

            {/* محتوای تب انتخابی */}
            {rosterSubTab === "students" && classroom && (
              <ClassroomRosterTab
                classroomName={classroom.name}
                gradeLevel={classroom.gradeLevel}
                major={classroom.major}
                subjects={classroom.subjects}
                students={students}
                onSelectStudent={(st) => {
                  setSelectedStudent(st);
                  setIsStudentModalOpen(true);
                }}
                onOpenBulkModal={() => setIsBulkModalOpen(true)}
              />
            )}

            {rosterSubTab === "interventions" && (
              <InterventionsTab
                students={students}
                onTriggerRemedial={handleTriggerRemedialHomework}
                onOpenStudentModal={(st) => {
                  setSelectedStudent(st);
                  setIsStudentModalOpen(true);
                }}
              />
            )}
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۲: تکالیف درسی و میز تصحیح برگه */}
        <CollapsibleDashboardCard
          id="teacher-card-assignments"
          title="۲. تکالیف درسی و میز تصحیح برگه"
          subtitle={`${pendingCount} برگه در انتظار تصحیح و قلم‌گذاری • صدور تکلیف هوشمند و تطبیقی`}
          icon={<ClipboardList className="w-6 h-6" />}
          colorScheme="emerald"
          badge={
            pendingCount > 0 ? (
              <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                {pendingCount} برگه منتظر تصحیح
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                همه برگه‌ها تصحیح شده‌اند
              </span>
            )
          }
          isOpen={openCards.assignments}
          onToggle={() => toggleCard("assignments")}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-800">صدور تکلیف برای دانش‌آموزان</h4>
                <p className="text-[11px] text-slate-500">ارسال سوالات تطبیقی بر اساس سرفصل و کتاب درسی</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSmartInitialTopicId("");
                  setSmartInitialTopicTitle("");
                  setSmartInitialStudentName(undefined);
                  setIsSmartAssignmentOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>صدور تکلیف هوشمند جدید</span>
              </button>
            </div>

            {/* صف تصحیح و قلم‌گذاری برگه */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>برگه‌های تشریحی در انتظار تصحیح و قلم دیجیتال:</span>
              </h4>
              <GradingQueueTab
                submissions={dashboardData?.pendingSubmissions || []}
                onOpenGradingDesk={(subId) => {
                  setGradingSubmissionId(subId);
                  setIsGradingDeskOpen(true);
                }}
              />
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۳: آزمون‌ساز آنلاین و بانک سوالات */}
        <CollapsibleDashboardCard
          id="teacher-card-exams"
          title="۳. آزمون‌ساز آنلاین و بانک سوالات"
          subtitle="طراحی آزمون آنلاین ضدتقلب با نمره منفی و تراز کنکوری • بانک سوالات و فرمول‌نویس KaTeX"
          icon={<Lock className="w-6 h-6" />}
          colorScheme="rose"
          badge={
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
              آزمون و سوالات
            </span>
          }
          isOpen={openCards.exams}
          onToggle={() => toggleCard("exams")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900">طراحی آزمون آنلاین ضدتقلب</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ایجاد اتاق آزمون ایمن با مانیتورینگ خروج از تب، زمان‌بندی دقیق، نمره منفی ۱/۳ و محاسبه تراز آزمون.
                </p>
              </div>
              <Link
                href={classroom ? `/teacher/exams/create?classroomId=${classroom.id}` : "/teacher/exams/create"}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>شروع طراحی آزمون جدید (استودیو اختصاصی)</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900">بانک سوالات و ویرایشگر فرمول KaTeX</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  جستجو و دسته‌بندی سوالات کنکور و نهایی بر مبنای درس، پایه و مبحث با جعبه‌ابزار فرمول‌نویسی ریاضی و فیزیک.
                </p>
              </div>
              <Link
                href="/questions"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>ورود به بانک سوالات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۴: امور اداری، سیدا و ابزارهای تدریس */}
        <CollapsibleDashboardCard
          id="teacher-card-tools"
          title="۴. امور اداری، سیدا و ابزارهای تدریس"
          subtitle="استخراج اکسل استاندارد سیدا (Sida)، وبینار تصویری زنده و استودیوی هوش مصنوعی"
          icon={<Layers className="w-6 h-6" />}
          colorScheme="purple"
          badge={
            <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
              ابزارها و گزارش‌ها
            </span>
          }
          isOpen={openCards.tools}
          onToggle={() => toggleCard("tools")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* خروجی سیدا */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h5 className="text-xs font-bold text-slate-900">خروجی اکسل سیدا</h5>
                <p className="text-[11px] text-slate-500">نمرات رسمی مطابق با قالب سیدا</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidaModalOpen(true)}
                className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition border border-emerald-200"
              >
                باز کردن
              </button>
            </div>

            {/* کلاس آنلاین */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <Video className="w-5 h-5 text-purple-600" />
                <h5 className="text-xs font-bold text-slate-900">کلاس آنلاین و وبینار</h5>
                <p className="text-[11px] text-slate-500">برگزاری جلسه با وب‌کم و تخته</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(true)}
                className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold transition border border-purple-200"
              >
                شروع جلسه
              </button>
            </div>

            {/* استودیو هوشمند */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h5 className="text-xs font-bold text-slate-900">استودیوی آموزشی AI</h5>
                <p className="text-[11px] text-slate-500">تولید نمونه‌سوال و درس‌نامه</p>
              </div>
              <Link
                href="/study-studio"
                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition border border-indigo-200 text-center"
              >
                ورود به استودیو
              </Link>
            </div>

            {/* آمار نمرات */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h5 className="text-xs font-bold text-slate-900">آمار و تحلیل نمرات</h5>
                <p className="text-[11px] text-slate-500">انحراف معیار و تراز کلاسی</p>
              </div>
              <Link
                href="/analytics"
                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition border border-blue-200 text-center"
              >
                مشاهده آمار
              </Link>
            </div>
          </div>
        </CollapsibleDashboardCard>
      </div>

      {/* مودال پروفایل جامع دانش‌آموز (۳ تب) */}
      <StudentProfileModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        student={selectedStudent}
        textbookTopics={dashboardData?.textbookTopics || []}
        onSaveMastery={handleSaveMastery}
        onSaveNotes={handleSaveNotes}
        onTriggerRemedialHomework={handleTriggerRemedialHomework}
        onOpenReportCard={(studentId) => {
          setReportCardStudentId(studentId);
          setIsReportCardOpen(true);
        }}
      />

      {/* پنجره ساخت سریع محتوا */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={(type, title) => {
          showToast(`مورد جدید («${title}») با موفقیت ثبت شد.`);
        }}
      />

      {/* پنجره عملیات گروهی / کل کلاس */}
      {classroom && (
        <BulkActionModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          classroomName={classroom.name}
          studentCount={students.length}
          topics={dashboardData?.textbookTopics || []}
          onApplyBulk={handleApplyBulk}
        />
      )}

      {/* مودال سازنده تکلیف هوشمند و شخصی‌سازی‌شده */}
      {classroom && (
        <SmartAssignmentModal
          isOpen={isSmartAssignmentOpen}
          onClose={() => setIsSmartAssignmentOpen(false)}
          classroomId={classroom.id}
          classroomName={classroom.name}
          teacherId={dashboardData?.teacher.id || ""}
          initialTopicId={smartInitialTopicId}
          initialTopicTitle={smartInitialTopicTitle}
          initialStudentName={smartInitialStudentName}
          textbooks={
            dashboardData?.allTextbooks && dashboardData.allTextbooks.length > 0
              ? dashboardData.allTextbooks
              : [
                  {
                    id: "grade12-calc",
                    title: "حسابان و ریاضی ۳ دوازدهم",
                    topics: dashboardData?.textbookTopics || [],
                  },
                ]
          }
          onSuccess={() => {
            showToast("تکلیف با موفقیت در کارتابل دانش‌آموزان ثبت و فعال شد!");
            fetchDashboardData();
          }}
        />
      )}

      {/* میز یکپارچه تصحیح و قلم‌گذاری برگه تشریحی */}
      {gradingSubmissionId && (
        <GradingDeskModal
          isOpen={isGradingDeskOpen}
          onClose={() => {
            setIsGradingDeskOpen(false);
            setGradingSubmissionId(null);
          }}
          submissionId={gradingSubmissionId}
          onGradedSuccess={() => {
            showToast("برگه با موفقیت تصحیح شد و نمرات و بازخورد به دانش‌آموز ابلاغ گردید.");
            fetchDashboardData();
          }}
        />
      )}

      {/* مودال طراحی آزمون آنلاین ضدتقلب 🔒 */}
      {classroom && (
        <ExamBuilderModal
          isOpen={isExamBuilderOpen}
          onClose={() => setIsExamBuilderOpen(false)}
          classroomId={classroom.id}
          classroomName={classroom.name}
          teacherId={dashboardData?.teacher.id || ""}
          textbooks={
            dashboardData?.allTextbooks && dashboardData.allTextbooks.length > 0
              ? dashboardData.allTextbooks
              : [
                  {
                    id: "grade12-calc",
                    title: "حسابان و ریاضی ۳ دوازدهم",
                    topics: dashboardData?.textbookTopics || [],
                  },
                ]
          }
          onSuccess={() => {
            showToast("آزمون آنلاین ضدتقلب با موفقیت ایجاد و اتاق آزمون فعال گردید!");
            fetchDashboardData();
          }}
        />
      )}

      {/* مودال‌های اداری: حضور و غیاب کلاسی، انضباط، سیدا و کارنامه */}
      {classroom && (
        <RapidAttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          classroomId={classroom.id}
          classroomName={classroom.name}
          onSavedSuccess={() => {
            showToast("دفتر حضور و غیاب امروز کلاس با موفقیت ثبت شد.");
            fetchDashboardData();
          }}
        />
      )}

      {classroom && (
        <DisciplineModal
          isOpen={isDisciplineModalOpen}
          onClose={() => setIsDisciplineModalOpen(false)}
          availableStudents={classroom.students.map((s) => ({
            id: s.userId,
            fullName: s.fullName,
            nationalId: s.nationalId,
          }))}
          onSavedSuccess={() => {
            showToast("کارت انضباطی با موفقیت ثبت گردید.");
            fetchDashboardData();
          }}
        />
      )}

      <SidaManagerModal
        isOpen={isSidaModalOpen}
        onClose={() => setIsSidaModalOpen(false)}
        initialClassroomId={classroom?.id}
      />

      <OfficialReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        studentId={reportCardStudentId}
      />

      <CreateLiveSessionModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        teacherId={dashboardData?.teacher.id}
        onCreated={() => {
          showToast("جلسه کلاس آنلاین با موفقیت ثبت شد.");
          fetchDashboardData();
        }}
      />

      <TeacherGradebookModal
        isOpen={isGradebookOpen}
        onClose={() => setIsGradebookOpen(false)}
        initialClassroomId={classroom?.id}
        defaultTab={gradebookDefaultTab}
      />

      {/* مودال ساخت و افزودن کلاس جدید */}
      <CreateClassroomModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        onSuccess={(newId, msg) => {
          showToast(msg);
          setSelectedClassroomId(newId);
          fetchDashboardData(newId);
          setOpenCards((prev) => ({ ...prev, roster: true }));
        }}
        availableStudents={dashboardData?.availableStudents || []}
        allTextbooks={dashboardData?.allTextbooks || []}
        teacherSchoolName={dashboardData?.teacher.schoolName}
      />
    </div>
  );
}
