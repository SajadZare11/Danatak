"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronLeft,
} from "lucide-react";
import { OfficialReportCardModal } from "@/components/report-card/OfficialReportCardModal";
import { CollapsibleDashboardCard } from "@/components/common/CollapsibleDashboardCard";

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  // وضعیت باز/بسته بودن ۴ کارت کشویی (تماماً بسته در بدو ورود طبق انتخاب کاربر)
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    digest: false,
    commute: false,
    tuition: false,
    sms: false,
  });

  const toggleCard = (cardKey: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

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
          <p className="text-sm font-bold text-slate-700">در حال بارگذاری درگاه هوشمند اولیا...</p>
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
      {/* اعلان‌های سیستم */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ۱. هدر بالایی درگاه اولیا */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        {/* اکشن‌های سریع */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsReportCardOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>کارنامه رسمی مدرسه</span>
          </button>

          <Link
            href="/messages"
            className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span>پیام به کادر مدرسه</span>
          </Link>
        </div>
      </div>

      {/* فیش پرداخت موفق */}
      {paymentSuccessReceipt && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black">رسید پرداخت آنلاین موفق (شبکه شتاب)</h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                قسط: {paymentSuccessReceipt.title} • کد پیگیری: <span className="font-mono font-bold">{paymentSuccessReceipt.trackingCode}</span> • تاریخ: {paymentSuccessReceipt.paymentDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessReceipt(null)}
            className="text-xs font-bold bg-white text-emerald-800 px-3 py-1 rounded-xl border border-emerald-300 hover:bg-emerald-100 transition"
          >
            بستن رسید
          </button>
        </div>
      )}

      {/* ۲. کارت‌های شاخص‌های کلیدی فرزند */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">ساعات مطالعه هفته</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-700 font-mono">{digest.totalWeeklyHours} ساعت</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ثبت لاگ هفتگی</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">تست‌های حل‌شده</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">{digest.totalWeeklyTests} تست</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">تمرین و آزمون آنلاین</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">انجام تکالیف</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-600 font-mono">{digest.homeworkCompletionRate}٪</div>
          <div className="text-[10px] text-blue-700 mt-0.5">نرخ تحویل به موقع</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold">تسویه شهریه</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 font-mono">{tuition.paymentPercentage}٪</div>
          <div className="text-[10px] text-amber-700 mt-0.5">{tuition.status}</div>
        </div>
      </div>

      {/* راهنمای کوتاه شروع */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">
          💡 برای مشاهده وضعیت تحصیلی، تردد، شهریه یا پیام‌های مدرسه، روی هر کارت کلیک کنید:
        </span>
        <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-block">
          ۴ بخش پورتال اولیا
        </span>
      </div>

      {/* ===================================================================== */}
      {/* ساختار ۴ کارتی کشویی پورتال اولیا (تماماً بسته در بدو ورود) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* کارت ۱: گزارش هوشمند وضعیت تحصیلی و کارنامه */}
        <CollapsibleDashboardCard
          id="parent-card-digest"
          title="۱. گزارش هوشمند تحصیلی و کارنامه"
          subtitle={`سطح یادگیری فرزند: ${digest.academicLevel} (${digest.avgMastery}٪ تسلط) • تحلیل مشاور و راهنمای خانواده`}
          icon={<Sparkles className="w-6 h-6" />}
          colorScheme="indigo"
          badge={
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              تسلط {digest.avgMastery}٪
            </span>
          }
          isOpen={openCards.digest}
          onToggle={() => toggleCard("digest")}
        >
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  گزارش تحلیلی مشاور مدرسه
                </span>
                <span className="text-slate-400">{student.schoolName}</span>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1">راهنمای عملی خانواده:</span>
                {digest.actionableAdvice}
              </div>

              {digest.latestExam && (
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-white/10">
                  <span className="text-slate-300">
                    آخرین آزمون: <strong className="text-white">{digest.latestExam.title}</strong>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg font-bold">
                    درصد: {digest.latestExam.percentage}٪
                  </span>
                  <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-lg font-bold">
                    تراز: {digest.latestExam.taraz}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  بالاترین تسلط (نقطه قوت):
                </span>
                <h5 className="font-black text-slate-900">{digest.strongestTopic}</h5>
                <p className="text-[11px] text-slate-500">تسلط بالای ۸۵٪ بدون نیاز به مداخله تقویتی</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  سرفصل نیازمند تمرین بیشتر:
                </span>
                <h5 className="font-black text-slate-900">{digest.focusTopic}</h5>
                <p className="text-[11px] text-slate-500">تمرین‌های جبرانی در برنامه هفتگی قرار داده شده است</p>
              </div>
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۲: تردد، ورود و خروج و حضور/غیاب */}
        <CollapsibleDashboardCard
          id="parent-card-commute"
          title="۲. تردد، ورود و خروج و حضور/غیاب"
          subtitle={`${attendance.attendanceRate}٪ نرخ حضور • ${attendance.presentsCount} جلسه حاضر • ${attendance.absentsCount} غیبت و ${attendance.latesCount} تاخیر`}
          icon={<Clock className="w-6 h-6" />}
          colorScheme="rose"
          badge={
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {attendance.attendanceRate}٪ حضور
            </span>
          }
          isOpen={openCards.commute}
          onToggle={() => toggleCard("commute")}
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-bold">
              <span>گزارش آخرین ترددها:</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700">حاضر: {attendance.presentsCount}</span>
                <span className="text-amber-700">تاخیر: {attendance.latesCount}</span>
                <span className="text-rose-700">غایب: {attendance.absentsCount}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {attendance.commuteTimeline.map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        item.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "LATE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.status === "PRESENT" ? "✓" : item.status === "LATE" ? "!" : "✕"}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{item.dateFa}</span>
                      <span className="text-[11px] text-slate-500 mr-2">{item.note}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 text-[11px]">{item.timeFa}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "LATE"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.status === "PRESENT" ? "حاضر" : item.status === "LATE" ? `تاخیر` : "غایب"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۳: امور مالی، شهریه و پرداخت آنلاین اقساط */}
        <CollapsibleDashboardCard
          id="parent-card-tuition"
          title="۳. امور مالی، شهریه و پرداخت آنلاین اقساط"
          subtitle={`${tuition.paidCount} از ${tuition.totalInstallments} قسط پرداخت شده • مانده حساب: ${tuition.remainingAmount.toLocaleString("fa-IR")} تومان`}
          icon={<CreditCard className="w-6 h-6" />}
          colorScheme="emerald"
          badge={
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {tuition.status}
            </span>
          }
          isOpen={openCards.tuition}
          onToggle={() => toggleCard("tuition")}
        >
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">شهریه کل مصوب:</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {tuition.totalAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">پرداخت شده:</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {tuition.paidAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">مانده قابل پرداخت:</span>
                <span className="text-base font-black text-rose-700 font-mono">
                  {tuition.remainingAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">قسط</th>
                    <th className="py-2.5 px-4 text-right">عنوان</th>
                    <th className="py-2.5 px-3">مبلغ (تومان)</th>
                    <th className="py-2.5 px-3">سررسید</th>
                    <th className="py-2.5 px-3">وضعیت</th>
                    <th className="py-2.5 px-4">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tuition.installments.map((inst: any) => (
                    <tr key={inst.installmentNumber} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-slate-400 font-bold">{inst.installmentNumber}</td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">{inst.title}</td>
                      <td className="py-2.5 px-3 font-bold font-mono text-slate-800">
                        {inst.amount.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{inst.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <td className="py-2.5 px-4">
                        {inst.status === "PAID" ? (
                          <span className="text-[11px] text-emerald-700 font-bold">پرداخت در {inst.paymentDate}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePayInstallment(inst.installmentNumber)}
                            disabled={payingInstallment === inst.installmentNumber}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto shadow-2xs disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{payingInstallment === inst.installmentNumber ? "در حال اتصال..." : "پرداخت آنلاین"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleDashboardCard>

        {/* کارت ۴: پیامک‌های مدرسه و ارتباط با کادر آموزشی */}
        <CollapsibleDashboardCard
          id="parent-card-sms"
          title="۴. پیامک‌های مدرسه و ارتباط با کادر آموزشی"
          subtitle={`${smsLogs.length} پیامک رسمی ارسال‌شده به خط ولی دانش‌آموز • کانال ارتباطی مستقیم`}
          icon={<MessageSquare className="w-6 h-6" />}
          colorScheme="purple"
          badge={
            <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
              {smsLogs.length} پیامک
            </span>
          }
          isOpen={openCards.sms}
          onToggle={() => toggleCard("sms")}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>آرشیو پیامک‌های ارسالی از سامانه پیامکی دبیرستان:</span>
              <Link
                href="/messages"
                className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>ارسال پیام مستقیم به مشاور و دبیران</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
              {smsLogs.map((sms: any) => (
                <div key={sms.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {sms.type === "WEEKLY_DIGEST"
                        ? "گزارش هفتگی هوشمند مشاور"
                        : sms.type === "COMMUTE_ALERT"
                        ? "اطلاع‌رسانی تردد و حضور"
                        : sms.type === "ABSENCE_ALERT"
                        ? "هشدار غیبت کلاسی"
                        : "اطلاعیه مالی و شهریه"}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{sms.dateFa} - {sms.timeFa}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {sms.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleDashboardCard>
      </div>

      {/* مودال کارنامه رسمی */}
      <OfficialReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        studentId={student.id}
      />
    </div>
  );
}
