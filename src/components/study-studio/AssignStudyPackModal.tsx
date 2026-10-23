"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  Target,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";

interface ClassroomOption {
  id: string;
  name: string;
  gradeLevel: number;
  major: string;
  students: Array<{
    id: string;
    fullName: string;
    nationalId: string;
    avatarUrl?: string | null;
  }>;
}

interface AssignStudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyPackId: string;
  studyPackTitle: string;
  topicTag?: string;
  onAssigned?: () => void;
}

export const AssignStudyPackModal: React.FC<AssignStudyPackModalProps> = ({
  isOpen,
  onClose,
  studyPackId,
  studyPackTitle,
  topicTag = "عمومی",
  onAssigned,
}) => {
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // فرم
  const [assignmentMode, setAssignmentMode] = useState<"class" | "students">("class");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [minMasteryScore, setMinMasteryScore] = useState<number>(80);
  const [instructions, setInstructions] = useState<string>(
    `لطفاً تا پیش از مهلت مقرر، فلش‌کارت‌های این بسته را مرور کرده و در کوییز تشخیصی شرکت کنید تا به درصد تسلط حداقل ۸۰٪ دست یابید.`
  );

  // تاریخ مهلت (پیش‌فرض ۷ روز بعد)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const [dueDateString, setDueDateString] = useState<string>(
    defaultDueDate.toISOString().split("T")[0]
  );

  useEffect(() => {
    if (isOpen) {
      fetchClassrooms();
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-studio/assignments?classrooms=true");
      const data = await res.json();
      if (data.success && data.classrooms) {
        setClassrooms(data.classrooms);
        if (data.classrooms.length > 0) {
          setSelectedClassroomId(data.classrooms[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading classrooms for assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentClassroom = classrooms.find((c) => c.id === selectedClassroomId);

  const toggleStudentSelection = (sId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const selectAllStudentsInClass = () => {
    if (!currentClassroom) return;
    const allIds = currentClassroom.students.map((s) => s.id);
    setSelectedStudentIds(allIds);
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleQuickPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDateString(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        studyPackId,
        classroomId: selectedClassroomId,
        dueDate: new Date(dueDateString).toISOString(),
        minMasteryScore,
        instructions,
      };

      if (assignmentMode === "students") {
        if (selectedStudentIds.length === 0) {
          setErrorMsg("لطفاً حداقل یک دانش‌آموز را انتخاب کنید.");
          setSubmitting(false);
          return;
        }
        payload.studentIds = selectedStudentIds;
      }

      const res = await fetch("/api/study-studio/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "تکلیف با موفقیت ابلاغ شد.");
        if (onAssigned) onAssigned();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || "خطا در ثبت تکلیف");
      }
    } catch (err: any) {
      setErrorMsg("خطا در برقراری ارتباط با سرور: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* هدر مدال */}
        <div className="px-6 py-4 bg-gradient-to-l from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-black">ابلاغ تکلیف استودیو به دانش‌آموزان (MagicSchool)</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                بسته: <span className="font-bold text-white">{studyPackTitle}</span> ({topicTag})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوای فرم */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2.5 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-center gap-2.5 font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* نوع تخصیص: کل کلاس یا دانش‌آموزان برگزیده */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">مخاطبان تکلیف:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAssignmentMode("class")}
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right ${
                  assignmentMode === "class"
                    ? "bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div>کل دانش‌آموزان کلاس</div>
                  <div className="text-[10px] text-slate-400 font-normal">ابلاغ همگانی به همه افراد کلاس</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode("students")}
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right ${
                  assignmentMode === "students"
                    ? "bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div>دانش‌آموزان هدفمند / جبرانی</div>
                  <div className="text-[10px] text-slate-400 font-normal">انتخاب چند نفر بر اساس نیاز تحصیلی</div>
                </div>
              </button>
            </div>
          </div>

          {/* انتخاب کلاس */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">انتخاب کلاس درس:</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => {
                setSelectedClassroomId(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.students.length} دانش‌آموز)
                </option>
              ))}
            </select>
          </div>

          {/* اگر حالت دانش‌آموزان انتخابی فعال باشد */}
          {assignmentMode === "students" && currentClassroom && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  انتخاب دانش‌آموزان ({selectedStudentIds.length} نفر انتخاب شده):
                </span>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllStudentsInClass}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    انتخاب همه
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={deselectAllStudents}
                    className="text-slate-500 hover:underline"
                  >
                    لغو همه
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-2">
                {currentClassroom.students.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? "bg-indigo-100/70 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                        <span>{student.fullName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{student.nationalId}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* حداقل درصد تسلط الزامی (Target Mastery Score) */}
          <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                حداقل درصد تسلط هدف برای قبولی در این تکلیف:
              </label>
              <span className="font-mono font-black text-amber-800 text-sm bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                {minMasteryScore}٪
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={minMasteryScore}
              onChange={(e) => setMinMasteryScore(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-amber-700">
              <span>۵۰٪ (آشنایی اولیه)</span>
              <span>۷۵٪ (تسلط استاندارد)</span>
              <span>۸۵٪+ (تسلط عمیق کنکوری)</span>
            </div>
          </div>

          {/* مهلت انجام تکلیف (Due Date) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                مهلت ارسال و تحویل (تاریخ شمسی / میلادی):
              </label>
              {/* میانبرهای سریع زمان */}
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleQuickPresetDays(3)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                >
                  ۳ روز دیگر
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetDays(7)}
                  className="px-2 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded font-bold"
                >
                  یک هفته بعد
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetDays(14)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                >
                  دو هفته بعد
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDateString}
              onChange={(e) => setDueDateString(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* یادداشت و راهنمای دبیر */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              توضیحات و راهنمای دبیر برای دانش‌آموز:
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              placeholder="نکات مهم قبل از شروع آزمون یا مرور..."
            />
          </div>

          {/* دکمه‌های پایین مدال */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-black shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ثبت و ابلاغ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ابلاغ رسمی تکلیف استودیو</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
