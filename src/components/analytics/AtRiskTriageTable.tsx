"use client";

import React, { useState } from "react";
import { AlertCircle, ShieldAlert, ArrowLeft, Send, CheckCircle2, UserCheck, Sparkles } from "lucide-react";

export interface AtRiskStudent {
  studentId: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  rawScore: number;
  zScore: number;
  percentileRank: number;
  severity: "CRITICAL" | "HIGH";
  riskReasons: string[];
}

interface AtRiskTriageTableProps {
  students: AtRiskStudent[];
  onSelectStudent?: (studentId: string) => void;
}

export const AtRiskTriageTable: React.FC<AtRiskTriageTableProps> = ({
  students,
  onSelectStudent,
}) => {
  const [dispatchedInterventions, setDispatchedInterventions] = useState<Record<string, string>>({});

  const handleRemedialTask = (student: AtRiskStudent) => {
    setDispatchedInterventions((prev) => ({
      ...prev,
      [student.userId]: "تکلیف جبرانی تطبیقی صادر شد ⚡",
    }));
  };

  const handleCounselorReferral = (student: AtRiskStudent) => {
    setDispatchedInterventions((prev) => ({
      ...prev,
      [student.userId]: "ارجاع آماری به مشاور ارسال شد 📋",
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200/80 shadow-sm overflow-hidden">
      <div className="p-5 bg-gradient-to-l from-rose-50 to-white border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
              سامانه غربالگری و تریاژ آموزشی (Early Warning Triage)
              <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                {students.length} دانش‌آموز در صف مداخله
              </span>
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              شناسایی خودکار دانش‌آموزان لب مرز افت تحصیلی بر اساس نمره استاندارد $Z \le -1.0$، چارک اول و ساعات مطالعه
            </p>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">هیچ دانش‌آموزی در وضعیت خطر شناسایی نشد</h4>
          <p className="text-xs text-slate-500">
            تمامی دانش‌آموزان کلاس در محدوده طبیعی و بالاتر از چارک اول قرار دارند.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3.5 pr-4 font-bold">نام دانش‌آموز</th>
                <th className="p-3.5 font-bold">نمره ارزشیابی</th>
                <th className="p-3.5 font-bold">نمره Z و صدک</th>
                <th className="p-3.5 font-bold">علل تشخیصی ریسک</th>
                <th className="p-3.5 font-bold">سطح بحران</th>
                <th className="p-3.5 pl-4 font-bold text-center">اقدام مداخله‌ای فوری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const actionStatus = dispatchedInterventions[student.userId];

                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-rose-50/40 transition-colors"
                  >
                    <td className="p-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student.fullName}</div>
                          {onSelectStudent && (
                            <button
                              onClick={() => onSelectStudent(student.studentId)}
                              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              مشاهده پروفایل فردی
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-black text-rose-600 text-sm">
                      {student.rawScore} <span className="text-[10px] text-slate-400 font-normal">از ۲۰</span>
                    </td>

                    <td className="p-3.5 space-y-0.5">
                      <div className="font-mono font-bold text-slate-700">Z = {student.zScore}</div>
                      <div className="text-[10px] text-slate-500">صدک {student.percentileRank}٪</div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="space-y-1">
                        {student.riskReasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 ml-1 mb-1"
                          >
                            <AlertCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          student.severity === "CRITICAL"
                            ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                            : "bg-amber-100 text-amber-900 border-amber-300"
                        }`}
                      >
                        {student.severity === "CRITICAL" ? "بحرانی" : "هشدار شدید"}
                      </span>
                    </td>

                    <td className="p-3.5 pl-4 text-center">
                      {actionStatus ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {actionStatus}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRemedialTask(student)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] transition shadow-sm flex items-center gap-1"
                            title="صدور خودکار تکلیف جبرانی متناسب با مباحث ضعف"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            تکلیف جبرانی
                          </button>
                          <button
                            onClick={() => handleCounselorReferral(student)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition border border-slate-300 flex items-center gap-1"
                            title="ارجاع پرونده به مشاور تحصیلی"
                          >
                            <UserCheck className="w-3 h-3 text-cyan-600" />
                            ارجاع به مشاور
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
