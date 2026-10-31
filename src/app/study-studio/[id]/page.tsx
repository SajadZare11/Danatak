"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { FlashcardDeckPlayer } from "@/components/study-studio/FlashcardDeckPlayer";
import { InteractiveQuizRunner } from "@/components/study-studio/InteractiveQuizRunner";
import { MindMapViewer } from "@/components/study-studio/MindMapViewer";
import { SmartSummaryView } from "@/components/study-studio/SmartSummaryView";
import { ActiveFocusTrackerBar } from "@/components/study-studio/ActiveFocusTrackerBar";
import { AssignStudyPackModal } from "@/components/study-studio/AssignStudyPackModal";
import { WorksheetPrintModal } from "@/components/study-studio/WorksheetPrintModal";
import { useActiveFocusTracker } from "@/hooks/useActiveFocusTracker";
import {
  ArrowRight,
  Sparkles,
  Zap,
  HelpCircle,
  Share2,
  FileText,
  Clock,
  Layers,
  Award,
  BookOpen,
  Printer,
  Send,
  Target,
  CheckCircle2,
} from "lucide-react";

export default function StudyPackPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser } = useRole();

  const [pack, setPack] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz" | "mindmap" | "summary">("flashcards");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [assignmentInfo, setAssignmentInfo] = useState<any | null>(null);

  // پایش هوشمند تمرکز و ضد تقلب (Page Visibility API و عدم فعالیت ۳۰ ثانیه)
  const { status, activeSeconds, idleSeconds, focusRatio } = useActiveFocusTracker({
    studentId: currentUser.role === "STUDENT" ? currentUser.id : undefined,
    studyPackId: id,
    topicTag: pack?.topicTag || "مفاهیم تحلیلی",
    idleThresholdSeconds: 30,
    heartbeatIntervalSeconds: 15,
  });

  const checkAssignmentStatus = async () => {
    if (currentUser.role === "STUDENT" && id) {
      try {
        const res = await fetch(`/api/study-studio/assignments?studentId=${currentUser.id}&studyPackId=${id}`);
        const data = await res.json();
        if (data.success && data.assignments && data.assignments.length > 0) {
          setAssignmentInfo(data.assignments[0]);
        }
      } catch (err) {
        console.error("Failed to check assignment status:", err);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchPack = async () => {
      setIsLoading(true);
      try {
        const studentId = currentUser.role === "STUDENT" ? currentUser.id : "";
        const res = await fetch(`/api/study-studio/packs/${id}?studentId=${studentId}`);
        const data = await res.json();
        if (data.success) {
          setPack(data.data);
        }
      } catch (err) {
        console.error("Failed to load study pack:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPack();
    checkAssignmentStatus();
  }, [id, currentUser.id, currentUser.role]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-bold text-slate-500">در حال بارگذاری محتوای بسته یادگیری...</div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-base font-bold text-slate-800">بسته مطالعه مورد نظر یافت نشد.</div>
        <Link
          href="/study-studio"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به استودیوی مطالعه
        </Link>
      </div>
    );
  }

  // استخراج خلاصه و نقشه ذهنی از رشته‌های JSON
  let summary = { overview: "", keyTakeaways: [], glossary: [] };
  let mindMap = { nodes: [], edges: [] };

  try {
    if (pack.summaryJson) summary = JSON.parse(pack.summaryJson);
  } catch {}
  try {
    if (pack.mindMapJson) mindMap = JSON.parse(pack.mindMapJson);
  } catch {}

  const primaryQuiz = pack.quizzes?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* هدر بالایی و ناوبری */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/study-studio"
              className="hover:text-indigo-600 transition flex items-center gap-1 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              استودیوی مطالعه
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">{pack.topicTag || "مبحث تحلیلی"}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {pack.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* لینک به موتور یادگیری تطبیقی نسل جدید */}
          <Link
            href={`/study-studio/${id}/adaptive`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-slate-950 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>موتور یادگیری تطبیقی و Boss Fight ⚡</span>
          </Link>

          {/* دکمه چاپ کاربرگ و PDF آزمون */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>چاپ برگه و PDF آزمون (🖨️)</span>
          </button>

          {/* دکمه ابلاغ تکلیف توسط دبیر */}
          {(currentUser.role === "TEACHER" || currentUser.role === "PRINCIPAL") && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>ابلاغ به کلاس (MagicSchool 🚀)</span>
            </button>
          )}

          <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
            پایه {pack.gradeLevel || 12}
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            الگوریتم SM-2 فعال
          </span>
        </div>
      </div>

      {/* بنر هدف تکلیف ابلاغ شده (در صورت تخصیص به دانش‌آموز) */}
      {assignmentInfo && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in ${
            assignmentInfo.isCompleted
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-indigo-50 border-indigo-200 text-indigo-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                assignmentInfo.isCompleted
                  ? "bg-emerald-200 text-emerald-800"
                  : "bg-indigo-200 text-indigo-800"
              }`}
            >
              {assignmentInfo.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              ) : (
                <Target className="w-5 h-5 text-indigo-700" />
              )}
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>تکلیف استودیو ابلاغ‌شده توسط {assignmentInfo.teacher?.fullName || "دبیر"}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    assignmentInfo.isCompleted
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {assignmentInfo.isCompleted ? "✅ تکمیل شده" : "⏳ در حال انجام"}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                هدف قبولی: کسب تسلط حداقل {assignmentInfo.minMasteryScore}٪ در کوییز تشخیصی •
                مهلت ارسال: {new Date(assignmentInfo.dueDate).toLocaleDateString("fa-IR")}
              </div>
            </div>
          </div>

          <div className="text-left font-mono font-bold bg-white/80 px-3.5 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <span>بالاترین نمره آزمون شما: </span>
            <span
              className={`text-sm font-black ${
                assignmentInfo.bestPercentage >= assignmentInfo.minMasteryScore
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {assignmentInfo.bestPercentage}٪
            </span>
          </div>
        </div>
      )}

      {/* نوار مانیتورینگ تمرکز فعال و ضد تقلب استودیو */}
      <ActiveFocusTrackerBar
        status={status}
        activeSeconds={activeSeconds}
        idleSeconds={idleSeconds}
        focusRatio={focusRatio}
      />

      {/* تب‌های استودیو */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          href={`/study-studio/${id}/adaptive`}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-rose-800 border border-rose-300 hover:bg-rose-50 shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>نقشه مراحل تطبیقی و Boss Fight (🔥 FSRS)</span>
        </Link>

        <button
          type="button"
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
            activeTab === "flashcards"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          فلش‌کارت‌های مرور فاصله‌دار (SM-2)
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "flashcards" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {pack.flashcards?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
            activeTab === "quiz"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4 text-emerald-200" />
          کوییز سنجش تسلط بلوم
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "quiz" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {primaryQuiz?.questions?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mindmap")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
            activeTab === "mindmap"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Share2 className="w-4 h-4 text-purple-200" />
          نقشه ذهنی مفاهیم (Mind Map)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition ${
            activeTab === "summary"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-200" />
          چکیده و تقلب‌نامه درس
        </button>
      </div>

      {/* محتوای تب‌ها */}
      <div>
        {/* ۱. پلیر سه‌بعدی فلش‌کارت‌ها */}
        {activeTab === "flashcards" && (
          <FlashcardDeckPlayer
            cards={pack.flashcards || []}
            studentId={currentUser.id}
            packTitle={pack.title}
            onTakeQuiz={() => setActiveTab("quiz")}
          />
        )}

        {/* ۲. رانر آزمون تستی */}
        {activeTab === "quiz" && primaryQuiz && (
          <InteractiveQuizRunner
            quiz={primaryQuiz}
            studentId={currentUser.id}
            onBackToStudio={() => setActiveTab("flashcards")}
          />
        )}

        {/* ۳. نقشه ذهنی مفاهیم */}
        {activeTab === "mindmap" && (
          <MindMapViewer
            nodes={mindMap.nodes || []}
            edges={mindMap.edges || []}
            title={`نقشه ذهنی: ${pack.title}`}
          />
        )}

        {/* ۴. خلاصه و واژه‌نامه */}
        {activeTab === "summary" && (
          <SmartSummaryView
            summary={summary}
            topicTitle={pack.title}
          />
        )}
      </div>

      {/* مدال تخصیص تکلیف به کلاس / دانش‌آموز (MagicSchool) */}
      <AssignStudyPackModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        studyPackId={pack.id}
        studyPackTitle={pack.title}
        topicTag={pack.topicTag}
        onAssigned={() => {
          checkAssignmentStatus();
        }}
      />

      {/* مدال چاپ کاربرگ و PDF آزمون استاندارد A4 */}
      <WorksheetPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        studyPack={pack}
      />
    </div>
  );
}
