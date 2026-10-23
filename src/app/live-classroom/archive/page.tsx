"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  HelpCircle,
  FileText,
  Zap,
  Award,
  ChevronLeft,
  Search,
  Filter,
  RefreshCw,
  Layers,
  GraduationCap,
} from "lucide-react";

export default function LiveClassroomArchivePage() {
  const { currentUser } = useRole();

  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any | null>(null);
  const [recapData, setRecapData] = useState<any | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recap" | "attendance" | "quizzes" | "board">("recap");

  const isTeacher = currentUser.role === "TEACHER" || currentUser.role === "PRINCIPAL";

  // ۱. دریافت لیست جلسات گذشته
  const fetchSessions = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/live/sessions");
      const data = await res.json();
      if (data.success && data.sessions) {
        // فیلتر جلسات پایان‌یافته یا همه جلسات
        const ended = data.sessions.filter(
          (s: any) => s.status === "ENDED" || s.whiteboardSnapshotJson || s.aiRecapJson
        );
        setSessions(ended.length > 0 ? ended : data.sessions);
        if (ended.length > 0 && !selectedSessionId) {
          setSelectedSessionId(ended[0].id);
        } else if (data.sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load archive sessions:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ۲. دریافت جزئیات جلسه انتخابی و خلاصه هوشمند
  useEffect(() => {
    if (!selectedSessionId) return;

    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/live/sessions/${selectedSessionId}`);
        const data = await res.json();
        if (data.success && data.session) {
          setSessionDetail(data.session);

          // بارگذاری یا تولید خلاصه هوشمند
          setLoadingRecap(true);
          const recapRes = await fetch(`/api/live/sessions/${selectedSessionId}/recap`);
          const recapJson = await recapRes.json();
          if (recapJson.success && recapJson.recap) {
            setRecapData(recapJson.recap);
          }
        }
      } catch (err) {
        console.error("Error loading session detail/recap:", err);
      } finally {
        setLoadingDetail(false);
        setLoadingRecap(false);
      }
    };

    loadDetail();
  }, [selectedSessionId]);

  // ۳. بازتولید خلاصه با هوش مصنوعی
  const handleRegenerateRecap = async () => {
    if (!selectedSessionId || regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/live/sessions/${selectedSessionId}/recap`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.recap) {
        setRecapData(data.recap);
        alert("خلاصه تدریس با موفقیت توسط هوش مصنوعی به‌روزرسانی شد.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  // چاپ / دریافت خروجی PDF
  const handlePrint = () => {
    window.print();
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subjectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.classroom?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sessionDurationMinutes =
    sessionDetail?.actualStartTime && sessionDetail?.actualEndTime
      ? Math.max(
          1,
          Math.round(
            (new Date(sessionDetail.actualEndTime).getTime() -
              new Date(sessionDetail.actualStartTime).getTime()) /
              60000
          )
        )
      : 60;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* استایل‌های اختصاصی چاپ برای خروجی تمیز PDF */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          header,
          aside,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* هدر بالای صفحه */}
      <header className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href={isTeacher ? "/teacher" : "/student"}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="بازگشت به پنل کاربری"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-white">
              آرشیو جلسات کلاس آنلاین و جزوات هوشمند
            </h1>
            <p className="text-xs text-slate-400">
              خلاصه تدریس استخراج‌شده توسط هوش مصنوعی، یادداشت‌های تخته‌سیاه، و آمار آزمون‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>چاپ و دانلود جزوه (PDF)</span>
          </button>
        </div>
      </header>

      {/* بدنه دو ستونه: لیست جلسات سمت راست و جزئیات سمت چپ */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ستون لیست جلسات */}
        <aside className="w-full md:w-84 bg-slate-900 border-l border-slate-800 flex flex-col p-4 space-y-3 shrink-0 no-print">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس درس، کلاس، مبحث..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری لیست جلسات...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">جلسه‌ای در آرشیو یافت نشد.</div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition flex flex-col space-y-2 ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        {s.subjectTitle || "درس عمومی"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(s.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold leading-relaxed line-clamp-2">{s.title}</h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>{s.classroom?.name}</span>
                      <span>دبیر: {s.hostTeacher?.fullName}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ناحیه اصلی جزئیات و محتوای جلسه انتخابی */}
        <main className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-5">
          {loadingDetail || !sessionDetail ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold">در حال بارگذاری اطلاعات و خلاصه تدریس...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* کارت هدر اطلاعات جلسه */}
              <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 print-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {sessionDetail.subjectTitle}
                      </span>
                      <span className="text-xs text-slate-400">
                        {sessionDetail.classroom?.name} • دبیر: {sessionDetail.hostTeacher?.fullName}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white">{sessionDetail.title}</h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 no-print">
                    <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(sessionDetail.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sessionDurationMinutes} دقیقه</span>
                    </div>
                  </div>
                </div>

                {/* تب‌های پیمایش داخل جلسه */}
                <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 rounded-2xl text-xs font-bold no-print">
                  <button
                    type="button"
                    onClick={() => setActiveTab("recap")}
                    className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeTab === "recap"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>خلاصه هوشمند تدریس (AI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("attendance")}
                    className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeTab === "attendance"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>حضور و غیاب کلاسی ({sessionDetail.participants?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("quizzes")}
                    className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeTab === "quizzes"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>کوییزهای درسی ({sessionDetail.quizzes?.length || 0})</span>
                  </button>
                </div>
              </div>

              {/* ۱. تب خلاصه هوشمند تدریس (AI Lesson Recap) */}
              {activeTab === "recap" && (
                <div className="space-y-5">
                  {loadingRecap ? (
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
                      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-bold">هوش مصنوعی در حال تحلیل مباحث و استخراج فرمول‌هاست...</p>
                    </div>
                  ) : !recapData ? (
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
                      <p className="text-xs text-slate-400">هنوز خلاصه‌ای برای این کلاس ثبت نشده است.</p>
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={handleRegenerateRecap}
                          disabled={regenerating}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>تولید هوشمند با Gemini AI</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* چکیده مفهومی تدریس */}
                      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 print-card">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                              <Sparkles className="w-4 h-4" />
                            </span>
                            <h3 className="text-sm font-black text-white">چکیده مفهومی مباحث کلاس</h3>
                          </div>

                          {isTeacher && (
                            <button
                              type="button"
                              onClick={handleRegenerateRecap}
                              disabled={regenerating}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1 no-print"
                              title="تولید مجدد خلاصه با هوش مصنوعی"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                              <span>به‌روزرسانی با AI</span>
                            </button>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                          {recapData.summary}
                        </p>
                      </div>

                      {/* نکات طلایی و کلیدی */}
                      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 print-card">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                            <Award className="w-4 h-4" />
                          </span>
                          <h3 className="text-sm font-black text-white">نکات طلایی و دام‌های تستی جلسه</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {recapData.keyTakeaways?.map((item: string, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* فرمول‌ها و قضایای تدریس‌شده با KaTeX */}
                      {recapData.formulasAndTheorems?.length > 0 && (
                        <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 print-card">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                              <BookOpen className="w-4 h-4" />
                            </span>
                            <h3 className="text-sm font-black text-white">فرمول‌ها و تعاریف رسمی درس (KaTeX)</h3>
                          </div>

                          <div className="space-y-3 pt-1">
                            {recapData.formulasAndTheorems.map((f: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-indigo-300">{f.title}</span>
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center text-sm font-mono text-white overflow-x-auto" dir="ltr">
                                  <KaTeXRenderer content={f.formula} />
                                </div>

                                <p className="text-[11px] text-slate-400 leading-relaxed">{f.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* پرسش و پاسخ‌های کلاسی */}
                      {recapData.studentQuestionsAnswered?.length > 0 && (
                        <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 print-card">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                              <HelpCircle className="w-4 h-4" />
                            </span>
                            <h3 className="text-sm font-black text-white">پرسش‌های پرتکرار دانش‌آموزان در وبینار</h3>
                          </div>

                          <div className="space-y-2.5 pt-1">
                            {recapData.studentQuestionsAnswered.map((q: any, idx: number) => (
                              <div key={idx} className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 text-amber-300 font-bold">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span>پرسش: {q.question}</span>
                                </div>
                                <p className="text-slate-300 pr-4 text-[11px] leading-relaxed">{q.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* تکالیف و تمرین‌های پیشنهادی */}
                      {recapData.suggestedHomework?.length > 0 && (
                        <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 print-card">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                              <GraduationCap className="w-4 h-4" />
                            </span>
                            <h3 className="text-sm font-black text-white">تکالیف و تمرین‌های تثبیت یادگیری</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            {recapData.suggestedHomework.map((hw: any, idx: number) => (
                              <div key={idx} className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-2 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-bold text-white">{hw.title}</span>
                                    <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-500/20 text-indigo-300">
                                      {hw.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed">{hw.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* یادداشت پایانی دبیر */}
                      {recapData.teacherNotes && (
                        <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 leading-relaxed print-card">
                          <span className="font-bold text-white block mb-1">توصیه استاد برای آزمون‌های پیش رو:</span>
                          {recapData.teacherNotes}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ۲. تب حضور و غیاب کلاسی (Attendance) */}
              {activeTab === "attendance" && (
                <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 print-card">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Users className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-white">کارنامه حضور و غیاب وبینار کلاسی</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      معیار حضور موجه: حداقل ۷۰٪ کل جلسه
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-2.5 px-3">نام و نام‌خانوادگی دانش‌آموز</th>
                          <th className="py-2.5 px-3">مدت حضور در کلاس</th>
                          <th className="py-2.5 px-3">درصد حضور مفید</th>
                          <th className="py-2.5 px-3">وضعیت نهایی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {sessionDetail.participants?.map((p: any) => {
                          const minutes = Math.floor((p.totalPresentSeconds || 0) / 60);
                          const totalSec = (sessionDurationMinutes || 60) * 60;
                          const ratio = Math.min(100, Math.round(((p.totalPresentSeconds || 0) / totalSec) * 100));

                          let statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              حاضر کامل ✅
                            </span>
                          );
                          if (p.attendanceStatus === "LATE") {
                            statusBadge = (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                                تاخیر در ورود ⚠️
                              </span>
                            );
                          } else if (p.attendanceStatus === "ABSENT") {
                            statusBadge = (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                غایب ❌
                              </span>
                            );
                          }

                          return (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3 px-3 font-bold text-white">{p.student?.fullName || "دانش‌آموز"}</td>
                              <td className="py-3 px-3 text-slate-300 font-mono">{minutes} دقیقه ({p.totalPresentSeconds || 0} ثانیه)</td>
                              <td className="py-3 px-3 font-mono text-indigo-300 font-bold">{ratio}٪</td>
                              <td className="py-3 px-3">{statusBadge}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ۳. تب کوییزهای درسی (Quizzes) */}
              {activeTab === "quizzes" && (
                <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 print-card">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                        <Zap className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-white">بانک کوییزهای کلاسی برگزار شده</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sessionDetail.quizzes?.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">کوییزی در این جلسه برگزار نشده است.</p>
                    ) : (
                      sessionDetail.quizzes.map((q: any, idx: number) => {
                        let opts: string[] = [];
                        let responses: any[] = [];
                        try {
                          opts = JSON.parse(q.optionsJson);
                        } catch (e) {}
                        try {
                          responses = q.responsesJson ? JSON.parse(q.responsesJson) : [];
                        } catch (e) {}

                        return (
                          <div key={q.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-300">سوال شماره {idx + 1}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                تعداد پاسخ‌ها: {responses.length}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-white leading-relaxed">{q.questionText}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {opts.map((opt, optIdx) => {
                                const isCorrect = q.correctAnswer === optIdx.toString();
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                      isCorrect
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold"
                                        : "bg-slate-900/60 border-slate-800 text-slate-300"
                                    }`}
                                  >
                                    <span>گزینه {optIdx + 1}: {opt}</span>
                                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
