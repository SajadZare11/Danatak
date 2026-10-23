"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  BookOpen,
  Award,
  Zap,
  Phone,
  School,
  Save,
  Check,
  Send,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  GitBranch,
  Activity,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Target,
} from "lucide-react";
import { MasteryRadarChart, RadarItem } from "@/components/mastery/MasteryRadarChart";
import { PrerequisiteGraphViewer, GraphNode, GraphEdge } from "@/components/mastery/PrerequisiteGraphViewer";
import { DiagnosticTestModal, DiagnosticData } from "@/components/mastery/DiagnosticTestModal";

export interface StudentData {
  id: string;
  userId: string;
  fullName: string;
  nationalId: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gradeLevel: number;
  major: string;
  schoolName: string;
  learningStyle: string;
  academicStrengths: string;
  academicWeaknesses: string;
  privateTeacherNotes: string;
  avgMastery: number;
  streakDays: number;
  totalXP: number;
  masteryRecords: Array<{
    id: string;
    topicId: string;
    topicTitle: string;
    percentage: number;
  }>;
}

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData | null;
  textbookTopics: Array<{
    id: string;
    title: string;
    subTopics?: Array<{ id: string; title: string }>;
  }>;
  onSaveMastery: (studentProfileId: string, topicId: string, percentage: number) => Promise<void>;
  onSaveNotes: (studentProfileId: string, notes: string) => Promise<void>;
  onTriggerRemedialHomework: (topicId: string, topicTitle: string, studentName: string) => void;
  onOpenReportCard?: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  textbookTopics,
  onSaveMastery,
  onSaveNotes,
  onTriggerRemedialHomework,
  onOpenReportCard,
}) => {
  const [activeTab, setActiveTab] = useState<"attributes" | "portfolio" | "actions" | "telemetry">("attributes");
  const [notes, setNotes] = useState(student?.privateTeacherNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // وضعیت درصدهای در حال تغییر در تب عملیات
  const [localMasteries, setLocalMasteries] = useState<Record<string, number>>({});
  const [savingTopicId, setSavingTopicId] = useState<string | null>(null);
  const [lastSavedTopic, setLastSavedTopic] = useState<{ id: string; title: string; percentage: number } | null>(null);

  // داده‌های تحلیلی رادار و گراف پیش‌نیازها
  const [analyticsData, setAnalyticsData] = useState<{
    radarData: RadarItem[];
    graphNodes: GraphNode[];
    graphEdges: GraphEdge[];
    diagnosticRecommendations: DiagnosticData[];
  } | null>(null);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticData | null>(null);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    if (!student) return;
    try {
      const res = await fetch(`/api/mastery/analytics?studentProfileId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData({
          radarData: data.radarData || [],
          graphNodes: data.graphNodes || [],
          graphEdges: data.graphEdges || [],
          diagnosticRecommendations: data.diagnosticRecommendations || [],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTelemetry = async () => {
    if (!student) return;
    setLoadingTelemetry(true);
    try {
      const sId = student.userId || student.id;
      const res = await fetch(`/api/study-studio/telemetry/analytics?studentId=${sId}`);
      const data = await res.json();
      if (data.success) {
        setTelemetryData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch telemetry:", err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchAnalytics();
      fetchTelemetry();
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  // همگام‌سازی یادداشت‌ها در تغییر دانش‌آموز
  if (notes !== student.privateTeacherNotes && !isSavingNotes && !notesSavedSuccess) {
    setNotes(student.privateTeacherNotes || "");
  }

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotes(true);
    try {
      await onSaveNotes(student.id, notes);
      setIsSavingNotes(false);
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2000);
    } catch {
      setIsSavingNotes(false);
    }
  };

  const handleMasteryChange = (topicId: string, value: number) => {
    setLocalMasteries((prev) => ({ ...prev, [topicId]: value }));
  };

  const handleSaveMasteryRecord = async (topicId: string, topicTitle: string) => {
    const percentage = localMasteries[topicId] ?? 
      (student.masteryRecords.find((m) => m.topicId === topicId)?.percentage || 50);

    setSavingTopicId(topicId);
    try {
      await onSaveMastery(student.id, topicId, percentage);
      setSavingTopicId(null);
      setLastSavedTopic({ id: topicId, title: topicTitle, percentage });
    } catch {
      setSavingTopicId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* هدر مودال پروفایل دانش‌آموز */}
        <div className="px-6 py-4 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <img
              src={student.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"}
              alt={student.fullName}
              className="w-12 h-12 rounded-2xl border-2 border-indigo-400 bg-slate-800 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{student.fullName}</h2>
                <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  کد ملی: {student.nationalId}
                </span>
                <span className="flex items-center text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 ml-1 fill-amber-400 text-amber-400" />
                  {student.streakDays} روز استمرار
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                پایه {student.gradeLevel} {student.major} • {student.schoolName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReportCard && (
              <button
                type="button"
                onClick={() => onOpenReportCard(student.userId)}
                className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl border border-indigo-400/40 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                کارنامه رسمی آموزش و پرورش
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* نوار تب‌های سه‌گانه */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("attributes")}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === "attributes"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" /> تب اول: اطلاعات و ویژگی‌ها
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === "portfolio"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="w-4 h-4" /> تب دوم: وضعیت تحصیلی و پورتفولیو
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === "actions"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" /> تب سوم: عملیات و درصد یادگیری
            {lastSavedTopic && lastSavedTopic.percentage < 60 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === "telemetry"
                ? "border-purple-600 text-purple-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4 text-purple-600" /> تب چهارم: دورسنجی مطالعه و تمرکز ⚡
            {telemetryData?.isStruggling && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        </div>

        {/* محتوای تب‌ها */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* تب اول: اطلاعات و ویژگی‌ها */}
          {activeTab === "attributes" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* بخش ۱: کارت اطلاعات فردی و اولیا */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" /> مشخصات فردی و تحصیلی
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">پایه و رشته:</span>
                      <span className="font-semibold text-slate-800">
                        پایه {student.gradeLevel} - {student.major}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">مدرسه:</span>
                      <span className="font-semibold text-slate-800">{student.schoolName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">کد ملی:</span>
                      <span className="font-mono font-semibold text-slate-800">{student.nationalId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">امتیاز تجربه (XP):</span>
                      <span className="font-bold text-amber-600">{student.totalXP} XP</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" /> مشخصات اولیا و تماس
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">نام ولی:</span>
                      <span className="font-semibold text-slate-800">مهندس حسین رضایی (پدر)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">شماره تماس ولی:</span>
                      <span className="font-mono font-semibold text-slate-800">۰۹۱۲۷۷۷۷۷۷۷</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">تلفن دانش‌آموز:</span>
                      <span className="font-mono font-semibold text-slate-800">{student.phoneNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">وضعیت پیامک:</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        خط خدماتی فعال
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* بخش ۲: ویژگی‌های یادگیری */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> ویژگی‌های یادگیری و عملکردی
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100/80">
                    <span className="text-indigo-400 text-[11px] block font-medium">سبک یادگیری:</span>
                    <span className="font-bold text-indigo-900 mt-1 block">{student.learningStyle}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-emerald-600 text-[11px] block font-medium">نقاط قوت تحصیلی:</span>
                    <span className="font-bold text-emerald-900 mt-1 block">{student.academicStrengths}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-100">
                    <span className="text-rose-500 text-[11px] block font-medium">نقاط ضعف نیازمند تقویت:</span>
                    <span className="font-bold text-rose-900 mt-1 block">{student.academicWeaknesses}</span>
                  </div>
                </div>
              </div>

              {/* بخش ۳: یادداشت‌های خصوصی معلم و مشاور */}
              <form onSubmit={handleNotesSubmit} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    یادداشت‌های محرمانه معلم و مشاور (درباره رفتار، تمرکز یا شرایط خاص)
                  </label>
                  <span className="text-[11px] text-slate-400">فقط کادر آموزشی دسترسی دارند</span>
                </div>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات رفتاری، توجه به تکالیف، یا شرایط دانش‌آموز را اینجا یادداشت کنید..."
                  className="w-full text-xs p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNotes || notesSavedSuccess}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition ${
                      notesSavedSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {notesSavedSuccess ? (
                      <>
                        <Check className="w-4 h-4" /> ذخیره شد!
                      </>
                    ) : isSavingNotes ? (
                      "در حال ذخیره..."
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> ذخیره یادداشت محرمانه
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* تب دوم: وضعیت تحصیلی و پورتفولیو */}
          {activeTab === "portfolio" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* بخش ۱: نمودار رادار تسلط موضوعی (Recharts) */}
              {analyticsData?.radarData && analyticsData.radarData.length > 0 ? (
                <MasteryRadarChart
                  data={analyticsData.radarData}
                  studentName={student.fullName}
                />
              ) : (
                /* خلاصه میانگین تسلط اولیه */
                <div className="p-4 bg-gradient-to-l from-slate-900 to-indigo-950 rounded-2xl text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-300 block">شاخص میانگین تسلط بر مباحث (Mastery Score)</span>
                    <div className="text-2xl font-black text-white mt-1">{student.avgMastery}٪</div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-300 block">سطح کلی در درس حسابان</span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30 mt-1 inline-block">
                      {student.avgMastery >= 75 ? "بسیار خوب" : student.avgMastery >= 50 ? "متوسط / نیازمند تثبیت" : "نیازمند جبران"}
                    </span>
                  </div>
                </div>
              )}

              {/* بخش ۲: گراف پیوسته پیش‌نیازها و عارضه‌یابی ریشه‌ای */}
              {analyticsData?.graphNodes && analyticsData.graphNodes.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <PrerequisiteGraphViewer
                    nodes={analyticsData.graphNodes}
                    edges={analyticsData.graphEdges}
                    onOpenDiagnosticTest={(nodeId, nodeTitle) => {
                      const diag = analyticsData.diagnosticRecommendations.find(
                        (d) => d.strugglingTopic.id === nodeId || d.rootCausePrerequisite.id === nodeId
                      ) || analyticsData.diagnosticRecommendations[0];

                      if (diag) {
                        setSelectedDiagnostic(diag);
                        setIsDiagnosticModalOpen(true);
                      }
                    }}
                  />
                </div>
              )}

              {/* تایم‌لاین جلسات کلاسی و حضور و غیاب */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" /> تایم‌لاین جلسات گذشته و فعالیت کلاسی
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-800">جلسه ۲۴ مهر (مبحث مشتق زنجیره‌ای):</span>
                      <span className="text-slate-600">حضور کامل • پاسخ صحیح به پرسش کلاسی (+۲ نمره تشویقی)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">ساعت ۸:۰۰ تا ۹:۳۰</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-800">جلسه ۲۱ مهر (مبحث مشتق کسری):</span>
                      <span className="text-slate-600">حاضر • تحویل تکلیف شماره ۲ با تاخیر</span>
                    </div>
                    <span className="text-[11px] text-slate-400">ساعت ۹:۴۵ تا ۱۱:۱۵</span>
                  </div>
                </div>
              </div>

              {/* آرشیو کارها: تکالیف و آزمون‌ها */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> آرشیو تکالیف و آزمون‌های گذشته
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">عنوان آزمون / تکلیف</th>
                        <th className="p-3">مبحث</th>
                        <th className="p-3">نمره</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">کوییز مستمر نوبت اول</td>
                        <td className="p-3 text-slate-600">حد و پیوستگی توابع</td>
                        <td className="p-3 font-bold text-emerald-600">۱۹.۵ از ۲۰</td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px]">
                            تصحیح شده
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">تکلیف شماره ۲ (تستی)</td>
                        <td className="p-3 text-slate-600">مشتق توابع جبری و کسری</td>
                        <td className="p-3 font-bold text-amber-600">۱۴.۰ از ۲۰ (۵۵٪)</td>
                        <td className="p-3">
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[11px]">
                            نیازمند تمرین جبرانی
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* تب سوم: عملیات (ثبت درصد یادگیری + ارسال تکلیف جبرانی) */}
          {activeTab === "actions" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* بنر راهنمای تب عملیات */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong>مسیر ثبت یادگیری و تکلیف هوشمند:</strong>
                  درختواره درسی زیر را مرور کنید و درصد یادگیری دانش‌آموز را بر اساس پرسش کلاسی یا کوییز امروز تغییر دهید. به محض ثبت درصد زیر ۶۰٪، دکمه «ارسال تکلیف جبرانی» فعال می‌شود.
                </div>
              </div>

              {/* درختواره سرفصل‌های کتاب درسی */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800">
                  درختواره کتاب ریاضی ۳ و حسابان ۲ (پایه دوازدهم)
                </h4>

                <div className="space-y-3">
                  {textbookTopics.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                    >
                      <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 font-bold text-xs text-slate-800">
                        {chapter.title}
                      </div>

                      <div className="p-4 divide-y divide-slate-100">
                        {chapter.subTopics && chapter.subTopics.length > 0 ? (
                          chapter.subTopics.map((sub) => {
                            const currentVal =
                              localMasteries[sub.id] ??
                              (student.masteryRecords.find((m) => m.topicId === sub.id)?.percentage || 50);

                            const isLow = currentVal < 60;

                            return (
                              <div key={sub.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-bold text-slate-800">{sub.title}</span>
                                    {isLow && (
                                      <span className="inline-flex items-center text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                        <AlertTriangle className="w-3 h-3 ml-1 text-rose-500" />
                                        نیازمند تقویت ({currentVal}٪)
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                      {currentVal}٪
                                    </span>
                                    <button
                                      type="button"
                                      disabled={savingTopicId === sub.id}
                                      onClick={() => handleSaveMasteryRecord(sub.id, sub.title)}
                                      className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                    >
                                      {savingTopicId === sub.id ? "ثبت..." : "ذخیره درصد"}
                                    </button>
                                  </div>
                                </div>

                                {/* اسلایدر ثبت درصد */}
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={currentVal}
                                    onChange={(e) => handleMasteryChange(sub.id, Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                </div>

                                {/* دکمه میانبر هوشمند در صورت افت تسلط */}
                                {isLow && (
                                  <div className="pt-2 flex items-center justify-between bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/60 mt-1">
                                    <span className="text-[11px] text-rose-800 font-medium">
                                      تسلط در این مبحث زیر ۶۰٪ است. بسته سوالات تثبیتی آماده ارسال است:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onTriggerRemedialHomework(sub.id, sub.title, student.fullName)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition"
                                    >
                                      <Send className="w-3.5 h-3.5" /> ارسال تکلیف جبرانی این مبحث
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-400 py-2">زیرمبحثی یافت نشد.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* تب چهارم: دورسنجی مطالعه و تمرکز (Gizmo Focus & Telemetry) */}
          {activeTab === "telemetry" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {loadingTelemetry ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>در حال دریافت و تجمیع داده‌های دورسنجی استودیو...</div>
                </div>
              ) : telemetryData ? (
                <>
                  {/* بخش ۱: کارت‌های شاخص‌های کلیدی تمرکز و مطالعه فعال */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                        <span>مطالعه مفید</span>
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-xl font-black text-emerald-950 mt-1 font-mono">
                        {telemetryData.totalActiveMinutes} دقیقه
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">در استودیوی هوشمند</div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                      <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                        <span>زمان غیرفعال (Idle)</span>
                        <EyeOff className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-xl font-black text-amber-950 mt-1 font-mono">
                        {Math.round(telemetryData.totalIdleSeconds / 60)} دقیقه
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">خروج از برگه / عدم تعامل</div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
                        <span>نرخ تمرکز خالص</span>
                        <Activity className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-xl font-black text-purple-950 mt-1 font-mono">
                        {telemetryData.focusRatio}٪
                      </div>
                      <div className="text-[10px] text-purple-700 mt-0.5">نسبت زمان مفید به کل</div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                      <div className="flex items-center justify-between text-indigo-800 text-xs font-bold">
                        <span>کارت‌های SM-2</span>
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-xl font-black text-indigo-950 mt-1 font-mono">
                        {telemetryData.cardsReviewedCount} کارت
                      </div>
                      <div className="text-[10px] text-indigo-700 mt-0.5">
                        {telemetryData.totalCardLapses} افتادن به جعبه اول
                      </div>
                    </div>
                  </div>

                  {/* بخش ۲: هشدار افت تحصیلی و عدم تمرکز (Struggling Alert) */}
                  {telemetryData.isStruggling ? (
                    <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-3 shadow-sm animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-xs text-rose-800">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                          هشدار افت تحصیلی و عدم تمرکز (Struggling Student Flag ⚠️)
                        </div>
                        <span className="text-[11px] font-bold bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                          اقدام مداخله‌ای الزامی
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-rose-900 pr-7">
                        {telemetryData.strugglingReasons.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                        <span className="text-[11px] text-rose-700">
                          پیشنهاد سیستم: صدور تکلیف جبرانی مبحثی برای تثبیت نقاط ضعف در استودیو.
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerRemedialHomework(
                              "remedial-telemetry",
                              telemetryData.topicHeatmap[0]?.topicTag || "مشتق",
                              student.fullName
                            )
                          }
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          صدور تکلیف جبرانی هدفمند
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      وضعیت تمرکز و مطالعه دانش‌آموز در استودیوی هوشمند مطلوب است (نرخ تمرکز بالای {telemetryData.focusRatio}٪ بدون افت بحرانی).
                    </div>
                  )}

                  {/* بخش ۳: نقشه حرارتی سرفصل‌های استودیو (Topic Heatmap) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      نقشه حرارتی تسلط بر سرفصل‌های مطالعه‌شده در استودیو (Topic Heatmap)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {telemetryData.topicHeatmap.map((th: any, thIdx: number) => (
                        <div
                          key={thIdx}
                          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            th.status === "GOOD"
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                              : th.status === "MEDIUM"
                              ? "bg-amber-50/70 border-amber-200 text-amber-950"
                              : "bg-rose-50/70 border-rose-200 text-rose-950"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-black text-slate-900">{th.topicTag}</div>
                            <div className="text-[11px] text-slate-500">
                              {th.activeMinutes} دقیقه مطالعه مفید • {th.quizCount} کوییز
                            </div>
                          </div>

                          <div className="text-left font-mono">
                            <div className="text-sm font-black">{th.masteryPercentage}٪</div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                th.status === "GOOD"
                                  ? "bg-emerald-200 text-emerald-900"
                                  : th.status === "MEDIUM"
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-rose-200 text-rose-900"
                              }`}
                            >
                              {th.status === "GOOD" ? "تسلط بالا" : th.status === "MEDIUM" ? "متوسط" : "نیاز به تلاش"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* بخش ۳.۵: وضعیت تکالیف استودیو ابلاغ‌شده (Study Pack Assignments) */}
                  {telemetryData.assignments && telemetryData.assignments.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-600" />
                          وضعیت تکالیف استودیو ابلاغ‌شده توسط دبیر (MagicSchool Assignments)
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {telemetryData.assignments.filter((a: any) => a.isCompleted).length} از {telemetryData.assignments.length} تکمیل شده
                        </span>
                      </h4>

                      <div className="space-y-2">
                        {telemetryData.assignments.map((asgn: any) => (
                          <div
                            key={asgn.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                              asgn.isCompleted
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                : asgn.status === "IN_PROGRESS"
                                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-2">
                                <span>{asgn.studyPackTitle}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                                  {asgn.topicTag}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                مهلت تحویل: {new Date(asgn.dueDate).toLocaleDateString("fa-IR")} • حداقل نمره قبولی: {asgn.minMasteryScore}٪
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <div className="text-xs font-black">
                                نمره کسب‌شده: {asgn.bestPercentage}٪
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                  asgn.isCompleted
                                    ? "bg-emerald-200 text-emerald-900"
                                    : asgn.status === "IN_PROGRESS"
                                    ? "bg-amber-200 text-amber-900"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {asgn.isCompleted
                                  ? "تکمیل شده ✓"
                                  : asgn.status === "IN_PROGRESS"
                                  ? "در حال مطالعه ⏳"
                                  : "شروع نشده ❌"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* بخش ۴: جدول آخرین لاگ‌های دورسنجی */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      رویدادهای زنده دورسنجی مطالعه (Active Telemetry Logs)
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold">
                            <th className="pb-2">نوع رویداد</th>
                            <th className="pb-2">مبحث</th>
                            <th className="pb-2">زمان فعال</th>
                            <th className="pb-2">زمان غیرفعال</th>
                            <th className="pb-2">زمان ثبت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {telemetryData.recentLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-bold text-slate-800">
                                {log.eventType === "flashcard_reviewed" && "مرور فلش‌کارت SM-2"}
                                {log.eventType === "quiz_attempt_completed" && "تکمیل آزمون تستی"}
                                {log.eventType === "active_heartbeat" && "ضربان تمرکز مطالعه"}
                                {log.eventType === "idle_detected" && "هشدار عدم فعالیت"}
                                {log.eventType === "tab_hidden" && "خروج از برگه مرورگر"}
                                {log.eventType === "study_pack_created" && "ساخت بسته جدید"}
                                {!["flashcard_reviewed", "quiz_attempt_completed", "active_heartbeat", "idle_detected", "tab_hidden", "study_pack_created"].includes(log.eventType) && log.eventType}
                              </td>
                              <td className="py-2.5 text-slate-600">{log.topicTag || "عمومی"}</td>
                              <td className="py-2.5 font-mono text-emerald-700 font-bold">
                                {log.activeSeconds} ثانیه
                              </td>
                              <td className="py-2.5 font-mono text-amber-700 font-bold">
                                {log.idleSeconds} ثانیه
                              </td>
                              <td className="py-2.5 text-[11px] text-slate-400 font-mono">
                                {new Date(log.createdAt).toLocaleTimeString("fa-IR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  داده دورسنجی فعالی برای این دانش‌آموز یافت نشد.
                </div>
              )}
            </div>
          )}
        </div>

        {/* مدال تست تشخیصی ریشه‌ای */}
        <DiagnosticTestModal
          isOpen={isDiagnosticModalOpen}
          onClose={() => setIsDiagnosticModalOpen(false)}
          diagnostic={selectedDiagnostic}
          studentProfileId={student.id}
          onCompleted={() => {
            fetchAnalytics();
          }}
        />
      </div>
    </div>
  );
};
