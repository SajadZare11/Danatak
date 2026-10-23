"use client";

import React, { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import {
  BookMarked,
  Download,
  Eye,
  FileText,
  Search,
  Filter,
  Plus,
  BookOpen,
  Sparkles,
  ArrowRight,
  X,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function DigitalLibraryPage() {
  const { currentRole, currentUser } = useRole();

  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // فیلترها
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // نمایشگر آنلاین PDF
  const [previewResource, setPreviewResource] = useState<any | null>(null);

  // مودال آپلود جزوه جدید
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("TEACHER_NOTES");
  const [newGrade, setNewGrade] = useState("12");
  const [newMajor, setNewMajor] = useState("ریاضی");
  const [newSubject, setNewSubject] = useState("حسابان");
  const [newDescription, setNewDescription] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedGrade) q.set("gradeLevel", selectedGrade);
      if (selectedCategory !== "ALL") q.set("category", selectedCategory);
      if (selectedSubject !== "ALL") q.set("subjectName", selectedSubject);
      if (searchTerm) q.set("search", searchTerm);

      const res = await fetch(`/api/library?${q.toString()}`);
      const data = await res.json();
      if (data.resources) setResources(data.resources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedGrade, selectedCategory, selectedSubject, searchTerm]);

  // ثبت جزوه جدید
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          gradeLevel: parseInt(newGrade),
          major: newMajor,
          subjectName: newSubject,
          description: newDescription.trim(),
          authorName: newAuthor.trim() || currentUser.fullName,
          fileSize: "4.8 مگابایت",
          fileUrl: "/docs/sample-uploaded.pdf",
        }),
      });

      if (res.ok) {
        setIsUploadOpen(false);
        setNewTitle("");
        setNewDescription("");
        fetchResources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "TEXTBOOK":
        return { label: "کتاب درسی رسمی", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "TEACHER_NOTES":
        return { label: "جزوه تالیفی دبیر", color: "bg-amber-100 text-amber-900 border-amber-300" };
      case "PAST_EXAM":
        return { label: "آرشیو سوالات نهایی و کنکور", color: "bg-purple-100 text-purple-900 border-purple-300" };
      default:
        return { label: "منبع آموزشی", color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* هدر صفحه */}
      <section className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full font-bold">
            <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
            <span>کتابخانه دیجیتال، مخزن جزوات و اسناد آموزشی داناتک</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            مخزن جامع کتب درسی، جزوات طلایی و نمونه‌سوالات نهایی
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            امکان مطالعه و پیش‌نمایش مستقیم PDF درون مرورگر، دسته‌بندی ۳ سطحی بر اساس پایه و درس، و دانلود رایگان اسناد سمپاد.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(currentRole === "TEACHER" || currentRole === "PRINCIPAL") && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-bold transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              انتشار جزوه / فایل جدید
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition border border-white/10"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            صفحه اصلی
          </Link>
        </div>
      </section>

      {/* نوار فیلترهای چندسطحی و جستجو */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* فیلتر نوع منبع */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">دسته‌بندی:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">همه منابع آموزشی</option>
              <option value="TEXTBOOK">کتب درسی رسمی</option>
              <option value="TEACHER_NOTES">جزوات تالیفی دبیران</option>
              <option value="PAST_EXAM">آرشیو سوالات نهایی و کنکور</option>
            </select>
          </div>

          {/* فیلتر پایه */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">پایه:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">کلیه پایه‌ها</option>
              <option value="10">پایه دهم</option>
              <option value="11">پایه یازدهم</option>
              <option value="12">پایه دوازدهم</option>
            </select>
          </div>

          {/* فیلتر درس */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">درس:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">تمام دروس</option>
              <option value="حسابان">حسابان و ریاضیات</option>
              <option value="فیزیک">فیزیک</option>
              <option value="شیمی">شیمی</option>
              <option value="جامع">جامع و کنکوری</option>
            </select>
          </div>
        </div>

        {/* فیلد جستجو */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در عنوان، مبحث یا مولف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </section>

      {/* شبکه کارت‌های منابع دیجیتال */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">در حال جستجو و واکشی اسناد دیجیتال...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">هیچ سندی با فیلترهای انتخابی یافت نشد</h4>
          <p className="text-xs text-slate-500">فیلترها را ریست کنید یا کلیدواژه جستجو را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => {
            const badge = getCategoryBadge(item.category);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      پایه {item.gradeLevel} {item.major}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>مولف / گردآورنده:</span>
                      <strong className="text-slate-700">{item.authorName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>حجم فایل:</span>
                      <span className="font-mono text-slate-600">{item.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewResource(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    مطالعه آنلاین
                  </button>

                  <a
                    href={item.fileUrl}
                    download
                    onClick={() => {
                      alert(`در حال دانلود فایل: ${item.title}`);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                    title="دانلود مستقیم فایل"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال پیش‌نمایش آنلاین PDF */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-black text-slate-900">{previewResource.title}</h4>
                  <div className="text-[10px] text-slate-500">
                    مولف: {previewResource.authorName} • حجم: {previewResource.fileSize}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewResource.fileUrl}
                  download
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  دانلود PDF
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* صفحه کتابچه شبیه‌سازی‌شده */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 flex justify-center">
              <div className="bg-white max-w-xl w-full shadow-lg p-8 rounded-2xl border border-slate-200 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
                <div className="border-b-2 border-indigo-600 pb-4 text-center space-y-2">
                  <div className="text-indigo-600 font-bold text-xs">جمهوری اسلامی ایران • سازمان استعدادهای درخشان</div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">{previewResource.title}</h2>
                  <div className="text-[11px] text-slate-500">دبیرستان علامه حلی ۱ • سال تحصیلی ۱۴۰۳-۱۴۰۴</div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-indigo-900">فهرست مباحث این فصل:</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                    <li>مفهوم هندسی و فیزیکی مشتق و شیب خط مماس</li>
                    <li>قواعد مشتق‌گیری توابع جبری، توانی و رادیکالی</li>
                    <li>مشتق توابع مثلثاتی و قاعده زنجیره‌ای (Chain Rule)</li>
                    <li>حل ۷۰ تست نشان‌دار کنکور سراسری با پاسخ تشریحی</li>
                  </ul>

                  <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-xs font-mono text-indigo-950 space-y-2">
                    <span className="font-bold text-indigo-800 block">نمونه فرمول‌های کلیدی جزوه:</span>
                    <div>{"$$\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$$"}</div>
                    <div>{"$$(u^n)' = n \\cdot u' \\cdot u^{n-1}$$"}</div>
                    <div>{"$$(\\sin(u))' = u' \\cdot \\cos(u)$$"}</div>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs">
                    {previewResource.description || "این سند شامل جمع‌بندی کامل نکات، دام‌های امتحانات نهایی و فرمول‌های کلیدی است."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال انتشار جزوه توسط دبیر */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              انتشار جزوه یا نمونه‌سوال در کتابخانه دیجیتال
            </h3>

            <form onSubmit={handleUploadResource} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان منبع آموزشی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جزوه جمع‌بندی هندسه ۳ پایه دوازدهم"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">دسته‌بندی:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    <option value="TEACHER_NOTES">جزوه تالیفی دبیر</option>
                    <option value="PAST_EXAM">نمونه‌سوال نهایی/کنکور</option>
                    <option value="TEXTBOOK">کتاب درسی</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان درس:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حسابان"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">توضیحات تکمیلی:</label>
                <textarea
                  rows={3}
                  placeholder="سرفصل‌ها و توضیحات پیرامون محتوای جزوه..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                >
                  بارگذاری و انتشار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
