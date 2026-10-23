"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Shield,
  Compass,
  Users,
  Lock,
  FileSpreadsheet,
  Layers,
  Edit3,
  Box,
  Calendar,
  CreditCard,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  Check,
} from "lucide-react";

export default function EndToEndDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      stepNumber: 1,
      role: "TEACHER",
      roleTitle: "دبیر ریاضی (استاد احسان محمدی)",
      title: "گام ۱: داشبورد ماژولار معلم، پورتفولیو و صدور تکلیف تطبیقی",
      desc: "دبیر وارد کلاس دوازدهم ریاضی شده، پروفایل علی رضایی را باز می‌کند، تسلط مبحث مشتق را ارزیابی کرده و با ۱ کلیک تکلیف جبرانی صادر می‌نماید.",
      actionLabel: "ورود به پنل معلم",
      actionHref: "/teacher",
      color: "from-blue-600 to-indigo-700",
      accentBg: "bg-blue-50 border-blue-200 text-blue-900",
      highlights: [
        "صف مداخلات آموزشی و پیشنهاد ۱ کلیکی تکلیف جبرانی",
        "پروفایل ۳ تب دانش‌آموز (اطلاعات فردی، پورتفولیو، عملیات سرفصل)",
        "پنجره ساخت سریع محتوا (Quick Create ⚡) برای آزمون و تکلیف",
        "کشوی تعویض سوال هم‌سطح (Preview & Swap) قبل از ارسال",
      ],
    },
    {
      stepNumber: 2,
      role: "STUDENT",
      roleTitle: "دانش‌آموز (علی رضایی)",
      title: "گام ۲: میز کار دانش‌آموز، حل آنلاین و موتور تمرین تا ۲۰",
      desc: "دانش‌آموز تکالیف خود را مشاهده کرده، تست‌ها را با بازخورد آنی سبز/قرمز (الگوبرداری از ایندورا) حل می‌کند و نسخه چاپی A4 استاندارد مدارس را دریافت می‌نماید.",
      actionLabel: "ورود به میز کار دانش‌آموز",
      actionHref: "/student",
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      highlights: [
        "پاسخگویی آنلاین تست‌ها با اعطای ۳۰ XP و ارتقای استمرار",
        "موتور تمرین تا ۲۰ با فیدبک لحظه‌ای، کادر خط‌چین و پاسخ تشریحی",
        "نسخه پرینت رسمی استاندارد A4 با سربرگ وزارت آموزش و پرورش",
        "فرم ثبت سریع پاسخبرگ ۴ گزینه‌ای آنلاین پس از حل روی کاغذ",
      ],
    },
    {
      stepNumber: 3,
      role: "TEACHER_STUDENT",
      roleTitle: "چرخه تصحیح و یادگیری",
      title: "گام ۳: میز قلم Canvas دبیر، دفترچه اشتباهات و جعبه لایتنر",
      desc: "معلم روی عکس برگه تشریحی با قلم قرمز خط می‌کشد؛ غلط‌های دانش‌آموز خودکار وارد «دفترچه اشتباهات» و «جعبه ۵ خانه لایتنر» می‌شوند.",
      actionLabel: "بررسی دفترچه اشتباهات و لایتنر",
      actionHref: "/student",
      color: "from-rose-600 to-pink-700",
      accentBg: "bg-rose-50 border-rose-200 text-rose-900",
      highlights: [
        "میز تصحیح با ابزار قلم Canvas روی تصویر برگه و ثبت نمره سوالات",
        "دفترچه اشتباهات هوشمند با ریشه‌یابی علل خطا (بی‌دقتی، عدم تسلط)",
        "امکان آزمون مجدد از غلط‌ها با اعطای ۲۰ XP در صورت حل درست",
        "جعبه ۵ خانه فیزیکی لایتنر فرمول‌ها با کارت‌های سه‌بعدی تاشو",
      ],
    },
    {
      stepNumber: 4,
      role: "STUDENT",
      roleTitle: "سامانه آزمون آنلاین ضدتقلب",
      title: "گام ۴: اتاق آزمون شبیه‌ساز کنکور با امنیت چندلایه",
      desc: "برگزاری آزمون تستی با قفل فول‌اسکرین، واترمارک متحرک کدملی، شنود خروج از تب با سلب صلاحیت، محاسبه تراز سنجش و نمره منفی ۱/۳.",
      actionLabel: "مشاهده شبیه‌ساز آزمون ضدتقلب",
      actionHref: "/student",
      color: "from-purple-600 to-violet-800",
      accentBg: "bg-purple-50 border-purple-200 text-purple-900",
      highlights: [
        "واترمارک متحرک شامل نام دانش‌آموز، کدملی و نام دبیرستان علامه حلی ۱",
        "سپر امنیتی مرورگر: ثبت لاگ خروج از تب و تحویل اجباری بعد از ۳ اخطار",
        "پایداری آفلاین در LocalStorage: بدون از دست رفتن پاسخ در قطع نت",
        "محاسبه تراز سازمان سنجش (۳۰۰۰ الی ۸۵۰۰) و انتقال غلط‌ها به اشتباهات",
      ],
    },
    {
      stepNumber: 5,
      role: "PRINCIPAL",
      roleTitle: "مدیر دبیرستان (دکتر مسعود حسینی)",
      title: "گام ۵: ماتریس سلامت مدرسه، نقشه حرارتی، حضور/غیاب و سیدا",
      desc: "مدیر نقشه حرارتی ضعف‌های کل مدرسه را بررسی می‌کند، حضور و غیاب و کارت‌های انضباطی را رصد کرده و فایل اکسل استاندارد سیدا را دانلود می‌نماید.",
      actionLabel: "ورود به داشبورد مدیر مدرسه",
      actionHref: "/principal",
      color: "from-purple-700 to-indigo-800",
      accentBg: "bg-purple-50 border-purple-200 text-purple-900",
      highlights: [
        "نقشه حرارتی ضعف‌های مبحثی مدرسه (School Heatmap) با تفکیک رنگی",
        "رادار تشخیص زودهنگام دانش‌آموزان در وضعیت بحرانی (At-Risk Registry)",
        "فرم سریع حضور و غیاب کلاسی با تفکیک حاضر، غایب و تاخیر",
        "دانلود فایل استاندارد اکسل سیدا (.xlsx) با فرمت دقیق sida.medu.ir",
      ],
    },
    {
      stepNumber: 6,
      role: "PARENT",
      roleTitle: "ولی دانش‌آموز (مهندس حسین رضایی)",
      title: "گام ۶: پورتال اولیا، تردد، گزارش هوشمند هفتگی و پرداخت شهریه",
      desc: "پدر علی گزارش هفتگی مشاوره‌ای را مطالعه می‌کند، ساعت دقیق ورود به مدرسه را می‌بیند، و قسط شهریه را از درگاه شتاب با صدور فیش پرداخت می‌نماید.",
      actionLabel: "ورود به پورتال اولیا",
      actionHref: "/parent",
      color: "from-rose-600 to-pink-700",
      accentBg: "bg-rose-50 border-rose-200 text-rose-900",
      highlights: [
        "گزارش هوشمند هفتگی جمعه‌ها (Smart Parent Digest) با راهنمای عملی",
        "تایم‌لاین تردد و ثبت ورود ساعت ۰۷:۲۴ صبح به دبیرستان",
        "جدول اقساط شهریه و شبیه‌ساز پرداخت آنلاین با صدور کد پیگیری",
        "صندوق آرشیو پیامک‌های خدماتی ارسال‌شده از خط رسمی مدرسه",
      ],
    },
    {
      stepNumber: 7,
      role: "COUNSELOR",
      roleTitle: "مشاور ارشد تحصیلی (خانم مریم صابری)",
      title: "گام ۷: رصد ساعات مطالعه و دستیار هوشمند برنامه‌ریزی هفتگی",
      desc: "مشاور ساعات مطالعه و تست‌های هفتگی را رصد کرده، جدول هفتگی را با هوش مصنوعی بر اساس نقاط ضعف رادار تنظیم می‌کند و به دانش‌آموز ابلاغ می‌نماید.",
      actionLabel: "ورود به پنل مشاور تحصیلی",
      actionHref: "/counselor",
      color: "from-amber-600 to-orange-700",
      accentBg: "bg-amber-50 border-amber-200 text-amber-900",
      highlights: [
        "رصد ساعات مطالعه و تست روزانه دانش‌آموزان به تفکیک دروس",
        "دستیار هوشمند تدوین جدول هفتگی (AI Study Planner) متناسب با رادار",
        "ابلاغ برنامه به دانش‌آموز و ثبت لاگ مطالعه روزانه همراه با +۱۰ XP",
        "مدیریت پرونده‌های ارجاعی وضعیت قرمز و ارسال پیامک دعوت اولیا",
      ],
    },
  ];

  const current = demoSteps[currentStep];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-10 space-y-8">
      {/* هدر بالایی تور دمو */}
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              سناریوی جامع دمو (End-to-End Walkthrough)
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 rounded-full">
              روز دهم (تکمیل ۱۰۰٪)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            تور تعاملی سناریوی یکپارچه داناتک (سامانه هوشمند تسلط و ارتقای تحصیلی)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مرور چرخه کامل یادگیری و مدیریت از معلم به دانش‌آموز، مدیر، اولیا و مشاور در ۷ گام عملی
          </p>
        </div>

        <Link
          href="/"
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به صفحه اصلی
        </Link>
      </div>

      {/* نوار ناوبری گام‌های ۷‌گانه دمو */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {demoSteps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`flex-1 min-w-[130px] p-3 rounded-2xl border text-right transition ${
              currentStep === idx
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 font-black"
                : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <div className="text-[10px] opacity-75 font-mono">گام {step.stepNumber} از ۷</div>
            <div className="text-xs font-bold truncate mt-0.5">{step.roleTitle}</div>
          </button>
        ))}
      </div>

      {/* کارت تعاملی گام جاری */}
      <div className="max-w-5xl mx-auto bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
              بخش {current.stepNumber} از ۷ • {current.roleTitle}
            </span>
            <h2 className="text-xl font-black text-white">{current.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{current.desc}</p>
          </div>

          <Link
            href={current.actionHref}
            className={`px-5 py-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r ${current.color} shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2`}
          >
            <Play className="w-4 h-4 fill-white" />
            {current.actionLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ویژگی‌ها و شواهد فنی این گام */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-3">
          <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            قابلیت‌های کلیدی مستقر و آماده تست در این گام:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* دکمه‌های ناوبری گام بعدی و قبلی */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/80">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
            گام قبلی
          </button>

          <span className="text-xs font-mono text-slate-400">
            صفحه {currentStep + 1} از ۷
          </span>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(demoSteps.length - 1, prev + 1))}
            disabled={currentStep === demoSteps.length - 1}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
          >
            گام بعدی
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* کارت جمع‌بندی ۵ نقش کاربری */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/teacher"
          className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold block text-white">۱. پنل معلم</span>
          <span className="text-[10px] text-slate-400 block">تدریس و تصحیح</span>
        </Link>

        <Link
          href="/student"
          className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold block text-white">۲. پنل دانش‌آموز</span>
          <span className="text-[10px] text-slate-400 block">تمرین، لایتنر، آزمون</span>
        </Link>

        <Link
          href="/principal"
          className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold block text-white">۳. پنل مدیر</span>
          <span className="text-[10px] text-slate-400 block">ماتریس سلامت و سیدا</span>
        </Link>

        <Link
          href="/counselor"
          className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold block text-white">۴. پنل مشاور</span>
          <span className="text-[10px] text-slate-400 block">برنامه‌ریزی و هدایت</span>
        </Link>

        <Link
          href="/parent"
          className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold block text-white">۵. پنل اولیا</span>
          <span className="text-[10px] text-slate-400 block">گزارش هفتگی و شهریه</span>
        </Link>
      </div>
    </div>
  );
}
