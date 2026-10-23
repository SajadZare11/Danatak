"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Award,
  Clock,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Check,
  Shield,
  Send,
  Download,
  AlertCircle,
  Receipt,
  GraduationCap,
} from "lucide-react";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"digest" | "commute" | "tuition" | "sms">("digest");
  const [data, setData] = useState<any | null>(null);

  // وضعیت پرداخت آنلاین قسط شهریه
  const [payingInstallment, setPayingInstallment] = useState<number | null>(null);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any | null>(null);

  // کارنامه رسمی
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);

  // پیام اعلان
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchParentData = async () => {
    try {
      const res = await fetch("/api/parent/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error("Failed to load parent dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">در حال بارگذاری درگاه هوشمند اولیا و پرونده تحصیلی فرزند...</p>
        </div>
      </div>
    );
  }

  const { parent, student, digest, attendance, tuition, smsLogs } = data;

  const handlePayInstallment = async (installmentNumber: number) => {
    if (!tuition?.id) return;
    setPayingInstallment(installmentNumber);
    try {
      const res = await fetch("/api/parent/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tuitionId: tuition.id,
          installmentNumber,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setPaymentSuccessReceipt(result.receipt);
        showToast("قسط با موفقیت از طریق درگاه امن شتاب پرداخت شد و فیش تایید صادر گردید.");
        fetchParentData();
      } else {
        const err = await res.json();
        showToast(err.error || "خطا در انجام تراکنش پرداخت.");
      }
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPayingInstallment(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* هدر بالایی درگاه اولیا */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-md">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">پورتال اختصاصی اولیای گرامی</h1>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {parent.fullName} ({parent.relation})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              فرزند: <span className="font-bold text-slate-800">{student.fullName}</span> • {student.className} • {student.schoolName}
            </p>
          </div>
        </div>

        {/* اکشن‌های سریع ولی */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsReportCardOpen(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            مشاهده کارنامه رسمی آموزش و پرورش
          </button>

          <button
            onClick={() => setActiveTab("tuition")}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            پرداخت شهریه و اقساط
          </button>
        </div>
      </div>

      {/* اعلان‌های سیستم */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* مودال فیش پرداخت موفق */}
      {paymentSuccessReceipt && (
        <div className="p-5 bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">رسید پرداخت آنلاین موفق (شبکه شتاب)</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                قسط: {paymentSuccessReceipt.title} • کد پیگیری: <span className="font-mono font-bold">{paymentSuccessReceipt.trackingCode}</span> • تاریخ: {paymentSuccessReceipt.paymentDate}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPaymentSuccessReceipt(null)}
            className="text-xs font-bold bg-white text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-300 hover:bg-emerald-100 transition"
          >
            بستن رسید
          </button>
        </div>
      )}

      {/* نوار کارت‌های شاخص‌های کلیدی فرزند */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">ساعات مطالعه این هفته</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-700 font-mono">{digest.totalWeeklyHours} ساعت</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ثبت‌شده در لاگ هفتگی</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">تعداد تست‌های حل‌شده</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">{digest.totalWeeklyTests} تست</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">تمرین و آزمون آنلاین</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">نرخ تحویل تکالیف</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 font-mono">{digest.homeworkCompletionRate}٪</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">تمام تکالیف تحویل شده</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">وضعیت تسویه شهریه</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">{tuition.paymentPercentage}٪</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">وضعیت حساب: {tuition.status}</div>
        </div>
      </div>

      {/* تب‌های ناوبری پورتال اولیا */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("digest")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "digest"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          گزارش هوشمند هفتگی (Smart Parent Digest)
        </button>

        <button
          onClick={() => setActiveTab("commute")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "commute"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4 text-blue-500" />
          تردد، ورود/خروج و حضور/غیاب
        </button>

        <button
          onClick={() => setActiveTab("tuition")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "tuition"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-500" />
          امور مالی، شهریه و اقساط
        </button>

        <button
          onClick={() => setActiveTab("sms")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "sms"
              ? "bg-rose-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-500" />
          صندوق پیامک‌های خدماتی مدرسه ({smsLogs.length})
        </button>
      </div>

      {/* تب ۱: گزارش هوشمند هفتگی (Smart Parent Digest) */}
      {activeTab === "digest" && (
        <div className="space-y-6">
          {/* کارت خلاصه عملکرد و راهنمای عملی اولیا */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full font-bold">
                  گزارش تحلیلی جمعه ۲۷ مهر ماه
                </span>
                <span className="text-xs text-indigo-200 font-medium">دبیرستان علامه حلی ۱</span>
              </div>

              <h3 className="text-lg font-black text-white">خلاصه وضعیت آموزشی و پیشرفت هفتگی فرزند شما</h3>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs leading-relaxed text-indigo-100">
                <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  راهنمای عملی خانواده (Actionable Advice):
                </p>
                {digest.actionableAdvice}
              </div>

              {digest.latestExam && (
                <div className="flex items-center gap-4 text-xs pt-2">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl">
                    آخرین آزمون: <span className="font-bold text-white">{digest.latestExam.title}</span>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl font-bold">
                    درصد با احتساب نمره منفی: {digest.latestExam.percentage}٪
                  </div>
                  <div className="bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-xl font-bold">
                    تراز کنکوری: {digest.latestExam.taraz}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* دو کارت تفکیک نقاط قوت و مباحث تمرکزی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                بالاترین سطح تسلط مفهومی (نقطه قوت):
              </div>
              <h4 className="text-base font-black text-slate-900">{digest.strongestTopic}</h4>
              <p className="text-xs text-slate-500">
                فرزند شما در این سرفصل به تسلط بالای ۸۵٪ دست یافته و نیازی به کلاس تقویتی ندارد.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                سرفصل نیازمند تمرین بیشتر (اولویت تقویت):
              </div>
              <h4 className="text-base font-black text-slate-900">{digest.focusTopic}</h4>
              <p className="text-xs text-slate-500">
                مشاور مدرسه بسته‌ای از تمرین‌های تکمیلی برای این مبحث در برنامه هفتگی قرار داده است.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: تردد، ورود/خروج و حضور/غیاب فرزند */}
      {activeTab === "commute" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">گزارش لحظه‌ای تردد و حضور در مدرسه</h3>
              <p className="text-xs text-slate-500 mt-1">
                ثبت ورود و خروج الکترونیک به همراه لاگ غیبت و تاخیر کلاسی
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                حاضر: {attendance.presentsCount} جلسه
              </span>
              <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
                تاخیر: {attendance.latesCount} جلسه
              </span>
              <span className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200">
                غایب: {attendance.absentsCount} جلسه
              </span>
            </div>
          </div>

          {/* تایم‌لاین جلسات */}
          <div className="divide-y divide-slate-100">
            {attendance.commuteTimeline.map((item: any) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      item.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "LATE"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.status === "PRESENT" ? "✓" : item.status === "LATE" ? "!" : "✕"}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{item.dateFa}</h5>
                    <p className="text-[11px] text-slate-500">{item.note}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-600 text-[11px]">{item.timeFa}</span>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                      item.status === "PRESENT"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.status === "LATE"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.status === "PRESENT" ? "حاضر به موقع" : item.status === "LATE" ? `تاخیر (${item.delayMinutes} د)` : "غیبت"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تب ۳: امور مالی و شهریه دبیرستان */}
      {activeTab === "tuition" && (
        <div className="space-y-6">
          {/* کارت وضعیت حساب مالی */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-xs text-slate-500 block mb-1">شهریه مصوب سال تحصیلی ۱۴۰۳-۱۴۰۴</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">
                {tuition.totalAmount.toLocaleString("fa-IR")} تومان
              </h3>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-emerald-600 block mb-1 font-bold">پرداخت‌شده:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {tuition.paidAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div>
                <span className="text-[11px] text-rose-600 block mb-1 font-bold">مانده قابل پرداخت:</span>
                <span className="text-lg font-black text-rose-700 font-mono">
                  {tuition.remainingAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
          </div>

          {/* جدول اقساط و چک‌های صیادی */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-900">جدول سررسید اقساط و چک‌های صیادی</h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="py-3 px-3">شماره قسط</th>
                    <th className="py-3 px-4 text-right">عنوان قسط و مرحله</th>
                    <th className="py-3 px-3">مبلغ (تومان)</th>
                    <th className="py-3 px-3">تاریخ سررسید</th>
                    <th className="py-3 px-3">کد رهگیری / چک</th>
                    <th className="py-3 px-3">وضعیت</th>
                    <th className="py-3 px-4">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tuition.installments.map((inst: any) => (
                    <tr key={inst.installmentNumber} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-bold text-slate-400">{inst.installmentNumber}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{inst.title}</td>
                      <td className="py-3 px-3 font-black font-mono text-slate-800">
                        {inst.amount.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{inst.dueDate}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {inst.trackingCode || "-"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inst.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : inst.status === "OVERDUE"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inst.status === "PAID" ? "تسویه شده ✓" : inst.status === "OVERDUE" ? "معوق ⚠️" : "در انتظار پرداخت"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {inst.status === "PAID" ? (
                          <span className="text-[11px] text-emerald-700 font-bold">پرداخت در {inst.paymentDate}</span>
                        ) : (
                          <button
                            onClick={() => handlePayInstallment(inst.installmentNumber)}
                            disabled={payingInstallment === inst.installmentNumber}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 mx-auto shadow-xs disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingInstallment === inst.installmentNumber ? "در حال اتصال به شتاب..." : "پرداخت آنلاین شتاب"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۴: صندوق پیامک‌های خدماتی مدرسه */}
      {activeTab === "sms" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-black text-slate-900">صندوق پیامک‌های خدماتی و اطلاع‌رسانی مدرسه</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              آرشیو پیامک‌های ارسالی از خط خدماتی مدرسه به شماره همراه ولی ({parent.phoneNumber})
            </p>
          </div>

          <div className="space-y-3">
            {smsLogs.map((sms: any) => (
              <div
                key={sms.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-800">
                      {sms.type === "WEEKLY_DIGEST"
                        ? "گزارش هفتگی هوشمند مشاور"
                        : sms.type === "COMMUTE_ALERT"
                        ? "اطلاع‌رسانی تردد و ورود به مدرسه"
                        : sms.type === "ABSENCE_ALERT"
                        ? "هشدار غیبت کلاسی"
                        : "اطلاعیه مالی و شهریه"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <span>{sms.dateFa}</span>
                    <span>ساعت {sms.timeFa}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {sms.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مودال کارنامه رسمی */}
      <OfficialReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        studentId={student.id}
      />
    </div>
  );
}
