"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";

interface SidaStudentGrade {
  id: string;
  rowNumber: number;
  fullName: string;
  nationalId: string;
  avatarUrl?: string;
  term1Continuous: number;
  term1Final: number;
  term2Continuous: number;
  term2Final: number;
  annualScore: number;
  descriptiveEvaluation: string;
  conductScore: number;
  unexcusedAbsences: number;
  passStatus: string;
}

interface SidaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassroomId?: string;
  initialSubjectId?: string;
}

export const SidaManagerModal: React.FC<SidaManagerModalProps> = ({
  isOpen,
  onClose,
  initialClassroomId,
  initialSubjectId,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [classroomId, setClassroomId] = useState(initialClassroomId || "");
  const [subjectId, setSubjectId] = useState(initialSubjectId || "");

  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [grades, setGrades] = useState<SidaStudentGrade[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const url = `/api/sida/grades?classroomId=${classroomId}&subjectId=${subjectId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGrades(data.grades || []);
        setClassrooms(data.classrooms || []);
        setSubjects(data.subjects || []);
        if (!classroomId && data.currentClassroom) setClassroomId(data.currentClassroom.id);
        if (!subjectId && data.currentSubject) setSubjectId(data.currentSubject.id);
      }
    } catch (err) {
      console.error("Failed to load Sida grades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGrades();
    }
  }, [isOpen, classroomId, subjectId]);

  if (!isOpen) return null;

  const handleGradeChange = (
    studentId: string,
    field: "term1Continuous" | "term1Final" | "term2Continuous" | "term2Final" | "conductScore" | "unexcusedAbsences",
    val: number
  ) => {
    setGrades((prev) =>
      prev.map((g) => {
        if (g.id !== studentId) return g;
        const updated = { ...g, [field]: val };
        // محاسبه مجدد نمره سالانه استاندارد
        const annual = Number(
          (
            (updated.term1Continuous * 1 +
              updated.term1Final * 2 +
              updated.term2Continuous * 1 +
              updated.term2Final * 4) /
            8
          ).toFixed(2)
        );
        let desc = "خیلی خوب";
        if (annual >= 18) desc = "خیلی خوب";
        else if (annual >= 15) desc = "خوب";
        else if (annual >= 10) desc = "قابل قبول";
        else desc = "نیاز به آموزش و تلاش بیشتر";

        return {
          ...updated,
          annualScore: annual,
          descriptiveEvaluation: desc,
          passStatus: annual >= 10 ? "قبول" : "تجدید",
        };
      })
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/sida/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          subjectId,
          grades: grades.map((g) => ({
            studentId: g.id,
            term1Continuous: g.term1Continuous,
            term1Final: g.term1Final,
            term2Continuous: g.term2Continuous,
            term2Final: g.term2Final,
            conductScore: g.conductScore,
            unexcusedAbsences: g.unexcusedAbsences,
          })),
        }),
      });

      if (res.ok) {
        setSuccessToast("نمرات رسمی با موفقیت ذخیره شد و فایل خروجی سیدا به‌روزرسانی گردید.");
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save Sida grades:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExcel = () => {
    setDownloading(true);
    window.location.href = `/api/sida/export?classroomId=${classroomId}&subjectId=${subjectId}`;
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* هدر مدال */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">سامانه ارتباطی سیدا (sida.medu.ir)</h3>
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                  آموزش و پرورش
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                تولید خروجی استاندارد اکسل سیدا جهت ورود گروهی نمرات مستمر، پایانی و انضباط با ۱ کلیک
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فیلترهای بالا و اکشن دانلود */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">انتخاب کلاس:</label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">انتخاب درس:</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                قالب استاندارد وزارت آموزش و پرورش
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving || loading}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات نمرات"}
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloading || loading}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? "در حال دریافت فایل..." : "دانلود فایل اکسل سیدا (.xlsx)"}
            </button>
          </div>
        </div>

        {/* پیام موفقیت */}
        {successToast && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successToast}
          </div>
        )}

        {/* جدول پیش‌نمایش و ویرایش نمرات سیدا */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              در حال استخراج لیست نمرات و تطبیق با سیدا...
            </div>
          ) : grades.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              دانش‌آموزی برای این کلاس یا درس یافت نشد.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="py-3 px-2 border-l border-slate-200">ردیف</th>
                    <th className="py-3 px-3 border-l border-slate-200">کد ملی</th>
                    <th className="py-3 px-4 border-l border-slate-200 text-right">نام و نام خانوادگی</th>
                    <th className="py-3 px-2 border-l border-slate-200 bg-blue-50/50">مستمر ۱</th>
                    <th className="py-3 px-2 border-l border-slate-200 bg-blue-50/50">پایانی ۱</th>
                    <th className="py-3 px-2 border-l border-slate-200 bg-indigo-50/50">مستمر ۲</th>
                    <th className="py-3 px-2 border-l border-slate-200 bg-indigo-50/50">پایانی ۲</th>
                    <th className="py-3 px-2 border-l border-slate-200 bg-emerald-50 font-black">سالانه</th>
                    <th className="py-3 px-3 border-l border-slate-200">ارزشیابی توصیفی</th>
                    <th className="py-3 px-2 border-l border-slate-200">انضباط</th>
                    <th className="py-3 px-2 border-l border-slate-200">غیبت</th>
                    <th className="py-3 px-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-2 border-l border-slate-100 font-bold text-slate-400">
                        {item.rowNumber}
                      </td>
                      <td className="py-2.5 px-3 border-l border-slate-100 font-mono text-slate-600">
                        {item.nationalId}
                      </td>
                      <td className="py-2.5 px-4 border-l border-slate-100 text-right font-black text-slate-900">
                        {item.fullName}
                      </td>

                      {/* مستمر ۱ */}
                      <td className="py-2 px-1 border-l border-slate-100 bg-blue-50/30">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={item.term1Continuous}
                          onChange={(e) =>
                            handleGradeChange(item.id, "term1Continuous", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 py-1 text-center font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* پایانی ۱ */}
                      <td className="py-2 px-1 border-l border-slate-100 bg-blue-50/30">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={item.term1Final}
                          onChange={(e) =>
                            handleGradeChange(item.id, "term1Final", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 py-1 text-center font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* مستمر ۲ */}
                      <td className="py-2 px-1 border-l border-slate-100 bg-indigo-50/30">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={item.term2Continuous}
                          onChange={(e) =>
                            handleGradeChange(item.id, "term2Continuous", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 py-1 text-center font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* پایانی ۲ */}
                      <td className="py-2 px-1 border-l border-slate-100 bg-indigo-50/30">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={item.term2Final}
                          onChange={(e) =>
                            handleGradeChange(item.id, "term2Final", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 py-1 text-center font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* سالانه */}
                      <td className="py-2.5 px-2 border-l border-slate-100 bg-emerald-50/50 font-black font-mono text-emerald-950">
                        {item.annualScore}
                      </td>

                      {/* ارزشیابی توصیفی */}
                      <td className="py-2.5 px-3 border-l border-slate-100 text-[11px] font-bold text-slate-700">
                        {item.descriptiveEvaluation}
                      </td>

                      {/* انضباط */}
                      <td className="py-2 px-1 border-l border-slate-100">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={item.conductScore}
                          onChange={(e) =>
                            handleGradeChange(item.id, "conductScore", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 py-1 text-center font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* غیبت */}
                      <td className="py-2 px-1 border-l border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={item.unexcusedAbsences}
                          onChange={(e) =>
                            handleGradeChange(item.id, "unexcusedAbsences", parseInt(e.target.value) || 0)
                          }
                          className="w-12 py-1 text-center font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* وضعیت قبولی */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.passStatus === "قبول"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.passStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* فوتر مدال */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            فرمت فایل خروجی کاملاً بر اساس قالب اکسل ماژول «ورود نمرات» سامانه سیدای وزارت آموزش و پرورش طراحی شده است.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              دانلود فایل اکسل سیدا
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
