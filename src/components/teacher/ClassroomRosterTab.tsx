"use client";

import React, { useState } from "react";
import {
  Search,
  Users,
  Flame,
  Award,
  BookOpen,
  ArrowLeft,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { StudentData } from "./StudentProfileModal";

interface ClassroomRosterTabProps {
  classroomName: string;
  gradeLevel: number;
  major: string;
  subjects?: string;
  students: StudentData[];
  onSelectStudent: (student: StudentData) => void;
  onOpenBulkModal: () => void;
}

export const ClassroomRosterTab: React.FC<ClassroomRosterTabProps> = ({
  classroomName,
  gradeLevel,
  major,
  subjects,
  students,
  onSelectStudent,
  onOpenBulkModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "atRisk" | "good">("all");

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.includes(searchQuery) || s.nationalId.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === "atRisk") return s.avgMastery < 60;
    if (filterStatus === "good") return s.avgMastery >= 75;
    return true;
  });

  const classAvg =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.avgMastery, 0) / students.length)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* کارت خلاصه کلاس و دکمه عملیات گروهی */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{classroomName}</h2>
              <p className="text-xs text-slate-500">
                پایه {gradeLevel} • رشته {major} • {subjects || "تدریس حسابان ۲ و ریاضی ۳"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">دانش‌آموزان:</span>
            <span className="font-bold text-slate-900">{students.length} نفر</span>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-2xl text-xs">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="text-indigo-700 font-medium">میانگین تسلط کلاس:</span>
            <span className="font-extrabold text-indigo-900">{classAvg}٪</span>
          </div>

          {/* دکمه حیاتی عملیات گروهی مد نظر کاربر */}
          <button
            type="button"
            onClick={onOpenBulkModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Users className="w-4 h-4" /> عملیات گروهی / کل کلاس
          </button>
        </div>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا کد ملی دانش‌آموز..."
            className="w-full text-xs pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterStatus === "all" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            همه ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("atRisk")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterStatus === "atRisk" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"
            }`}
          >
            نیازمند توجه
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("good")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterStatus === "good" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600"
            }`}
          >
            تسلط بالا
          </button>
        </div>
      </div>

      {/* لیست کارت‌های دانش‌آموزان */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStudents.map((student) => {
          const isAtRisk = student.avgMastery < 60;

          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali"}
                      alt={student.fullName}
                      className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-200 group-hover:border-indigo-500 transition"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                        {student.fullName}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        کد ملی: {student.nationalId}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isAtRisk
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {isAtRisk ? (
                      <>
                        <AlertCircle className="w-3 h-3 ml-1 text-rose-500" /> نیازمند تقویت
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1 text-emerald-500" /> تسلط مطلوب
                      </>
                    )}
                  </span>
                </div>

                {/* پیش‌نمایش درصد تسلط و استمرار */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">میانگین تسلط مباحث:</span>
                    <span className="font-extrabold text-indigo-700 text-sm mt-0.5 block">
                      {student.avgMastery}٪
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">استمرار مطالعه:</span>
                    <span className="font-bold text-amber-600 text-sm mt-0.5 flex items-center">
                      <Flame className="w-3.5 h-3.5 ml-1 fill-amber-400 text-amber-400" />
                      {student.streakDays} روز
                    </span>
                  </div>
                </div>

                {student.academicWeaknesses && (
                  <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-800">نقطه ضعف شناسایی‌شده:</span>{" "}
                    {student.academicWeaknesses}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>مشاهده پرونده جامع (۳ تب)</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
