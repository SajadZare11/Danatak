"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Plus,
  BookOpen,
  GraduationCap,
  Users,
  FileSpreadsheet,
  Check,
  Search,
  Trash2,
  Sparkles,
  Layers,
  Upload,
  AlertCircle,
  Building,
} from "lucide-react";

export interface AvailableStudentItem {
  id: string;
  userId?: string;
  fullName: string;
  nationalId: string;
  phoneNumber?: string | null;
  gradeLevel?: number;
  major?: string;
}

export interface TextbookOption {
  id: string;
  title: string;
  gradeLevel: number;
}

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClassroomId: string, message: string) => void;
  availableStudents?: AvailableStudentItem[];
  allTextbooks?: TextbookOption[];
  teacherSchoolName?: string;
}

export const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableStudents = [],
  allTextbooks = [],
  teacherSchoolName = "دبیرستان علامه حلی ۱",
}) => {
  // ۱. فرم مشخصات پایه کلاس
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(12);
  const [major, setMajor] = useState<string>("ریاضی و فیزیک");
  const [subjectsText, setSubjectsText] = useState("");
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([]);

  // ۲. مدیریت دانش‌آموزان
  const [studentMode, setStudentMode] = useState<"existing" | "manual" | "excel">("existing");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // دانش‌آموزان دستی و اکسل
  const [newStudentsList, setNewStudentsList] = useState<
    Array<{ fullName: string; nationalId: string; phoneNumber?: string }>
  >([]);
  const [manualName, setManualName] = useState("");
  const [manualNationalId, setManualNationalId] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  // وضعیت اکسل
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelCount, setExcelCount] = useState<number>(0);

  // وضعیت ارسال
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // فیلتر کتاب‌های درسی بر اساس پایه
  const suggestedTextbooks = useMemo(() => {
    return allTextbooks.filter((tb) => tb.gradeLevel === gradeLevel);
  }, [allTextbooks, gradeLevel]);

  // اعمال تغییر خودکار عنوان دروس هنگام کلیک روی کتاب‌های پیشنهادی
  const handleToggleTextbook = (tbTitle: string, tbId: string) => {
    let nextIds: string[];
    if (selectedTextbookIds.includes(tbId)) {
      nextIds = selectedTextbookIds.filter((id) => id !== tbId);
    } else {
      nextIds = [...selectedTextbookIds, tbId];
    }
    setSelectedTextbookIds(nextIds);

    const chosenTitles = allTextbooks
      .filter((t) => nextIds.includes(t.id))
      .map((t) => t.title);

    if (chosenTitles.length > 0) {
      setSubjectsText("تدریس " + chosenTitles.join(" و "));
    }
  };

  // فیلتر دانش‌آموزان موجود بر اساس جستجو
  const filteredAvailableStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return availableStudents;
    const q = studentSearchQuery.trim().toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.nationalId.toLowerCase().includes(q)
    );
  }, [availableStudents, studentSearchQuery]);

  // تاگل انتخاب دانش‌آموز از سیستم
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredAvailableStudents.map((s) => s.id);
    const allSelected = ids.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  // افزودن دستی دانش‌آموز
  const handleAddManualStudent = () => {
    if (!manualName.trim()) {
      setErrorMessage("نام و نام خانوادگی دانش‌آموز الزامی است.");
      return;
    }
    setNewStudentsList((prev) => [
      ...prev,
      {
        fullName: manualName.trim(),
        nationalId: manualNationalId.trim(),
        phoneNumber: manualPhone.trim() || undefined,
      },
    ]);
    setManualName("");
    setManualNationalId("");
    setManualPhone("");
    setErrorMessage(null);
  };

  const handleRemoveManualStudent = (index: number) => {
    setNewStudentsList((prev) => prev.filter((_, i) => i !== index));
  };

  // پارس فایل اکسل
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (json.length < 2) {
          setErrorMessage("فایل اکسل خالی است یا ساختار استانداردی ندارد.");
          return;
        }

        const headers: string[] = (json[0] || []).map((h: any) =>
          String(h).trim()
        );

        // یافتن ایندکس ستون‌ها
        let nameIdx = headers.findIndex((h) =>
          h.includes("نام") || h.includes("دانش") || h.includes("name")
        );
        let idIdx = headers.findIndex((h) =>
          h.includes("ملی") || h.includes("کد") || h.includes("id")
        );
        let phoneIdx = headers.findIndex((h) =>
          h.includes("تلفن") || h.includes("تماس") || h.includes("موبایل") || h.includes("phone")
        );

        if (nameIdx === -1) nameIdx = 0;
        if (idIdx === -1) idIdx = 1;

        const parsedRows: Array<{ fullName: string; nationalId: string; phoneNumber?: string }> = [];

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;
          const fullName = String(row[nameIdx] || "").trim();
          const nationalId = String(row[idIdx] || "").trim();
          const phoneNumber = phoneIdx !== -1 ? String(row[phoneIdx] || "").trim() : undefined;

          if (fullName) {
            parsedRows.push({ fullName, nationalId, phoneNumber });
          }
        }

        setNewStudentsList((prev) => [...prev, ...parsedRows]);
        setExcelCount(parsedRows.length);
        setErrorMessage(null);
      } catch (err: any) {
        console.error(err);
        setErrorMessage("خطا در خواندن فایل اکسل: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ارسال فرم به سرور
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("لطفاً نام کلاس را وارد کنید.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/teacher/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gradeLevel,
          major,
          subjects: subjectsText.trim() || undefined,
          selectedStudentIds,
          newStudents: newStudentsList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ایجاد کلاس");
      }

      onSuccess(data.classroomId, data.message || "کلاس با موفقیت ایجاد گردید.");
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "خطای غیرمنتظره در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalAssignedStudents = selectedStudentIds.length + newStudentsList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* سربرگ مودال */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/90 flex items-center justify-center text-white shadow-md">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">افزودن کلاس جدید</h2>
              <p className="text-[11px] text-indigo-200 font-medium">
                تعریف پایه، رشته، دروس تدریسی و تخصیص لیست دانش‌آموزان
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* خطای اعلان */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* بدنه اسکرول‌پذیر فرم */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* بخش ۱: مشخصات پایه کلاس */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 border-b border-slate-200 pb-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>۱. مشخصات پایه و هویت کلاس</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* نام کلاس */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام کلاس <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: کلاس ۱۱/۲ (یازدهم تجربی ب) یا دهم ریاضی ۱"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {/* پایه تحصیلی */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پایه تحصیلی <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value={10}>پایه دهم (متوسطه دوم)</option>
                  <option value={11}>پایه یازدهم (متوسطه دوم)</option>
                  <option value={12}>پایه دوازدهم (متوسطه دوم)</option>
                </select>
              </div>

              {/* رشته تحصیلی */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رشته تحصیلی <span className="text-rose-500">*</span>
                </label>
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                  <option value="علوم تجربی">علوم تجربی</option>
                  <option value="علوم انسانی">علوم انسانی</option>
                  <option value="علوم و معارف اسلامی">علوم و معارف اسلامی</option>
                  <option value="فنی و حرفه‌ای">فنی و حرفه‌ای</option>
                </select>
              </div>

              {/* نام مدرسه */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مدرسه / مرکز</label>
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-200/60 border border-slate-300 text-slate-700 text-xs font-bold truncate">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{teacherSchoolName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* بخش ۲: دروس و کتاب‌های تدریسی */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>۲. دروس و کتاب‌های تدریسی در این کلاس</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                پیشنهاد هوشمند بر اساس پایه {gradeLevel}
              </span>
            </div>

            {/* چیپ‌های کتاب‌های درسی پیشنهادی */}
            {suggestedTextbooks.length > 0 && (
              <div>
                <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  کتاب‌های درسی استاندارد سامانه (برای انتخاب کلیک کنید):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTextbooks.map((tb) => {
                    const isSelected = selectedTextbookIds.includes(tb.id);
                    return (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => handleToggleTextbook(tb.title, tb.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-700 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-teal-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{tb.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* فیلد متن دلخواه عنوان درس */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان رسمی یا دلخواه درس‌ها (در سربرگ و کارنامه):
              </label>
              <input
                type="text"
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                placeholder="مثلاً: تدریس حسابان ۲ و ریاضی ۳ یا فیزیک پایه"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* بخش ۳: تخصیص دانش‌آموزان به کلاس (سیستم ترکیبی) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>۳. دانش‌آموزان این کلاس</span>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {totalAssignedStudents} نفر انتخاب‌شده
              </span>
            </div>

            {/* تب‌های شیوه افزودن دانش‌آموز */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStudentMode("existing")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  studentMode === "existing"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                انتخاب از سامانه ({availableStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setStudentMode("manual")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  studentMode === "manual"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ثبت دستی ({newStudentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setStudentMode("excel")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  studentMode === "excel"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                بارگذاری اکسل سیدا
              </button>
            </div>

            {/* تب ۱: انتخاب از سیستم */}
            {studentMode === "existing" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="جستجوی نام یا کد ملی دانش‌آموز..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition shrink-0"
                  >
                    انتخاب همه
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-white rounded-xl border border-slate-200">
                  {filteredAvailableStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      دانش‌آموزی با این مشخصات یافت نشد.
                    </div>
                  ) : (
                    filteredAvailableStudents.map((st) => {
                      const isChecked = selectedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleToggleStudent(st.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                            isChecked
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                            />
                            <div>
                              <span className="text-xs font-bold block">{st.fullName}</span>
                              <span className="text-[10px] text-slate-500">
                                کد ملی: {st.nationalId} {st.major ? `• ${st.major}` : ""}
                              </span>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              عضو کلاس
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* تب ۲: ثبت دستی */}
            {studentMode === "manual" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="نام و نام خانوادگی *"
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={manualNationalId}
                    onChange={(e) => setManualNationalId(e.target.value)}
                    placeholder="کد ملی (اختیاری)"
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="شماره موبایل"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualStudent}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                    >
                      افزودن
                    </button>
                  </div>
                </div>

                {newStudentsList.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 bg-white rounded-xl border border-slate-200">
                    {newStudentsList.map((ns, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{ns.fullName}</span>
                          <span className="text-[10px] text-slate-500">
                            کد ملی: {ns.nationalId || "تولید خودکار"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveManualStudent(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تب ۳: بارگذاری فایل اکسل سیدا */}
            {studentMode === "excel" && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center bg-white transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      {excelFileName ? (
                        <span className="text-emerald-700">فایل انتخاب شد: {excelFileName}</span>
                      ) : (
                        "کلیک کنید یا فایل اکسل خروجی سیدا را اینجا رها کنید"
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      پشتیبانی از فایل‌های استاندارد اکسل سیدا (.xlsx) با ستون‌های نام و کد ملی
                    </p>
                  </div>
                </div>

                {excelCount > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <span>✓ تعداد {excelCount} دانش‌آموز از فایل اکسل استخراج شد.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFileName(null);
                        setExcelCount(0);
                      }}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      پاک کردن
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* پاورقی دکمه‌های اقدام */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{submitting ? "در حال ایجاد کلاس..." : "ثبت و ایجاد کلاس"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
