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
import {
  Users,
  AlertTriangle,
  CheckSquare,
  Zap,
  GraduationCap,
  Sparkles,
  Check,
  Bell,
  BookOpen,
  Lock,
  Calendar,
  Award,
  FileSpreadsheet,
  BarChart3,
  Radio,
} from "lucide-react";

export default function TeacherPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "interventions" | "grading">("roster");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    teacher: { id: string; fullName: string; specialty: string; schoolName: string };
    classroom: {
      id: string;
      name: string;
      gradeLevel: number;
      major: string;
      students: StudentData[];
    } | null;
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

  // وضعیت میز تصحیح و قلم‌گذاری برگه تشریحی (Grading Desk Studio - روز ۶)
  const [isGradingDeskOpen, setIsGradingDeskOpen] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

  // وضعیت مودال طراحی آزمون آنلاین ضدتقلب (روز ۷ 🔒)
  const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);

  // وضعیت مودال‌های روز ۸ (حضور و غیاب، انضباط، سیدا و کارنامه)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
  const [isSidaModalOpen, setIsSidaModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardStudentId, setReportCardStudentId] = useState<string | undefined>(undefined);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // پیام اعلان موفقیت (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      const data = await res.json();
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        // به‌روزرسانی دانش‌آموز انتخابی در مودال
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
      showToast(`درصد پایه ${percentage}٪ برای تمامی ${studentIds.length} دانش‌آموز کلاس ثبت شد.`);
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
        <p className="text-xs text-slate-500 font-bold">در حال بارگذاری داشبورد ماژولار معلم...</p>
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

      {/* هدر بالای پنل معلم + دکمه شناور ساخت سریع (از ایندورا) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              میز کار ماژولار دبیر: {dashboardData?.teacher.fullName}
            </h1>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full">
              {dashboardData?.teacher.specialty}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dashboardData?.teacher.schoolName} • سال تحصیلی ۱۴۰۳-۱۴۰۴
          </p>
        </div>

        {/* دکمه‌های اقدام سریع معلم */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold border border-blue-200 shadow-2xs transition"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            حضور و غیاب کلاسی (روز ۸ 📋)
          </button>
          <button
            type="button"
            onClick={() => setIsDisciplineModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200 shadow-2xs transition"
          >
            <Award className="w-4 h-4 text-rose-600" />
            کارت انضباطی (روز ۸ ⚖️)
          </button>
          <button
            type="button"
            onClick={() => setIsSidaModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-300 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            خروجی اکسل سیدا (Sida)
          </button>
          <button
            type="button"
            onClick={() => setIsExamBuilderOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Lock className="w-4 h-4 fill-white/20" />
            آزمون ضدتقلب (روز ۷ 🔒)
          </button>
          <button
            type="button"
            onClick={() => setIsLiveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            کلاس آنلاین و وبینار (Live 🔴)
          </button>
          <Link
            href="/live-classroom/archive"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            آرشیو کلاس‌ها و جزوات AI 📄
          </Link>
          <Link
            href="/study-studio"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 fill-white/20" />
            استودیو هوش مصنوعی (MagicSchool ⚡)
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            داشبورد آماری و روان‌سنجی (SPSS 📊)
          </Link>
          <button
            type="button"
            onClick={() => {
              setSmartInitialTopicId("");
              setSmartInitialTopicTitle("");
              setSmartInitialStudentName(undefined);
              setIsSmartAssignmentOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 fill-white/20" />
            تکلیف هوشمند (روز ۵ ⚡)
          </button>
          <Link
            href="/questions"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold border border-indigo-200 shadow-2xs transition"
          >
            <BookOpen className="w-4 h-4" />
            بانک سوالات و فرمول‌نویس (روز ۴)
          </Link>
          <button
            type="button"
            onClick={() => setIsQuickCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4 fill-white" />
            ساخت سریع محتوا (Quick Create ⚡)
          </button>
        </div>
      </div>

      {/* نوار تب‌های ماژولار سه‌گانه داشبورد معلم (طبق انتخاب مصاحبه Grill-Me) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("roster")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === "roster"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          کلاس‌ها و دانش‌آموزان
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "roster" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interventions")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === "interventions"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          صف مداخلات آموزشی (Interventions)
          {atRiskCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "interventions"
                  ? "bg-white text-rose-700"
                  : "bg-rose-100 text-rose-700 animate-pulse"
              }`}
            >
              {atRiskCount} دانش‌آموز نیازمند اقدام
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("grading")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === "grading"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          میز یکپارچه صف تصحیح
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "grading" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {pendingCount} برگه
          </span>
        </button>
      </div>

      {/* محتوای فعال تب انتخاب‌شده */}
      {activeTab === "roster" && classroom && (
        <ClassroomRosterTab
          classroomName={classroom.name}
          gradeLevel={classroom.gradeLevel}
          major={classroom.major}
          students={students}
          onSelectStudent={(st) => {
            setSelectedStudent(st);
            setIsStudentModalOpen(true);
          }}
          onOpenBulkModal={() => setIsBulkModalOpen(true)}
        />
      )}

      {activeTab === "interventions" && (
        <InterventionsTab
          students={students}
          onTriggerRemedial={handleTriggerRemedialHomework}
          onOpenStudentModal={(st) => {
            setSelectedStudent(st);
            setIsStudentModalOpen(true);
          }}
        />
      )}

      {activeTab === "grading" && (
        <GradingQueueTab
          submissions={dashboardData?.pendingSubmissions || []}
          onOpenGradingDesk={(subId) => {
            setGradingSubmissionId(subId);
            setIsGradingDeskOpen(true);
          }}
        />
      )}

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

      {/* پنجره ساخت سریع محتوا (⚡) برگرفته از ایندورا */}
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

      {/* مودال سازنده تکلیف هوشمند و شخصی‌سازی‌شده (روز ۵) */}
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

      {/* میز یکپارچه تصحیح و قلم‌گذاری برگه تشریحی (روز ۶) */}
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

      {/* مودال طراحی آزمون آنلاین ضدتقلب (روز ۷ 🔒) */}
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

      {/* مودال‌های روز ۸: حضور و غیاب کلاسی، انضباط، سیدا و کارنامه */}
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
    </div>
  );
}
