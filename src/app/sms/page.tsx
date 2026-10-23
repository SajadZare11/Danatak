"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Smartphone,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  Users,
  Search,
  RefreshCw,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface SmsWallet {
  id: string;
  balanceToman: number;
  smsRateToman: number;
  totalSent: number;
  deliveryRate: number;
  providerName: string;
  senderNumber: string;
}

interface SmsTemplate {
  id: string;
  title: string;
  category: string;
  templateBody: string;
  variables: string;
}

interface SmsLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  recipientRole: string;
  studentName?: string | null;
  type: string;
  message: string;
  status: string;
  costToman: number;
  partsCount: number;
  providerRef?: string | null;
  sentAt: string;
}

export default function SmsCenterPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "outbox" | "templates" | "gateway">("compose");
  const [wallet, setWallet] = useState<SmsWallet | null>(null);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // فیلدهای فرم ارسال پیامک
  const [recipientType, setRecipientType] = useState<"SINGLE" | "CLASS_12_1" | "LOW_GRADE_PARENTS" | "DEBTOR_PARENTS">("SINGLE");
  const [phone, setPhone] = useState("09121234567");
  const [recipientName, setRecipientName] = useState("مهندس حسین رضایی");
  const [studentName, setStudentName] = useState("علی رضایی");
  const [category, setCategory] = useState("ABSENCE_ALERT");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [messageText, setMessageText] = useState(
    "اولیا گرامی؛ فرزند شما علی رضایی در تاریخ ۱۴۰۳/۰۸/۰۲ در زنگ ۳ (درس فیزیک ۳) غیبت داشته است. دبیرستان علامه حلی ۱"
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // بارگذاری داده‌های اولیه
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sms?category=${filterCategory}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        setTemplates(data.templates);
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load SMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  const handleApplyTemplate = (tpl: SmsTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCategory(tpl.category);
    // جایگزینی متغیرهای پیش‌فرض با مقادیر دمو
    let text = tpl.templateBody
      .replace("{studentName}", studentName || "علی رضایی")
      .replace("{date}", "۱۴۰۳/۰۸/۰۲")
      .replace("{period}", "۳")
      .replace("{subject}", "حسابان ۲")
      .replace("{score}", "۱۸.۵")
      .replace("{taraz}", "۶۷۲۰")
      .replace("{assignmentTitle}", "تمرین مشتق")
      .replace("{dueTime}", "۲۴:۰۰")
      .replace("{installmentTitle}", "دوم")
      .replace("{amount}", "۴۵,۰۰۰,۰۰۰")
      .replace("{day}", "دوشنبه");
    setMessageText(text);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSending(true);

      let payload: any = {
        message: messageText,
        type: category,
      };

      if (recipientType === "SINGLE") {
        payload.recipientPhone = phone;
        payload.recipientName = recipientName;
        payload.studentName = studentName;
      } else if (recipientType === "CLASS_12_1") {
        payload.recipients = [
          { phone: "09121234567", name: "مهندس حسین رضایی", studentName: "علی رضایی" },
          { phone: "09129876543", name: "آقای علیرضا باقری", studentName: "محمد باقری" },
          { phone: "09125554433", name: "دکتر مسعود شریفی", studentName: "سجاد شریفی" },
          { phone: "09124443322", name: "خانم موسوی", studentName: "پویا کریمی" },
        ];
      } else if (recipientType === "LOW_GRADE_PARENTS") {
        payload.recipients = [
          { phone: "09124443322", name: "خانم موسوی", studentName: "پویا کریمی" },
          { phone: "09123332211", name: "خانم ناصری", studentName: "امیرعلی ناصری" },
        ];
      } else if (recipientType === "DEBTOR_PARENTS") {
        payload.recipients = [
          { phone: "09121234567", name: "مهندس حسین رضایی", studentName: "علی رضایی" },
        ];
      }

      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccessToast(data.message || "پیامک با موفقیت ارسال شد.");
        fetchData();
        setTimeout(() => setSendSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error("SMS Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // محاسبه تعداد کاراکتر و صفحات پیامک
  const charCount = messageText.length;
  const partsCount = charCount <= 70 ? 1 : Math.ceil(charCount / 67);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* هدر رسمی */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 shadow-lg sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-slate-300 hover:text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white">
                  سامانه هوشمند پیامک و هشدارهای اولیا
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  درگاه VIP فعال
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                اطلاع‌رسانی خودکار غیبت، افت تراز، تکالیف و رویدادهای تحصیلی داناتک
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/sms/export"
              download
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل (CSV)</span>
            </a>

            <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
              <Wallet className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-indigo-300 block">اعتبار کیف‌پول:</span>
                <span className="font-bold text-amber-300">
                  {wallet ? wallet.balanceToman.toLocaleString("fa-IR") : "۲,۴۵۰,۰۰۰"} تومان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار ناوبری تب‌ها */}
        <div className="max-w-7xl mx-auto px-4 mt-2 flex gap-2 border-t border-indigo-900/40 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "compose"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>ارسال پیامک و شبیه‌ساز موبایل</span>
          </button>
          <button
            onClick={() => setActiveTab("outbox")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "outbox"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>تاریخچه و لاگ ارسالی‌ها (Outbox)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-800 text-[10px] text-indigo-200">
              {logs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "templates"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>الگوهای هوشمند متن ({templates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("gateway")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "gateway"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>وضعیت اتصال درگاه مخابراتی</span>
          </button>
        </div>
      </header>

      {/* اعلان موفقیت‌آمیز */}
      {sendSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm">{sendSuccessToast}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* کارت‌های خلاصه وضعیت و متریک‌ها */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">کل پیامک‌های ارسالی</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {stats?.totalSent || 1428} <span className="text-xs font-normal text-slate-400">پیام</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">نرخ تحویل موفق</p>
              <h3 className="text-xl font-black text-emerald-600 mt-1">
                {stats?.deliveryPercentage || 98.7}٪
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">هشدارهای غیبت زنده</p>
              <h3 className="text-xl font-black text-rose-600 mt-1">
                {stats?.absenceAlertCount || 24} <span className="text-xs font-normal text-slate-400">پیامک</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">سرعت ارسال میانگین</p>
              <h3 className="text-xl font-black text-indigo-600 mt-1">
                ۱.۴ <span className="text-xs font-normal text-slate-400">ثانیه</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* محتوای تب ۱: ارسال و شبیه‌ساز */}
        {activeTab === "compose" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ستون راست: فرم ارسال پیامک */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">ارسال پیامک تکی یا گروهی</h2>
                </div>
                <span className="text-xs text-slate-400">هزینه هر پارت: ۱۲۰ تومان</span>
              </div>

              <form onSubmit={handleSendSms} className="space-y-4">
                {/* انتخاب نوع گیرنده */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">گروه هدف مخاطبان:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecipientType("SINGLE")}
                      className={`p-2.5 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between ${
                        recipientType === "SINGLE"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>شماره تکی (اولیا / همکار)</span>
                      <Smartphone className="w-4 h-4 opacity-70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("CLASS_12_1")}
                      className={`p-2.5 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between ${
                        recipientType === "CLASS_12_1"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>کل اولیای کلاس ۱۲/۱ (۴ نفر)</span>
                      <Users className="w-4 h-4 opacity-70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("LOW_GRADE_PARENTS")}
                      className={`p-2.5 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between ${
                        recipientType === "LOW_GRADE_PARENTS"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>اولیای دارای افت تراز (۲ نفر)</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("DEBTOR_PARENTS")}
                      className={`p-2.5 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between ${
                        recipientType === "DEBTOR_PARENTS"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>اولیای دارای اقساط معوق</span>
                      <Wallet className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* فیلدهای تکی */}
                {recipientType === "SINGLE" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">شماره همراه:</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left font-mono focus:outline-none focus:border-indigo-500"
                        placeholder="09121234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">نام ولی / گیرنده:</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="مهندس حسین رضایی"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">نام دانش‌آموز:</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="علی رضایی"
                      />
                    </div>
                  </div>
                )}

                {/* انتخاب سریع الگو */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">انتخاب الگوی آماده:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                          selectedTemplateId === tpl.id
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* متن پیامک */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">متن پیامک:</label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {charCount} کاراکتر | {partsCount} پارت (هزینه: {partsCount * 120} تومان)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    placeholder="متن پیامک را وارد کنید..."
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * پیامک با پیش‌شماره اختصاصی ۱۰۰۰۸۸۹۹ و برچسب «دبیرستان علامه حلی ۱» ارسال خواهد شد.
                  </p>
                </div>

                {/* دکمه ارسال */}
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ارسال به درگاه مخابراتی...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال نهایی پیامک</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ستون چپ: شبیه‌ساز فوق‌العاده واقعی گوشی هوشمند */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[320px] bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800 relative">
                {/* بلندگو و دوربین سلفی گوشی */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-2 z-20">
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                  <div className="w-6 h-1 rounded-full bg-slate-800"></div>
                </div>

                {/* صفحه نمایش موبایل */}
                <div className="bg-slate-100 rounded-[32px] overflow-hidden pt-8 pb-6 px-4 min-h-[500px] flex flex-col justify-between relative shadow-inner">
                  {/* استاتوس بار گوشی */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 pb-2 border-b border-slate-200">
                    <span>۱۲:۴۵</span>
                    <div className="flex items-center gap-1.5">
                      <span>LTE</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* نوتیفیکیشن زنده در لاک‌اسکرین */}
                  <div className="mt-4 space-y-3">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[8px]">
                            ✉️
                          </div>
                          <span className="text-[11px] font-bold text-slate-800">داناتک (10008899)</span>
                        </div>
                        <span className="text-[9px] text-slate-400">الان</span>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-sans line-clamp-3">
                        {messageText || "پیش‌نمایش پیامک اینجا ظاهر می‌شود..."}
                      </p>
                    </div>

                    {/* اپ پیامک باز شده */}
                    <div className="bg-slate-200/60 p-3 rounded-2xl space-y-2">
                      <span className="text-[9px] font-bold text-slate-500 block text-center">
                        مکالمه با سامانه مدرسه
                      </span>
                      <div className="bg-emerald-600 text-white p-2.5 rounded-2xl rounded-tr-none text-[10px] leading-relaxed shadow-sm">
                        {messageText}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-emerald-200">
                          <span>۱۲:۴۵</span>
                          <span>✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* راهنما */}
                  <div className="text-center pt-4">
                    <span className="text-[10px] text-slate-400 font-medium">
                      پیش‌نمایش زنده در گوشی اولیا
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* محتوای تب ۲: لاگ و تاریخچه ارسالی‌ها */}
        {activeTab === "outbox" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">تاریخچه پیامک‌های ارسالی (Outbox)</h2>
                <p className="text-xs text-slate-400 mt-0.5">مشاهده وضعیت تحویل مخابراتی، هزینه و جزییات هر پیامک</p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/sms/export"
                  download
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>دانلود فایل اکسل (CSV)</span>
                </a>

                {/* فیلتر دسته‌بندی */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="ALL">همه دسته‌ها</option>
                  <option value="ABSENCE_ALERT">غیبت زنده</option>
                  <option value="GRADE_ALERT">افت نمره و تراز</option>
                  <option value="HOMEWORK_DUE">یادآوری تکلیف</option>
                  <option value="TUITION_REMINDER">سررسید شهریه</option>
                  <option value="GENERAL">اطلاعیه عمومی</option>
                  <option value="DISCIPLINE">تشویقی / انضباطی</option>
                </select>
              </div>
            </div>

            {/* جدول پیامک‌ها */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">گیرنده / شماره همراه</th>
                    <th className="py-3 px-3">دانش‌آموز</th>
                    <th className="py-3 px-3">نوع پیامک</th>
                    <th className="py-3 px-3">متن ارسالی</th>
                    <th className="py-3 px-3">وضعیت تحویل</th>
                    <th className="py-3 px-3">هزینه</th>
                    <th className="py-3 px-3">زمان ارسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{log.recipientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.recipientPhone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{log.studentName || "-"}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.type === "ABSENCE_ALERT"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : log.type === "GRADE_ALERT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : log.type === "HOMEWORK_DUE"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : log.type === "TUITION_REMINDER"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {log.type === "ABSENCE_ALERT"
                            ? "غیبت کلاسی"
                            : log.type === "GRADE_ALERT"
                            ? "افت نمره"
                            : log.type === "HOMEWORK_DUE"
                            ? "یادآوری تکلیف"
                            : log.type === "TUITION_REMINDER"
                            ? "قسط شهریه"
                            : "عمومی"}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-700 font-sans" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تحویل داده شده</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{log.costToman} تومان</td>
                      <td className="py-3 px-3 text-slate-400 text-[10px]">
                        {new Date(log.sentAt).toLocaleDateString("fa-IR")} -{" "}
                        {new Date(log.sentAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* محتوای تب ۳: الگوهای پیامک */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">{tpl.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    فعال
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100 font-sans">
                  {tpl.templateBody}
                </div>
                <button
                  onClick={() => {
                    handleApplyTemplate(tpl);
                    setActiveTab("compose");
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>استفاده در ارسال پیامک</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* محتوای تب ۴: وضعیت اتصال درگاه */}
        {activeTab === "gateway" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">تنظیمات درگاه پیامکی کاوه‌نگار (VIP Trunk)</h3>
                <p className="text-xs text-slate-400">اتصال مستقیم به اپراتور ۱۰۰۰ بدون قطعی در بلک‌لیست مخابرات</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">سرشماره اختصاصی مدرسه:</label>
                <input
                  type="text"
                  readOnly
                  value="10008899"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">کلید وب‌سرویس API Key:</label>
                <input
                  type="password"
                  readOnly
                  value="••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-600"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>وضعیت اتصال: آنلاین و آماده ارسال</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  سامانه پایش داناتک هر ۶۰ ثانیه اتصال به درگاه مخابراتی را بررسی نموده و زمان پینگ فعلی ۵۲ میلی‌ثانیه است.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
