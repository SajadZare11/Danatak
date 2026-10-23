"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  GraduationCap,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  UserCheck,
} from "lucide-react";

interface SubjectGradeItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  term1Continuous: number;
  term1Final: number;
  term2Continuous: number;
  term2Final: number;
  annualScore: number;
  descriptiveEvaluation: string;
  status: string;
}

interface ReportCardData {
  student: {
    id: string;
    fullName: string;
    nationalId: string;
    avatarUrl?: string;
    gradeLevel: number;
    major: string;
    schoolName: string;
    schoolCode: string;
    className: string;
    academicYear: string;
  };
  subjects: SubjectGradeItem[];
  summary: {
    gpa: number;
    overallDescriptive: string;
    conductScore: number;
    attendance: {
      totalSessions: number;
      presents: number;
      absents: number;
      lates: number;
    };
    passResult: string;
  };
}

interface OfficialReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export const OfficialReportCardModal: React.FC<OfficialReportCardModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"NUMERIC" | "DESCRIPTIVE">("NUMERIC");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/report-card${studentId ? `?studentId=${studentId}` : ""}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report card:", err);
        setLoading(false);
      });
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col border border-slate-300 overflow-hidden print:m-0 print:border-none print:shadow-none print:max-w-full">
        {/* نوار ابزار بالا (در حالت پرینت مخفی می‌شود) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold">سامانه رسمی صدور کارنامه هوشمند مدارس</span>
          </div>

          <div className="flex items-center gap-3">
            {/* انتخاب حالت کارنامه */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setMode("NUMERIC")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mode === "NUMERIC" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                متوسطه (نظام نمره‌ای ۰ تا ۲۰)
              </button>
              <button
                type="button"
                onClick={() => setMode("DESCRIPTIVE")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mode === "DESCRIPTIVE" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ابتدایی (نظام توصیفی کیفی)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              چاپ کارنامه (PDF)
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوای کارنامه رسمی (محتوای چاپی A4) */}
        <div className="p-8 bg-white text-slate-900 flex-1">
          {loading || !data ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              در حال آماده‌سازی و استخراج کارنامه رسمی آموزش و پرورش...
            </div>
          ) : (
            <div className="border-2 border-slate-800 rounded-xl p-6 relative">
              {/* هدر رسمی کارنامه */}
              <div className="border-b-2 border-slate-800 pb-4 text-center relative">
                <div className="absolute right-2 top-0 text-right text-[11px] text-slate-600 leading-tight">
                  <p>جمهوری اسلامی ایران</p>
                  <p>وزارت آموزش و پرورش</p>
                  <p>اداره کل آموزش و پرورش شهر تهران</p>
                  <p className="font-mono mt-0.5">کد مدرسه: {data.student.schoolCode}</p>
                </div>

                <div className="inline-block text-center">
                  <div className="w-12 h-12 mx-auto mb-1 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-slate-700">
                    الله
                  </div>
                  <h2 className="text-base font-black tracking-tight text-slate-900">
                    {data.student.schoolName}
                  </h2>
                  <h3 className="text-sm font-bold text-indigo-900 mt-0.5">
                    کارنامه رسمی پیشرفت تحصیلی و تربیتی ({mode === "NUMERIC" ? "دوره دوم متوسطه" : "دوره ابتدایی"})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">سال تحصیلی {data.student.academicYear}</p>
                </div>

                <div className="absolute left-2 top-0 text-left text-[11px] text-slate-600 leading-tight">
                  <p>تاریخ صدور: {new Date().toLocaleDateString("fa-IR")}</p>
                  <p>نوبت: خرداد ماه (پایانی)</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-300">
                    {data.summary.passResult}
                  </span>
                </div>
              </div>

              {/* مشخصات هویتی دانش‌آموز */}
              <div className="grid grid-cols-4 gap-3 my-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500">نام و نام خانوادگی: </span>
                  <span className="font-black text-slate-900">{data.student.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500">کد ملی: </span>
                  <span className="font-bold font-mono text-slate-900">{data.student.nationalId}</span>
                </div>
                <div>
                  <span className="text-slate-500">پایه و رشته: </span>
                  <span className="font-bold text-slate-900">
                    پایه {data.student.gradeLevel} - رشته {data.student.major}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">کلاس: </span>
                  <span className="font-bold text-slate-900">{data.student.className}</span>
                </div>
              </div>

              {/* جدول نمرات دروس */}
              <div className="overflow-x-auto my-4 border border-slate-800 rounded-lg">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-800 font-black text-slate-900">
                    <tr>
                      <th className="py-2.5 px-3 border-l border-slate-400">ردیف</th>
                      <th className="py-2.5 px-4 border-l border-slate-400 text-right">عنوان درس</th>
                      {mode === "NUMERIC" ? (
                        <>
                          <th className="py-2.5 px-2 border-l border-slate-400">مستمر ۱</th>
                          <th className="py-2.5 px-2 border-l border-slate-400">پایانی ۱</th>
                          <th className="py-2.5 px-2 border-l border-slate-400">مستمر ۲</th>
                          <th className="py-2.5 px-2 border-l border-slate-400">پایانی ۲</th>
                          <th className="py-2.5 px-3 border-l border-slate-400 bg-indigo-50/60 font-black">نمره سالانه</th>
                          <th className="py-2.5 px-3 border-l border-slate-400">ارزشیابی توصیفی</th>
                          <th className="py-2.5 px-3">وضعیت</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2.5 px-4 border-l border-slate-400 bg-indigo-50/60 font-black">سطح دستیابی به اهداف (ارزشیابی کیفی)</th>
                          <th className="py-2.5 px-6">توصیف عملکرد و رهنمود معلم</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {data.subjects.map((sub, idx) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 border-l border-slate-300 font-bold">{idx + 1}</td>
                        <td className="py-2 px-4 border-l border-slate-300 text-right font-black text-slate-900">
                          {sub.subjectName}
                        </td>
                        {mode === "NUMERIC" ? (
                          <>
                            <td className="py-2 px-2 border-l border-slate-300 font-mono">{sub.term1Continuous}</td>
                            <td className="py-2 px-2 border-l border-slate-300 font-mono">{sub.term1Final}</td>
                            <td className="py-2 px-2 border-l border-slate-300 font-mono">{sub.term2Continuous}</td>
                            <td className="py-2 px-2 border-l border-slate-300 font-mono">{sub.term2Final}</td>
                            <td className="py-2 px-3 border-l border-slate-300 font-black font-mono bg-indigo-50/40 text-indigo-900">
                              {sub.annualScore}
                            </td>
                            <td className="py-2 px-3 border-l border-slate-300 font-bold text-slate-700">
                              {sub.descriptiveEvaluation}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.annualScore >= 10
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-4 border-l border-slate-300 font-black text-indigo-950 bg-indigo-50/40">
                              {sub.descriptiveEvaluation}
                            </td>
                            <td className="py-2 px-6 text-right text-slate-600 text-[11px]">
                              دانش‌آموز با علاقه و پشتکار به اهداف آموزشی این سرفصل دست یافته و مفاهیم اصلی را به خوبی تحلیل می‌کند.
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* خلاصه معدل، انضباط و حضور و غیاب */}
              <div className="grid grid-cols-3 gap-4 my-4 p-4 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">
                    معدل کتبی سالانه:{" "}
                    <span className="font-black text-indigo-900 text-sm font-mono">{data.summary.gpa}</span>
                    <span className="text-slate-500 text-[11px] mr-1.5">({data.summary.overallDescriptive})</span>
                  </p>
                  <p className="font-bold text-slate-700">
                    نمره انضباط و اخلاق:{" "}
                    <span className="font-black text-emerald-700 text-sm font-mono">{data.summary.conductScore}</span>
                  </p>
                </div>

                <div className="space-y-1 border-r border-slate-300 pr-4">
                  <p className="text-slate-600 font-medium">وضعیت حضور و غیاب در طول سال:</p>
                  <p className="text-[11px] text-slate-700 font-bold">
                    حاضر: {data.summary.attendance.presents} جلسه • غایب: {data.summary.attendance.absents} جلسه • تاخیر: {data.summary.attendance.lates} جلسه
                  </p>
                </div>

                <div className="flex items-center justify-end border-r border-slate-300 pr-4">
                  <div className="text-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-500 block">نتیجه نهایی شورا</span>
                    <span className="text-sm font-black text-emerald-700">{data.summary.passResult}</span>
                  </div>
                </div>
              </div>

              {/* کادر امضاها و مهرهای رسمی */}
              <div className="grid grid-cols-3 gap-6 pt-8 pb-4 text-center text-xs text-slate-700">
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold">دبیر مربوطه / راهنمای آموزشی</p>
                  <p className="text-[10px] text-slate-400 mt-1">استاد احسان محمدی</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold">مشاور پایه و تربیتی</p>
                  <p className="text-[10px] text-slate-400 mt-1">خانم مریم صابری</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold">مدیر دبیرستان و مهر رسمی مدرسه</p>
                  <p className="text-[10px] text-slate-400 mt-1">دکتر مسعود حسینی</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
