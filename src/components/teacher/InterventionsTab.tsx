"use client";

import React from "react";
import { AlertTriangle, Send, CheckCircle2, Flame, UserCheck, ShieldAlert } from "lucide-react";
import { StudentData } from "./StudentProfileModal";

interface InterventionsTabProps {
  students: StudentData[];
  onTriggerRemedial: (topicId: string, topicTitle: string, studentName: string) => void;
  onOpenStudentModal: (student: StudentData) => void;
}

export const InterventionsTab: React.FC<InterventionsTabProps> = ({
  students,
  onTriggerRemedial,
  onOpenStudentModal,
}) => {
  // فیلتر کردن دانش‌آموزانی که در یک یا چند مبحث زیر ۶۰٪ هستند یا میانگین پایینی دارند
  const atRiskStudents = students.filter((s) => {
    const hasLowTopic = s.masteryRecords.some((m) => m.percentage < 60);
    return hasLowTopic || s.avgMastery < 60;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* هدر توضیحات صف مداخلات (برگرفته از ایندورا) */}
      <div className="bg-gradient-to-l from-rose-950 via-slate-900 to-slate-900 p-6 rounded-3xl text-white border border-rose-900/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs px-3 py-1 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ماژول پایش و مداخله زودهنگام (Early Warning & Interventions)
          </div>
          <h2 className="text-xl font-bold text-white">صف مداخلات آموزشی (Interventions Queue)</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            سیستم به صورت خودکار دانش‌آموزانی را که در مباحث اخیر دچار افت شده‌اند شناسایی کرده و بسته‌های تمرین جبرانی هدفمند را برای اقدام فوری به شما پیشنهاد می‌دهد.
          </p>
        </div>

        <div className="bg-rose-900/30 border border-rose-700/50 p-4 rounded-2xl text-center shrink-0">
          <span className="text-[11px] text-rose-300 block">دانش‌آموزان نیازمند توجه ویژه</span>
          <span className="text-2xl font-black text-rose-400">{atRiskStudents.length} نفر</span>
        </div>
      </div>

      {/* لیست پرونده‌های نیازمند مداخله یا وضعیت خالی استاندارد */}
      {atRiskStudents.length > 0 ? (
        <div className="space-y-4">
          {atRiskStudents.map((student) => {
            const lowTopics = student.masteryRecords.filter((m) => m.percentage < 60);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-rose-200/80 p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"}
                      alt={student.fullName}
                      className="w-11 h-11 rounded-2xl bg-slate-800 border-2 border-rose-400"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{student.fullName}</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {student.nationalId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        پایه {student.gradeLevel} - {student.major} • میانگین تسلط کل:{" "}
                        <span className="font-bold text-rose-600">{student.avgMastery}٪</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenStudentModal(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> مشاهده پرونده کامل
                  </button>
                </div>

                {/* فهرست مباحث بحرانی این دانش‌آموز */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    مباحث شناسایی‌شده برای مداخله اصلاحی:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {lowTopics.map((top) => (
                      <div
                        key={top.id}
                        className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-rose-900">{top.topicTitle}</div>
                          <div className="text-[11px] text-rose-700 mt-0.5">
                            درصد تسلط ارزیابی‌شده: <span className="font-extrabold">{top.percentage}٪</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onTriggerRemedial(top.topicId, top.topicTitle, student.fullName)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                        >
                          <Send className="w-3 h-3" /> ارسال بسته جبرانی
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State استاندارد طبق انتخاب کاربر در مصاحبه Grill-Me */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800">هیچ دانش‌آموزی در صف وضعیت قرمز قرار ندارد</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            تمامی دانش‌آموزان در وضعیت مطلوب تحصیلی هستند. با ثبت نمرات کوییزها، تکالیف و درصدهای یادگیری، در صورت افت هر دانش‌آموز به زیر ۶۰٪، پرونده او خودکار به این صف اضافه می‌شود.
          </p>
        </div>
      )}
    </div>
  );
};
