"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  Share2,
  Download,
  Trash2,
  Circle,
  Square,
  Minus,
  Sparkles,
  MessageSquare,
  Users,
  Send,
  ArrowRight,
  Maximize2,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Layers,
  FileText,
  Volume2,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface Attendee {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  isHandRaised: boolean;
  isMicOn: boolean;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface SessionData {
  id: string;
  title: string;
  teacherName: string;
  subjectName: string;
  className: string;
  status: string;
  isRecording: boolean;
  activeSlide: string;
  attendees: Attendee[];
  chatMessages: ChatMessage[];
}

export default function VirtualClassroomPage() {
  const { currentRole, currentUser } = useRole();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState<"chat" | "attendees">("chat");

  // وضعیت‌های تعاملی کاربر
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ابزارهای تخته سفید
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#4338ca"); // پیش‌فرض: آبی نیلی
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [activeSlide, setActiveSlide] = useState<"BLANK" | "TEXTBOOK_P42" | "TEXTBOOK_P58" | "FORMULA_SLIDE">("TEXTBOOK_P42");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // دریافت وضعیت جلسه از سرور
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/classroom");
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setIsRecording(data.session.isRecording);
        setActiveSlide(data.session.activeSlide as any);

        // تنظیم وضعیت دانش‌آموز جاری
        const myAttendee = data.session.attendees.find((a: Attendee) => a.userId === currentUser.id);
        if (myAttendee) {
          setIsHandRaised(myAttendee.isHandRaised);
          setIsMicMuted(!myAttendee.isMicOn);
        }
      }
    } catch (err) {
      console.error("Failed to load classroom session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 6000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // راه‌اندازی بوم نقاشی
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // تنظیم رزولوشن با کیفیت بالا
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 520;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [activeSlide]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isEraser) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 24;
    } else {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showToast("تخته با موفقیت پاک شد.");
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `danatak-whiteboard-notes-${Date.now()}.png`;
    link.href = url;
    link.click();
    showToast("تصویر یادداشت‌های تخته دانلود شد.");
  };

  // اضافه کردن تمبر فرمول ریاضی روی تخته
  const handleStampFormula = (formulaText: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "bold 16px Vazirmatn, sans-serif";
    ctx.fillStyle = drawColor;
    ctx.fillText(formulaText, 40, 60);
    showToast(`فرمول ریاضی روی تخته درج شد: ${formulaText}`);
  };

  // تغییر اسلاید / صفحه کتاب درسی
  const handleChangeSlide = async (slideKey: "BLANK" | "TEXTBOOK_P42" | "TEXTBOOK_P58" | "FORMULA_SLIDE") => {
    setActiveSlide(slideKey);
    try {
      await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_SLIDE",
          payload: { slideKey },
        }),
      });
      showToast("صفحه و محتوای تخته به‌روزرسانی شد.");
    } catch (e) {
      console.error(e);
    }
  };

  // ارسال پیام در چت
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      const res = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_CHAT",
          payload: {
            senderName: currentUser.fullName,
            senderRole: currentRole,
            message: chatInput.trim(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatInput("");
        fetchSession();
      }
    } catch (err) {
      console.error("Failed to send chat:", err);
    }
  };

  // دست بلند کردن
  const handleToggleHand = async () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    try {
      await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_HAND",
          payload: { userId: currentUser.id },
        }),
      });
      showToast(nextState ? "دست شما بلند شد ✋ استاد مطلع گردید." : "دست شما پایین آمد.");
      fetchSession();
    } catch (e) {
      console.error(e);
    }
  };

  // ضبط جلسه
  const handleToggleRecord = async () => {
    try {
      const res = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_RECORD" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRecording(data.isRecording);
        if (data.archivedToLibrary) {
          showToast("ضبط جلسه پایان یافت و به کتابخانه دیجیتال منتقل شد ✓");
        } else {
          showToast("ضبط زنده جلسه شروع شد 🔴");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* هدر اتاق کلاس آنلاین */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="خروج به صفحه اصلی"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              زنده (LIVE)
            </span>
          </div>

          <div>
            <h1 className="text-xs md:text-sm font-black text-white">
              {session?.title || "کلاس آنلاین حسابان ۲ - مبحث مشتق و اکسترمم‌های نسبی"}
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              مدرس: {session?.teacherName || "استاد احسان محمدی"} | {session?.className || "کلاس ۱۲/۱"}
            </p>
          </div>
        </div>

        {/* وضعیت ضبط و تایمر */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              isRecording
                ? "bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-rose-500" : "bg-slate-500"}`}></span>
            <span>{isRecording ? "REC در حال ضبط" : "شروع ضبط"}</span>
          </button>

          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono font-bold text-amber-400">
            ۳۶:۴۲
          </div>
        </div>
      </header>

      {/* پیام بازخورد موقت (Toast) */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ناحیه کاربری اصلی کلاس آنلاین */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ستون راست و وسط: تخته هوشمند و محتوای درسی (۹ ستون) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col border-b lg:border-b-0 lg:border-l border-slate-800 bg-slate-900/40 relative">
          {/* نوار انتخاب اسلاید / صفحه کتاب درسی */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1 shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                سند پس‌زمینه تخته:
              </span>
              <button
                onClick={() => handleChangeSlide("TEXTBOOK_P42")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSlide === "TEXTBOOK_P42"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                کتاب درسی: صفحه ۴۲ (قضیه رول)
              </button>
              <button
                onClick={() => handleChangeSlide("TEXTBOOK_P58")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSlide === "TEXTBOOK_P58"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                کتاب درسی: صفحه ۵۸ (نقاط عطف)
              </button>
              <button
                onClick={() => handleChangeSlide("FORMULA_SLIDE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSlide === "FORMULA_SLIDE"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                اسلاید فرمول‌های طلایی
              </button>
              <button
                onClick={() => handleChangeSlide("BLANK")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSlide === "BLANK"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                تخته سفید خام
              </button>
            </div>

            <button
              onClick={handleDownloadSnapshot}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              title="دانلود تصویر یادداشت‌های تخته"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* نوار ابزار قلم و رسم ریاضی */}
          <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* انتخاب رنگ */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">رنگ قلم:</span>
              {[
                { color: "#1e1b4b", label: "مشکی", bg: "bg-slate-950" },
                { color: "#4338ca", label: "آبی نیلی", bg: "bg-indigo-600" },
                { color: "#dc2626", label: "قرمز", bg: "bg-rose-600" },
                { color: "#059669", label: "سبز", bg: "bg-emerald-600" },
                { color: "#eab308", label: "هایلایتر", bg: "bg-amber-400" },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    setDrawColor(c.color);
                    setIsEraser(false);
                  }}
                  className={`w-5 h-5 rounded-full ${c.bg} border-2 transition ${
                    drawColor === c.color && !isEraser ? "scale-125 border-white shadow-md" : "border-transparent"
                  }`}
                  title={c.label}
                />
              ))}

              {/* پاک‌کن */}
              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  isEraser ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                پاک‌کن
              </button>

              <button
                onClick={handleClearCanvas}
                className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="پاک‌کردن کل تخته"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* تمبر فرمول‌های آماده KaTeX */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-300 font-bold">درج فرمول:</span>
              <button
                onClick={() => handleStampFormula("f'(x) = 0  =>  x = c")}
                className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-[10px] font-mono text-indigo-200"
              >
                {"$$f'(x) = 0$$"}
              </button>
              <button
                onClick={() => handleStampFormula("lim [f(x+h)-f(x)]/h")}
                className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-[10px] font-mono text-indigo-200"
              >
                {"$$\\lim \\frac{\\Delta y}{\\Delta x}$$"}
              </button>
              <button
                onClick={() => handleStampFormula("y - y0 = m(x - x0)")}
                className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-[10px] font-mono text-indigo-200"
              >
                {"خط مماس"}
              </button>
            </div>
          </div>

          {/* محفظه تخته سفید و نمایش سند پس‌زمینه */}
          <div className="flex-1 relative overflow-hidden bg-white min-h-[480px]">
            {/* لایه سند پس‌زمینه (کتاب درسی / اسلاید) */}
            {activeSlide === "TEXTBOOK_P42" && (
              <div className="absolute inset-0 p-8 text-slate-900 bg-amber-50/40 select-none overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-4 opacity-90 pointer-events-none">
                  <div className="border-b-2 border-indigo-900 pb-2 flex items-center justify-between text-xs text-indigo-950 font-bold">
                    <span>کتاب درسی حسابان ۲ — فصل سوم: کاربردهای مشتق</span>
                    <span>صفحه ۴۲</span>
                  </div>

                  <h3 className="text-base font-black text-indigo-900">درس دوم: قضایای مشتق‌پذیری و قضیه رول (Rolle)</h3>

                  <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs leading-relaxed space-y-2">
                    <p className="font-bold text-indigo-950">قضیه (رول):</p>
                    <p>
                      فرض کنید تابع $f$ بر بازه بسته $[a, b]$ پیوسته و بر بازه باز $(a, b)$ مشتق‌پذیر باشد. اگر $f(a) = f(b)$ باشد، آنگاه حداقل یک نقطه مانند $c \in (a, b)$ وجود دارد که در آن:
                    </p>
                    <div className="py-2 text-center text-sm font-bold text-indigo-900">
                      {"$$f'(c) = 0$$"}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800">مثال ۱:</span>
                    <p>
                      بررسی کنید آیا قضیه رول برای تابع $f(x) = x^3 - 3x$ در بازه $[-\sqrt{3}, \sqrt{3}]$ برقرار است؟
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === "TEXTBOOK_P58" && (
              <div className="absolute inset-0 p-8 text-slate-900 bg-sky-50/40 select-none overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-4 opacity-90 pointer-events-none">
                  <div className="border-b-2 border-sky-900 pb-2 flex items-center justify-between text-xs text-sky-950 font-bold">
                    <span>کتاب درسی حسابان ۲ — فصل سوم</span>
                    <span>صفحه ۵۸</span>
                  </div>

                  <h3 className="text-base font-black text-sky-900">درس چهارم: تقعر و نقطۀ عطف نمودار توابع</h3>
                  <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 text-xs leading-relaxed">
                    <p>نقطه‌ای از نمودار که جهت تقعر در آن تغییر می‌کند و مماس در آن نقطه موجود باشد، نقطه عطف نامیده می‌شود.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSlide === "FORMULA_SLIDE" && (
              <div className="absolute inset-0 p-8 text-slate-900 bg-indigo-900/5 select-none overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-4 opacity-90 pointer-events-none text-xs">
                  <h3 className="text-base font-black text-indigo-900 border-b border-indigo-200 pb-2">
                    اسلاید جمع‌بندی: ۵ دام کنکوری مبحث اکسترمم‌های نسبی
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700">
                    <li>دامنه تابع را همواره قبل از مشتق‌گیری تعیین نمایید.</li>
                    <li>نقاط گوشه‌ای (Cusp) نقاط بحرانی هستند اما مشتق در آنها تعریف‌نشده است.</li>
                    <li>مشتق صفر شرط لازم برای اکسترمم نسبی توابع مشتق‌پذیر است نه شرط کافی!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* بوم نقاشی فعال روی سند (Canvas) */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
            />
          </div>
        </div>

        {/* ستون چپ: استیج ویدیو، حاضرین و چت زنده (۳ ستون) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col bg-slate-900 border-t lg:border-t-0 border-slate-800">
          {/* استیج ویدیو و وب‌کم دبیر */}
          <div className="p-3 border-b border-slate-800 space-y-3">
            {/* وب‌کم دبیر (استاد محمدی) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md aspect-video flex items-center justify-center">
              <img
                src="/api/avatar?name=احسان&bg=4338ca"
                alt="دبیر"
                className="w-20 h-20 rounded-full border-2 border-indigo-500 shadow-lg object-cover"
              />

              {/* اکولایزر صدا (نمایش صحبت کردن دبیر) */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-[10px] text-emerald-400">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>در حال تدریس</span>
              </div>

              {/* نام دبیر */}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>استاد احسان محمدی (دبیر)</span>
              </div>
            </div>

            {/* وب‌کم کوچک دانش‌آموز (علی رضایی) */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2">
                <img
                  src="/api/avatar?name=علی&bg=059669"
                  alt="علی"
                  className="w-8 h-8 rounded-full border border-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">علی رضایی (شما)</span>
                  <span className="text-[10px] text-slate-400">
                    {isHandRaised ? "✋ دست شما بالاست" : "حاضر در کلاس"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    isMicMuted ? "bg-rose-900/60 text-rose-300" : "bg-emerald-900/60 text-emerald-300"
                  }`}
                  title={isMicMuted ? "میکروفون خاموش" : "میکروفون روشن"}
                >
                  {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleToggleHand}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    isHandRaised ? "bg-amber-600 text-white shadow-md" : "bg-slate-700 text-slate-300 hover:text-white"
                  }`}
                  title="دست بلند کردن"
                >
                  <Hand className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* تب‌های سایدبار (چت زنده و حاضرین) */}
          <div className="flex border-b border-slate-800 bg-slate-900/80">
            <button
              onClick={() => setRightTab("chat")}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                rightTab === "chat"
                  ? "border-indigo-500 text-white bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>گفتگوی متنی ({session?.chatMessages.length || 0})</span>
            </button>
            <button
              onClick={() => setRightTab("attendees")}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                rightTab === "attendees"
                  ? "border-indigo-500 text-white bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>لیست حاضرین ({session?.attendees.length || 0})</span>
            </button>
          </div>

          {/* محتوای تب چت زنده */}
          {rightTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-[280px] p-3 justify-between">
              {/* استریم پیام‌ها */}
              <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
                {session?.chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      msg.senderRole === "TEACHER"
                        ? "bg-indigo-950/80 border border-indigo-800 text-indigo-100"
                        : "bg-slate-800/80 border border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-300">{msg.senderName}</span>
                      <span className="text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* فرم ارسال پیام */}
              <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="پیام یا سوال درسی خود را بنویسید..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* محتوای تب لیست حاضرین */}
          {rightTab === "attendees" && (
            <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[360px]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <span>۴ نفر حاضر در کلاس</span>
                <span className="text-emerald-400 font-bold">حضور خودکار ثبت شد ✓</span>
              </div>

              {session?.attendees.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-bold text-slate-200">{att.userName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {att.isHandRaised && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 animate-pulse">
                        <Hand className="w-3 h-3" />
                        دست بلند
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {att.isMicOn ? "🎙️ فعال" : "🔇 بی‌صدا"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
