"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  BarChart3,
  PenTool,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Award,
  ChevronDown,
  HelpCircle,
  Search,
  RefreshCw,
  Edit2,
  TrendingUp,
  TrendingDown,
  Sliders,
  Check,
  UserX,
  Sparkles,
} from "lucide-react";

interface StudentScoreItem {
  studentId: string;
  fullName: string;
  nationalId: string;
  avatarUrl: string;
  rawScore: number | null;
  maxScore: number;
  percentage: number | null;
  isAbsent: boolean;
  isRecorded: boolean;
  classRank?: number | string;
  percentileRank?: number;
  zScore?: number;
  taraz?: number;
  statusLabel?: string;
  statusColor?: string;
}

interface ExamSummary {
  id: string;
  title: string;
  maxScore: number;
  subjectTitle: string;
  examDate: string;
  createdAt: string;
  totalStudents: number;
  recordedCount: number;
  absentCount: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
}

interface ClassroomMeta {
  id: string;
  name: string;
  gradeLevel: number;
  major: string;
}

interface TeacherGradebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassroomId?: string;
  defaultTab?: "entry" | "records";
}

export const TeacherGradebookModal: React.FC<TeacherGradebookModalProps> = ({
  isOpen,
  onClose,
  initialClassroomId,
  defaultTab = "records",
}) => {
  const [activeTab, setActiveTab] = useState<"entry" | "records">(defaultTab);
  const [classrooms, setClassrooms] = useState<ClassroomMeta[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassroomId || "");

  // اطلاعات آزمون‌ها و دانش‌آموزان واکشی‌شده
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedExamDetails, setSelectedExamDetails] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);

  // استیت فرم ثبت نمره دستی جدید
  const [formTitle, setFormTitle] = useState("");
  const [formMaxScore, setFormMaxScore] = useState<number>(20);
  const [formSubject, setFormSubject] = useState("حسابان ۲");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryScores, setEntryScores] = useState<Record<string, { score: string; isAbsent: boolean }>>({});
  const [savingEntry, setSavingEntry] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // فیلترها و بررسی تحلیلی فردی
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBinFilter, setSelectedBinFilter] = useState<string | null>(null);
  const [inspectStudent, setInspectStudent] = useState<StudentScoreItem | null>(null);
  const [editingScoreStudent, setEditingScoreStudent] = useState<StudentScoreItem | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<string>("");
  const [editIsAbsent, setEditIsAbsent] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // همگام‌سازی تب اولیه هنگام باز شدن مودال
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      if (initialClassroomId) {
        setSelectedClassId(initialClassroomId);
      }
    }
  }, [isOpen, defaultTab, initialClassroomId]);

  // ۱. واکشی داده‌های کلاس و نمرات
  const fetchData = async (classId?: string, examIdToSelect?: string) => {
    const targetClassId = classId || selectedClassId;
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (targetClassId) qParams.set("classroomId", targetClassId);
      if (examIdToSelect) qParams.set("examId", examIdToSelect);

      const res = await fetch(`/api/teacher/grades/manual?${qParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setClassrooms(data.classrooms || []);
        if (!selectedClassId && data.activeClassId) {
          setSelectedClassId(data.activeClassId);
        }
        setExams(data.exams || []);
        setClassStudents(data.students || []);

        if (data.selectedExam) {
          setSelectedExamId(data.selectedExam.id);
          setSelectedExamDetails(data.selectedExam);
        } else {
          setSelectedExamId("");
          setSelectedExamDetails(null);
        }

        setAnalyticsData(data.analytics || null);

        // آماده‌سازی اولیه فرم ثبت برای دانش‌آموزان
        const initEntry: Record<string, { score: string; isAbsent: boolean }> = {};
        (data.students || []).forEach((s: any) => {
          initEntry[s.id] = { score: "", isAbsent: false };
        });
        setEntryScores(initEntry);
      }
    } catch (e) {
      console.error("Error fetching manual grades:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, selectedClassId]);

  // تغییر کلاس انتخابی
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedExamId("");
    setSelectedBinFilter(null);
    setInspectStudent(null);
    fetchData(newClassId);
  };

  // انتخاب یک آزمون برای بررسی تحلیلی
  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setSelectedBinFilter(null);
    setInspectStudent(null);
    fetchData(selectedClassId, examId);
  };

  // تنظیم نمره دانش‌آموز در فرم ورود دستی
  const handleScoreChange = (studentId: string, val: string) => {
    setEntryScores((prev) => ({
      ...prev,
      [studentId]: {
        score: val,
        isAbsent: false,
      },
    }));
  };

  // تاگل وضعیت غیبت دانش‌آموز
  const handleToggleAbsent = (studentId: string) => {
    setEntryScores((prev) => {
      const current = prev[studentId] || { score: "", isAbsent: false };
      return {
        ...prev,
        [studentId]: {
          score: current.isAbsent ? "" : "",
          isAbsent: !current.isAbsent,
        },
      };
    });
  };

  // پر کردن سریع نمره کامل برای همه
  const handleFillMaxAll = () => {
    const updated: Record<string, { score: string; isAbsent: boolean }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { score: String(formMaxScore), isAbsent: false };
    });
    setEntryScores(updated);
  };

  // پاکسازی فرم نمرات
  const handleClearAll = () => {
    const updated: Record<string, { score: string; isAbsent: boolean }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { score: "", isAbsent: false };
    });
    setEntryScores(updated);
  };

  // محاسبه زنده میانگین نمرات واردشده در فرم
  const liveFormAverage = useMemo(() => {
    const validScores: number[] = [];
    Object.values(entryScores).forEach((item) => {
      if (!item.isAbsent && item.score !== "" && !isNaN(Number(item.score))) {
        validScores.push(Number(item.score));
      }
    });
    if (validScores.length === 0) return null;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Number((sum / validScores.length).toFixed(2));
  }, [entryScores]);

  // ثبت نهایی فرم آزمون جدید
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("لطفاً عنوان آزمون را وارد نمایید.");
      return;
    }
    if (formMaxScore <= 0) {
      alert("سقف نمره باید بزرگتر از صفر باشد.");
      return;
    }

    setSavingEntry(true);
    try {
      const gradesPayload = classStudents.map((std) => {
        const item = entryScores[std.id] || { score: "", isAbsent: false };
        return {
          studentId: std.id,
          score: item.score,
          isAbsent: item.isAbsent,
        };
      });

      const res = await fetch("/api/teacher/grades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassId,
          title: formTitle,
          maxScore: formMaxScore,
          subjectTitle: formSubject,
          examDate: formDate,
          grades: gradesPayload,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSaveSuccessMessage("آزمون و نمرات با موفقیت ذخیره شدند!");
        setFormTitle("");
        handleClearAll();

        // بازخوانی و انتقال خودکار به تب نمرات ثبت‌شده برای مشاهده تحلیل‌ها
        await fetchData(selectedClassId, result.examId);
        setActiveTab("records");
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } else {
        alert(result.error || "خطا در ثبت نمرات");
      }
    } catch (err) {
      console.error(err);
      alert("خطای غیرمنتظره در ارتباط با سرور");
    } finally {
      setSavingEntry(false);
    }
  };

  // ذخیره ویرایش سریع نمره یک دانش‌آموز
  const handleSaveStudentEdit = async () => {
    if (!editingScoreStudent || !selectedExamDetails) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/teacher/grades/manual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamDetails.id,
          studentId: editingScoreStudent.studentId,
          score: editIsAbsent ? null : editScoreValue,
          isAbsent: editIsAbsent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingScoreStudent(null);
        await fetchData(selectedClassId, selectedExamDetails.id);
      } else {
        alert(data.error || "خطا در ویرایش نمره");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ذخیره نمره");
    } finally {
      setSavingEdit(false);
    }
  };

  // فیلتر کردن دانش‌آموزان در جدول نمرات ثبت‌شده
  const filteredStudents = useMemo(() => {
    if (!selectedExamDetails?.students) return [];
    return selectedExamDetails.students.filter((std: StudentScoreItem) => {
      const matchesSearch =
        std.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.nationalId.includes(searchQuery);

      if (!matchesSearch) return false;

      // فیلتر ستون نمودار
      if (selectedBinFilter !== null && analyticsData?.bellCurve) {
        const bin = analyticsData.bellCurve.find((b: any) => b.binLabel === selectedBinFilter);
        if (bin && std.rawScore !== null) {
          return std.rawScore >= bin.min && (bin.max === selectedExamDetails.maxScore ? std.rawScore <= bin.max : std.rawScore < bin.max);
        }
      }
      return true;
    });
  }, [selectedExamDetails, searchQuery, selectedBinFilter, analyticsData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ۱. هدر اصلی مودال */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                دفتر ارزشیابی و کارنامه تحلیلی کلاس
              </h2>
              <p className="text-xs text-slate-400">
                ثبت دستی نمرات امتحانات، محاسبه شاخص‌های توزیع کلاسی و بررسی دقیق عملکرد دانش‌آموزان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* سلکتور انتخاب کلاس */}
            {classrooms.length > 0 && (
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="bg-slate-800 text-slate-100 text-xs font-bold px-3 py-1.5 pr-8 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ۲. نوار سوئیچ تب‌ها */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("entry")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === "entry"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>ثبت نمره جدید</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("records")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === "records"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>نمرات ثبت‌شده و تحلیل‌ها</span>
              {exams.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === "records" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {exams.length}
                </span>
              )}
            </button>
          </div>

          {saveSuccessMessage && (
            <div className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* ۳. محتوای تب‌ها */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================= */}
          {/* تب ۱: فرم ثبت نمره دستی جدید */}
          {/* ========================================================= */}
          {activeTab === "entry" && (
            <form onSubmit={handleSaveExam} className="space-y-5">
              {/* فرم مشخصات آزمون */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>مشخصات آزمون و ارزشیابی</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 font-medium">
                    کلاس فعال: <span className="font-bold text-slate-800">{classrooms.find((c) => c.id === selectedClassId)?.name || "کلاس ۱۲/۱"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      عنوان آزمون <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: کوییز مستمر ۱ - فصل مشتق"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      نمره از چند است؟ (سقف نمره) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        required
                        value={formMaxScore}
                        onChange={(e) => setFormMaxScore(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black text-center"
                      />
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFormMaxScore(20)}
                          className={`text-[10px] px-2 py-1.5 rounded-lg border font-bold ${formMaxScore === 20 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}
                        >
                          ۲۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMaxScore(10)}
                          className={`text-[10px] px-2 py-1.5 rounded-lg border font-bold ${formMaxScore === 10 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}
                        >
                          ۱۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMaxScore(100)}
                          className={`text-[10px] px-2 py-1.5 rounded-lg border font-bold ${formMaxScore === 100 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}
                        >
                          ۱۰۰
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      نام درس یا سرفصل
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حسابان ۲"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تاریخ برگزاری آزمون
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* نوار ابزار ثبت نمرات دانش‌آموزان */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-800">
                    ورود نمرات دانش‌آموزان ({classStudents.length} نفر):
                  </span>
                  {liveFormAverage !== null && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
                      میانگین موقت نمرات: <span className="font-black text-indigo-900">{liveFormAverage}</span> از {formMaxScore}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillMaxAll}
                    className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition"
                  >
                    نمره کامل برای همه
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-slate-50 text-rose-600 border border-slate-200 rounded-lg transition"
                  >
                    پاکسازی همه
                  </button>
                </div>
              </div>

              {/* جدول نمرات دانش‌آموزان */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
                      <th className="py-2.5 px-3">دانش‌آموز</th>
                      <th className="py-2.5 px-3 w-40">نمره کسب‌شده (از {formMaxScore})</th>
                      <th className="py-2.5 px-3 w-28 text-center">وضعیت غیبت</th>
                      <th className="py-2.5 px-3 w-28 text-center">درصد محاسبه‌شده</th>
                      <th className="py-2.5 px-3 w-32 text-center">سطح تسلط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((std, idx) => {
                      const item = entryScores[std.id] || { score: "", isAbsent: false };
                      const num = item.score !== "" && !isNaN(Number(item.score)) ? Number(item.score) : null;
                      const pct = num !== null ? Number(((num / formMaxScore) * 100).toFixed(1)) : null;

                      let statusBadge = { label: "وارد نشده", color: "text-slate-400 bg-slate-100" };
                      if (item.isAbsent) {
                        statusBadge = { label: "غایب موجه/غیرموجه", color: "text-rose-700 bg-rose-50 border border-rose-200" };
                      } else if (pct !== null) {
                        if (pct >= 85) statusBadge = { label: "عالی", color: "text-emerald-700 bg-emerald-50 border border-emerald-200" };
                        else if (pct >= 70) statusBadge = { label: "خوب", color: "text-blue-700 bg-blue-50 border border-blue-200" };
                        else if (pct >= 50) statusBadge = { label: "متوسط", color: "text-amber-700 bg-amber-50 border border-amber-200" };
                        else statusBadge = { label: "نیاز به تلاش", color: "text-rose-700 bg-rose-50 border border-rose-200" };
                      }

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={std.avatarUrl}
                                alt={std.fullName}
                                className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300"
                              />
                              <div>
                                <div className="font-bold text-slate-800">{std.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{std.nationalId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              max={formMaxScore}
                              step="0.25"
                              disabled={item.isAbsent}
                              placeholder={item.isAbsent ? "غایب" : "۰ تا " + formMaxScore}
                              value={item.score}
                              onChange={(e) => handleScoreChange(std.id, e.target.value)}
                              className={`w-full text-xs font-black text-center py-1.5 px-2.5 rounded-xl border transition ${
                                item.isAbsent
                                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAbsent(std.id)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition ${
                                item.isAbsent
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {item.isAbsent ? "غایب (ثبت شد)" : "حاضر"}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {pct !== null ? `${pct}٪` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* دکمه ثبت نهایی */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("records")}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {savingEntry ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ذخیره‌سازی نمرات...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ثبت و ذخیره نهایی نمرات آزمون</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* تب ۲: نمرات ثبت‌شده و تحلیل‌های آماری */}
          {/* ========================================================= */}
          {activeTab === "records" && (
            <div className="space-y-5">
              {/* بخش انتخاب آزمون‌های ثبت‌شده */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 whitespace-nowrap">
                    آزمون‌های ثبت‌شده کلاس:
                  </span>
                  {exams.length > 0 ? (
                    <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-xl">
                      {exams.map((ex) => {
                        const isSelected = selectedExamId === ex.id;
                        return (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => handleSelectExam(ex.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shrink-0 ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <span>{ex.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                              میانگین: {ex.averageScore}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">هیچ آزمونی برای این کلاس ثبت نشده است.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("entry")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ثبت آزمون جدید</span>
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs font-bold">در حال واکشی نمرات و محاسبات آماری...</p>
                </div>
              ) : selectedExamDetails && analyticsData ? (
                <>
                  {/* ۲. کارت‌های شاخص‌های کلیدی آماری (Descriptive Stat Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* کارت میانگین */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-3.5 rounded-2xl border border-indigo-200/80 shadow-2xs relative group">
                      <div className="flex items-center justify-between text-indigo-700 mb-1">
                        <span className="text-[11px] font-bold">میانگین کلاس</span>
                        <div className="relative cursor-help">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600" />
                          <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-30 leading-relaxed">
                            معدل حسابی کل نمرات کلاس؛ نشان‌دهنده سطح عملکرد متوسط دانش‌آموزان در این آزمون.
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-900 flex items-baseline gap-1">
                        <span>{analyticsData.descriptive.mean}</span>
                        <span className="text-xs text-slate-400 font-normal">از {selectedExamDetails.maxScore}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        معادل {Number(((analyticsData.descriptive.mean / selectedExamDetails.maxScore) * 100).toFixed(1))}٪ تسلط
                      </div>
                    </div>

                    {/* کارت انحراف معیار */}
                    <div className="bg-gradient-to-br from-blue-50 to-white p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs relative group">
                      <div className="flex items-center justify-between text-blue-700 mb-1">
                        <span className="text-[11px] font-bold">انحراف معیار (پراکندگی)</span>
                        <div className="relative cursor-help">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600" />
                          <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-30 leading-relaxed">
                            میزان پراکندگی و فاصله نمرات از میانگین. عدد کمتر یعنی نمرات بچه‌ها به هم نزدیک و کلاس همگن است.
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {analyticsData.descriptive.stdDev}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        ضریب تغییرات: {analyticsData.descriptive.cv}٪ {analyticsData.descriptive.cv < 20 ? "(کلاس همگن)" : "(ناهمگن)"}
                      </div>
                    </div>

                    {/* کارت میانه */}
                    <div className="bg-gradient-to-br from-teal-50 to-white p-3.5 rounded-2xl border border-teal-200/80 shadow-2xs relative group">
                      <div className="flex items-center justify-between text-teal-700 mb-1">
                        <span className="text-[11px] font-bold">میانه نمرات (حد وسط)</span>
                        <div className="relative cursor-help">
                          <HelpCircle className="w-3.5 h-3.5 text-teal-400 hover:text-teal-600" />
                          <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-30 leading-relaxed">
                            نمره‌ای که دقیقاً نصف کلاس بالاتر از آن و نصف دیگر پایین‌تر از آن نمره گرفته‌اند.
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {analyticsData.descriptive.median}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        چارک دوم توزیع کلاس
                      </div>
                    </div>

                    {/* کارت کمترین و بیشترین نمره */}
                    <div className="bg-gradient-to-br from-amber-50 to-white p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs relative group">
                      <div className="flex items-center justify-between text-amber-700 mb-1">
                        <span className="text-[11px] font-bold">دامنه نمرات (کمینه/بیشینه)</span>
                        <div className="relative cursor-help">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 hover:text-amber-600" />
                          <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-30 leading-relaxed">
                            فاصله بین کمترین نمره و بالاترین نمره ثبت‌شده در کلاس (دامنه تغییرات).
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-900 flex items-center gap-1">
                        <span className="text-emerald-700">{analyticsData.descriptive.max}</span>
                        <span className="text-slate-300 text-sm">/</span>
                        <span className="text-rose-700">{analyticsData.descriptive.min}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        دامنه نوسان: {analyticsData.descriptive.range} نمره
                      </div>
                    </div>

                    {/* کارت درصد قبولی */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs relative group col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-emerald-700 mb-1">
                        <span className="text-[11px] font-bold">درصد قبولی (نصف سقف)</span>
                        <div className="relative cursor-help">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 hover:text-emerald-600" />
                          <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-30 leading-relaxed">
                            درصد دانش‌آموزانی که نمره‌شان بالاتر از ۵۰ درصد سقف نمره بوده است.
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-emerald-800">
                        {analyticsData.passingPercentage}٪
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        {analyticsData.passingCount} قبول / {analyticsData.failingCount} نیاز به جبران
                      </div>
                    </div>
                  </div>

                  {/* ۳. بخش نمودارهای تحلیلی با راهنماهای هوشمند هاور */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* نمودار ۱: توزیع فراوانی نمرات (هیستوگرام زنگوله‌ای) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            <h4 className="text-xs font-black text-slate-800">
                              نمودار توزیع فراوانی نمرات کلاس (هیستوگرام زنگوله‌ای)
                            </h4>
                          </div>

                          {/* راهنمای هاور ساده و روان */}
                          <div className="relative group cursor-pointer">
                            <div className="flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 font-bold">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>راهنمای نمودار</span>
                            </div>
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1.5 w-72 p-3 bg-slate-900 text-slate-100 text-xs rounded-2xl shadow-2xl z-30 leading-relaxed border border-slate-700">
                              <p className="font-bold text-white mb-1">💡 این نمودار چه چیزی را نشان می‌دهد؟</p>
                              <p className="text-[11px] text-slate-300">
                                نمرات دانش‌آموزان به دسته‌های مساوی تقسیم شده‌اند تا ببینید چند درصد کلاس در هر بازه نمره قرار دارند. اگر ستون‌ها در وسط بلندتر باشند، آزمون متعادل بوده؛ اگر به راست گرایش داشته باشند کلاس مسلط بوده و اگر به چپ گرایش داشته باشند نشان‌دهنده نیاز به مرور و آموزش مجدد است.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mb-3">
                          روی هر ستون کلیک کنید تا دانش‌آموزان همان بازه در جدول پایین فیلتر شوند:
                        </p>

                        {/* نمودار میله‌ای بصری توزیع */}
                        <div className="space-y-2 py-2">
                          {analyticsData.bellCurve.map((bin: any) => {
                            const isSelected = selectedBinFilter === bin.binLabel;
                            const maxPct = Math.max(...analyticsData.bellCurve.map((b: any) => b.percentage), 1);
                            const barWidth = Math.max(8, (bin.percentage / maxPct) * 100);

                            return (
                              <div
                                key={bin.binLabel}
                                onClick={() => setSelectedBinFilter(isSelected ? null : bin.binLabel)}
                                className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20"
                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                                }`}
                              >
                                <div className="w-24 text-[11px] font-bold text-slate-700 shrink-0">
                                  نمره {bin.binLabel}:
                                </div>
                                <div className="flex-1 bg-slate-200/80 rounded-full h-4 overflow-hidden relative">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      bin.percentage > 0 ? "bg-gradient-to-r from-indigo-500 to-indigo-600" : "bg-transparent"
                                    }`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                <div className="w-20 text-left text-xs font-black text-slate-800 shrink-0 font-mono">
                                  {bin.count} نفر ({bin.percentage}٪)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {selectedBinFilter && (
                        <div className="mt-2 flex items-center justify-between text-xs bg-indigo-50 text-indigo-700 p-2 rounded-xl">
                          <span>فیلتر فعال: دانش‌آموزان نمره {selectedBinFilter}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBinFilter(null)}
                            className="font-bold underline text-indigo-900"
                          >
                            نمایش همه دانش‌آموزان
                          </button>
                        </div>
                      )}
                    </div>

                    {/* نمودار ۲: نمودار جعبه‌ای چارک‌ها (Box & Whisker Plot) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                            <h4 className="text-xs font-black text-slate-800">
                              نمودار جعبه‌ای چارک‌ها و پراکندگی (محدوده ۵۰٪ میانی کلاس)
                            </h4>
                          </div>

                          {/* راهنمای هاور */}
                          <div className="relative group cursor-pointer">
                            <div className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 font-bold">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>راهنمای نمودار</span>
                            </div>
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1.5 w-72 p-3 bg-slate-900 text-slate-100 text-xs rounded-2xl shadow-2xl z-30 leading-relaxed border border-slate-700">
                              <p className="font-bold text-white mb-1">📦 مفهوم نمودار جعبه‌ای چیست؟</p>
                              <p className="text-[11px] text-slate-300">
                                جعبه وسط نشان می‌دهد ۵۰ درصد دانش‌آموزان حد وسط کلاس چه نمراتی گرفته‌اند (از چارک اول تا چارک سوم). خط عمودی وسط جعبه نمره میانه است. خطوط چپ و راست کران نمرات برتر و ضعیف‌تر را نشان می‌دهند. اگر جعبه باریک باشد نمرات کلاس فشرده و یکدست است.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mb-3">
                          تفکیک آماری سطوح تسلط بر پایه چارک‌های استاندارد (Q1، میانه و Q3):
                        </p>

                        {/* کارت‌های مقادیر ۴ گانه چارک */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div className="text-[10px] text-slate-500 font-bold">چارک اول (Q1)</div>
                            <div className="text-sm font-black text-slate-800 mt-0.5">{analyticsData.quartiles.q1}</div>
                            <div className="text-[9px] text-slate-400">۲۵٪ نمرات پایین‌تر</div>
                          </div>
                          <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200 text-center">
                            <div className="text-[10px] text-teal-700 font-bold">میانه (Q2)</div>
                            <div className="text-sm font-black text-teal-900 mt-0.5">{analyticsData.quartiles.median}</div>
                            <div className="text-[9px] text-teal-600">نقطه وسط کلاس</div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div className="text-[10px] text-slate-500 font-bold">چارک سوم (Q3)</div>
                            <div className="text-sm font-black text-slate-800 mt-0.5">{analyticsData.quartiles.q3}</div>
                            <div className="text-[9px] text-slate-400">۲۵٪ نمرات برتر</div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div className="text-[10px] text-slate-500 font-bold">دامنه میانی (IQR)</div>
                            <div className="text-sm font-black text-slate-800 mt-0.5">{analyticsData.quartiles.iqr}</div>
                            <div className="text-[9px] text-slate-400">فاصله Q3 تا Q1</div>
                          </div>
                        </div>

                        {/* شبیه‌ساز گرافیکی نمودار جعبه‌ای روی خط محور */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                            <span>۰ (حداقل ممکن)</span>
                            <span>{selectedExamDetails.maxScore / 2} (حد نصاب)</span>
                            <span>{selectedExamDetails.maxScore} (سقف)</span>
                          </div>
                          <div className="relative h-6 bg-slate-200 rounded-lg overflow-hidden flex items-center">
                            {/* خط شاخک‌ها */}
                            <div
                              className="absolute h-1 bg-slate-400 rounded-full"
                              style={{
                                right: `${(analyticsData.quartiles.lowerWhisker / selectedExamDetails.maxScore) * 100}%`,
                                left: `${100 - (analyticsData.quartiles.upperWhisker / selectedExamDetails.maxScore) * 100}%`,
                              }}
                            />
                            {/* جعبه IQR */}
                            <div
                              className="absolute h-5 bg-gradient-to-r from-teal-500 to-indigo-500 rounded border border-teal-700 shadow-xs flex items-center justify-center text-[10px] text-white font-black"
                              style={{
                                right: `${(analyticsData.quartiles.q1 / selectedExamDetails.maxScore) * 100}%`,
                                left: `${100 - (analyticsData.quartiles.q3 / selectedExamDetails.maxScore) * 100}%`,
                              }}
                            >
                              ۵۰٪ میانی
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* تحلیل تفسیری متنی */}
                      <div className="mt-3 p-2.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">تحلیل هوشمند توزیع کلاس: </span>
                          <span>{analyticsData.distributionShape.interpretation}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ۴. جدول کامل ریزنمرات دانش‌آموزان به همراه رتبه کلاسی و عملیات */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-black text-slate-800">
                          کارنامه ریزنمرات و رتبه‌بندی دانش‌آموزان کلاس
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                          {filteredStudents.length} دانش‌آموز
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="جستجوی نام یا کدملی..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-xs px-3 py-1.5 pr-8 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-12">رتبه</th>
                            <th className="py-2.5 px-3">دانش‌آموز</th>
                            <th className="py-2.5 px-3 text-center w-28">نمره خام</th>
                            <th className="py-2.5 px-3 text-center w-24">درصد نمره</th>
                            <th className="py-2.5 px-3 text-center w-28">نمره استاندارد</th>
                            <th className="py-2.5 px-3 text-center w-36">وضعیت تسلط</th>
                            <th className="py-2.5 px-3 text-center w-28">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map((std: StudentScoreItem) => (
                            <tr
                              key={std.studentId}
                              className="hover:bg-indigo-50/40 transition cursor-pointer"
                              onClick={() => setInspectStudent(std)}
                            >
                              <td className="py-2.5 px-3 text-center font-black">
                                {std.classRank === 1 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 shadow-2xs">
                                    🥇
                                  </span>
                                ) : std.classRank === 2 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-300 shadow-2xs">
                                    🥈
                                  </span>
                                ) : std.classRank === 3 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-300 shadow-2xs">
                                    🥉
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-mono">{std.classRank}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={std.avatarUrl}
                                    alt={std.fullName}
                                    className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-800">{std.fullName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{std.nationalId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {std.isAbsent ? (
                                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                                    غایب
                                  </span>
                                ) : (
                                  <span className="text-sm font-black text-slate-900 font-mono">
                                    {std.rawScore} <span className="text-[10px] text-slate-400 font-normal">از {selectedExamDetails.maxScore}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-black font-mono">
                                {std.percentage !== null ? `${std.percentage}٪` : "-"}
                              </td>
                              <td className="py-2.5 px-3 text-center text-[11px] font-mono text-slate-600">
                                {std.zScore !== undefined && std.rawScore !== null ? (
                                  <span title="نمره Z (انحراف از میانگین)">
                                    {std.zScore > 0 ? `+${std.zScore}` : std.zScore}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${std.statusColor || "bg-slate-100 text-slate-600"}`}>
                                  {std.statusLabel || "ثبت‌شده"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingScoreStudent(std);
                                    setEditScoreValue(std.rawScore !== null ? String(std.rawScore) : "");
                                    setEditIsAbsent(std.isAbsent);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center justify-center gap-1 mx-auto"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>ویرایش نمره</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <BarChart3 className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">هیچ آزمونی برای نمایش وجود ندارد.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    می‌توانید از تب «ثبت نمره جدید» اولین آزمون خود را به همراه سقف نمره و نمرات دانش‌آموزان ثبت کنید.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("entry")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت اولین نمره برای این کلاس</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* مودال فرعی ۱: کارت تحلیلی فردی دانش‌آموز با کلیک روی ردیف */}
        {/* ========================================================= */}
        {inspectStudent && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={inspectStudent.avatarUrl}
                    alt={inspectStudent.fullName}
                    className="w-10 h-10 rounded-full border border-slate-300 bg-slate-100"
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{inspectStudent.fullName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">کد ملی: {inspectStudent.nationalId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">نمره کسب‌شده:</span>
                  <span className="font-black text-slate-900 text-base">
                    {inspectStudent.rawScore !== null ? inspectStudent.rawScore : "غایب"} از {inspectStudent.maxScore}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">فاصله از میانگین کلاس:</span>
                  <span className={`font-black ${Number(inspectStudent.rawScore) >= (analyticsData?.descriptive?.mean || 0) ? "text-emerald-600" : "text-rose-600"}`}>
                    {inspectStudent.rawScore !== null && analyticsData?.descriptive?.mean
                      ? `${(Number(inspectStudent.rawScore) - analyticsData.descriptive.mean).toFixed(2)} نمره`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">رتبه در کلاس:</span>
                  <span className="font-black text-slate-900">
                    رتبه {inspectStudent.classRank} از {selectedExamDetails?.students?.length || 0} نفر
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">رتبه صدکی:</span>
                  <span className="font-black text-indigo-700">
                    صدک {inspectStudent.percentileRank}٪ (بالاتر از {inspectStudent.percentileRank}٪ همکلاسی‌ها)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">سطح ارزیابی:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${inspectStudent.statusColor || "bg-slate-100"}`}>
                    {inspectStudent.statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const std = inspectStudent;
                    setInspectStudent(null);
                    setEditingScoreStudent(std);
                    setEditScoreValue(std.rawScore !== null ? String(std.rawScore) : "");
                    setEditIsAbsent(std.isAbsent);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش نمره این دانش‌آموز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectStudent(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* مودال فرعی ۲: ویرایش سریع نمره دانش‌آموز */}
        {/* ========================================================= */}
        {editingScoreStudent && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  <span>ویرایش نمره {editingScoreStudent.fullName}</span>
                </h4>
                <button
                  onClick={() => setEditingScoreStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نمره جدید (از {selectedExamDetails?.maxScore}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedExamDetails?.maxScore}
                    step="0.25"
                    disabled={editIsAbsent}
                    value={editScoreValue}
                    onChange={(e) => setEditScoreValue(e.target.value)}
                    className="w-full text-sm font-black text-center py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={editIsAbsent ? "غایب" : "نمره عددی"}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsAbsent(!editIsAbsent);
                      if (!editIsAbsent) setEditScoreValue("");
                    }}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold border transition ${
                      editIsAbsent
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {editIsAbsent ? "وضعیت: غایب است" : "علامت‌گذاری به عنوان غایب"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingScoreStudent(null)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleSaveStudentEdit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>ذخیره تغییر</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
