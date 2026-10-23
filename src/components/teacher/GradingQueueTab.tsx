"use client";

import React from "react";
import { CheckSquare, Clock, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

interface SubmissionItem {
  id: string;
  assignmentId: string;
  assignment: {
    title: string;
    maxScore: number;
  };
  student: {
    fullName: string;
    nationalId: string;
  };
  status: string;
}

interface GradingQueueTabProps {
  submissions: SubmissionItem[];
  onOpenGradingDesk: (submissionId: string) => void;
}

export const GradingQueueTab: React.FC<GradingQueueTabProps> = ({
  submissions,
  onOpenGradingDesk,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* هدر صف تصحیح برگه‌ها */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white border border-indigo-900/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            میز یکپارچه ارزیابی و تصحیح (Unified Grading Queue)
          </div>
          <h2 className="text-xl font-bold text-white">صندوق ورودی برگه‌های منتظر تصحیح</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            برگه‌های تشریحی، آزمون‌ها و تکالیف ارسالی دانش‌آموزان از تمامی کلاس‌ها در این صف متمرکز می‌شوند تا بتوانید به سرعت آنها را بررسی و نمره‌گذاری کنید.
          </p>
        </div>

        <div className="bg-indigo-900/30 border border-indigo-700/50 p-4 rounded-2xl text-center shrink-0">
          <span className="text-[11px] text-indigo-300 block">برگه‌های در انتظار بررسی</span>
          <span className="text-2xl font-black text-indigo-400">{submissions.length} برگه</span>
        </div>
      </div>

      {submissions.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">نام دانش‌آموز</th>
                <th className="p-4">عنوان تکلیف / آزمون</th>
                <th className="p-4">بارم کل</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{sub.student.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{sub.student.nationalId}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{sub.assignment.title}</div>
                  </td>
                  <td className="p-4 font-bold text-indigo-700">{sub.assignment.maxScore} نمره</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-200">
                      <Clock className="w-3 h-3" /> در انتظار تصحیح معلم
                    </span>
                  </td>
                  <td className="p-4 text-left">
                    <button
                      type="button"
                      onClick={() => onOpenGradingDesk(sub.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      ورود به میز تصحیح <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State استاندارد */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800">هیچ برگه‌ای در صف تصحیح معطل نمانده است</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            تمامی تکالیف و آزمون‌های ارسالی قبلی تصحیح شده‌اند. به محض اینکه دانش‌آموزی در روزهای بعد پاسخبرگ آنلاین ثبت کند یا عکس برگه ارسال نماید، بلافاصله اینجا ظاهر می‌شود.
          </p>
        </div>
      )}
    </div>
  );
};
