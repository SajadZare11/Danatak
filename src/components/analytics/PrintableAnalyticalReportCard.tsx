"use client";

import React from "react";
import { Printer, X, Award, CheckCircle, QrCode } from "lucide-react";

interface SubjectScoreItem {
  subject: string;
  studentScore: number;
  classAverage: number;
  zScore: number;
}

interface StudentAnalyticsData {
  student: {
    fullName: string;
    nationalId: string;
    gradeLevel: number;
    major: string;
    schoolName: string;
  };
  classroom: {
    name: string;
  };
  metrics: {
    gpa: number;
    zScore: number;
    tScore: number;
    taraz: number;
    percentileRank: number;
    classRank: number;
    totalStudents: number;
    totalStudyHours: number;
  };
  subjectRadarData: SubjectScoreItem[];
  strengths: string[];
  weaknesses: string[];
}

interface PrintableAnalyticalReportCardProps {
  data: StudentAnalyticsData;
  onClose?: () => void;
}

export const PrintableAnalyticalReportCard: React.FC<PrintableAnalyticalReportCardProps> = ({
  data,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 flex justify-center items-start print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-4xl w-full p-6 sm:p-10 space-y-6 text-slate-900 print:shadow-none print:border-none print:p-4 print:max-w-none">
        {/* نوار ابزار چاپ غیرچاپی */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
            <span className="text-sm font-bold text-slate-800">
              پیش‌نمایش کارنامه تحلیلی استاندارد A4 (جلسه اولیا و مربیان)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              چاپ یا ذخیره PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* هدر رسمی مدرسه */}
        <div className="border-b-2 border-slate-800 pb-4 space-y-2 text-center relative">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <div className="text-right">
              <div>جمهوری اسلامی ایران</div>
              <div>وزارت آموزش و پرورش</div>
              <div>اداره استعدادهای درخشان (سمپاد)</div>
            </div>
            <div className="text-center space-y-1">
              <div className="font-black text-lg text-slate-900">
                {data.student.schoolName}
              </div>
              <div className="text-xs font-bold text-indigo-700">
                کارنامه تحلیلی و روان‌سنجی عملکرد تحصیلی دانش‌آموز • سامانه داناتک
              </div>
              <div className="text-[11px] text-slate-500">
                سال تحصیلی ۱۴۰۳ - ۱۴۰۴ • ارزشیابی دوره‌ای
              </div>
            </div>
            <div className="text-left space-y-1">
              <div>کد رهگیری: {Math.floor(100000 + Math.random() * 900000)}</div>
              <div>تاریخ صدور: {new Date().toLocaleDateString("fa-IR")}</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700">
                <CheckCircle className="w-3 h-3" /> اصالت دیجیتال
              </div>
            </div>
          </div>
        </div>

        {/* مشخصات دانش‌آموز */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">نام و نام خانوادگی:</span>
            <span className="font-black text-slate-800 text-sm">{data.student.fullName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">کد ملی:</span>
            <span className="font-mono font-bold text-slate-800">{data.student.nationalId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">کلاس و رشته:</span>
            <span className="font-bold text-slate-800">
              {data.classroom.name} (رشته {data.student.major})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">ساعات مطالعه هفتگی:</span>
            <span className="font-bold text-indigo-600">{data.metrics.totalStudyHours} ساعت</span>
          </div>
        </div>

        {/* جدول تراز و نمرات استاندارد روان‌سنجی */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-3.5 rounded-2xl border border-indigo-200">
            <span className="text-xs text-indigo-800 font-bold block">معدل کل ارزشیابی</span>
            <span className="text-2xl font-black text-indigo-900 block mt-1">
              {data.metrics.gpa}
            </span>
            <span className="text-[10px] text-indigo-600">از مقیاس ۲۰ نمره</span>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 p-3.5 rounded-2xl border border-purple-200">
            <span className="text-xs text-purple-800 font-bold block">تراز کل کنکوری</span>
            <span className="text-2xl font-black text-purple-900 block mt-1">
              {data.metrics.taraz}
            </span>
            <span className="text-[10px] text-purple-600">مقیاس سازمان سنجش</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-3.5 rounded-2xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-bold block">رتبه صدکی در پایه</span>
            <span className="text-2xl font-black text-emerald-900 block mt-1">
              {data.metrics.percentileRank}٪
            </span>
            <span className="text-[10px] text-emerald-600">بالاتر از {data.metrics.percentileRank}٪ دانش‌آموزان</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-xs text-amber-800 font-bold block">رتبه کلاسی</span>
            <span className="text-2xl font-black text-amber-900 block mt-1">
              {data.metrics.classRank} <span className="text-xs font-normal text-slate-500">از {data.metrics.totalStudents}</span>
            </span>
            <span className="text-[10px] text-amber-700">نمره Z = {data.metrics.zScore}</span>
          </div>
        </div>

        {/* جدول ریزنمرات و مقایسه با میانگین کلاسی */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3">عنوان درس</th>
                <th className="p-3">نمره دانش‌آموز</th>
                <th className="p-3">میانگین کلاس</th>
                <th className="p-3">اختلاف با میانگین</th>
                <th className="p-3">نمره استاندارد Z</th>
                <th className="p-3">سطح عملکرد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.subjectRadarData.map((sub, idx) => {
                const diff = Number((sub.studentScore - sub.classAverage).toFixed(2));
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{sub.subject}</td>
                    <td className="p-3 font-black text-slate-800">{sub.studentScore}</td>
                    <td className="p-3 text-slate-500">{sub.classAverage}</td>
                    <td className="p-3 font-bold">
                      <span className={diff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{sub.zScore}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.studentScore >= 17
                            ? "bg-emerald-100 text-emerald-800"
                            : sub.studentScore >= 14
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {sub.studentScore >= 17 ? "عالی" : sub.studentScore >= 14 ? "مطلوب" : "نیازمند جبران"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* تحلیل نقاط قوت و ضعف تشخیصی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
            <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              نقاط قوت تحصیلی و مهارتی:
            </span>
            <ul className="list-disc list-inside text-emerald-800 space-y-1 text-[11px]">
              {data.strengths.length > 0 ? (
                data.strengths.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li>پیشرفت عمومی دانش‌آموز متعادل است.</li>
              )}
            </ul>
          </div>

          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
              توصیه‌های بهبود و برنامه جبرانی:
            </span>
            <ul className="list-disc list-inside text-amber-800 space-y-1 text-[11px]">
              {data.weaknesses.length > 0 ? (
                data.weaknesses.map((w, i) => <li key={i}>{w}</li>)
              ) : (
                <li>حفظ استمرار ساعات مطالعه و شرکت منظم در کوئیزهای تثبیتی.</li>
              )}
            </ul>
          </div>
        </div>

        {/* امضاها و تاییدیه */}
        <div className="pt-8 grid grid-cols-3 text-center text-xs text-slate-700 border-t border-slate-200">
          <div className="space-y-6">
            <div>دبیر مربوطه</div>
            <div className="text-[10px] text-slate-400">امضا و تاریخ</div>
          </div>
          <div className="space-y-6">
            <div>مشاور تحصیلی مدرسه</div>
            <div className="text-[10px] text-slate-400">امضا و تاریخ</div>
          </div>
          <div className="space-y-6">
            <div>مدیر دبیرستان و مهر آموزشگاه</div>
            <div className="text-[10px] text-slate-400">امضا و تاریخ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
