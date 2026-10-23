"use client";

import React from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  GraduationCap,
  Briefcase,
  Shield,
  Compass,
  Users,
  BookOpen,
  Layers,
  FileCheck2,
  Lock,
  FileSpreadsheet,
  Zap,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Edit3,
  Box,
  CreditCard,
  Calendar,
  Smartphone,
  Server,
  Play,
  HeartHandshake,
  BarChart3,
  MessageSquare,
  BookMarked,
  Video,
  Award,
} from "lucide-react";

export default function HomePage() {
  const { currentRole, currentUser } = useRole();

  const modules = [
    {
      id: "module-1",
      title: "۱. پنل ماژولار معلم و پروفایل ۳ تب",
      desc: "مسیر معلم ⬅ لیست کلاس ⬅ پروفایل ۳ تب دانش‌آموز (اطلاعات، پورتفولیو، ثبت درصد یادگیری و تکلیف جبرانی) + صف مداخلات و تصحیح و مودال ⚡",
      icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
      tag: "روز ۱ و ۲ (عملیاتی)",
      status: "ورود به پنل معلم",
      href: "/teacher",
      isReady: true,
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "module-2",
      title: "۲. رادار تسلط و گراف پیش‌نیازها",
      desc: "نمودار راداری عنکبوتی Recharts، گراف پیوسته پیش‌نیازها از دهم تا دوازدهم و موتور عارضه‌یابی ریشه‌ای ضعف با تست تشخیصی",
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      tag: "روز ۳ (عملیاتی)",
      status: "ورود به رادار و گراف تسلط",
      href: "/mastery",
      isReady: true,
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      id: "module-3",
      title: "۳. بانک سوالات و استودیوی KaTeX",
      desc: "دسته‌بندی چندسطحی بر اساس کتاب و مبحث، جعبه‌ابزار فرمول‌نویس KaTeX با پیش‌نمایش آنی، ورود گروهی JSON و پاسخنامه کلیدی/تشریحی",
      icon: <BookOpen className="w-5 h-5 text-teal-600" />,
      tag: "روز ۴ (عملیاتی)",
      status: "ورود به بانک سوالات",
      href: "/questions",
      isReady: true,
      badgeColor: "bg-teal-100 text-teal-800",
    },
    {
      id: "module-4",
      title: "۴. تکلیف هوشمند دو منظوره و تمرین تا ۲۰",
      desc: "صدور تکلیف تطبیقی معلم با کشوی تعویض سوال (Preview & Swap)، کارتابل دانش‌آموز، حل آنلاین، نسخه پرینتی A4 با هدر استاندارد مدارس، ثبت سریع پاسخ‌برگ و موتور تمرین تا ۲۰ ایندورا",
      icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
      tag: "روز ۵ (عملیاتی)",
      status: "ورود به کارتابل تکالیف",
      href: "/student",
      isReady: true,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "module-5",
      title: "۵. میز قلم‌گذاری، دفترچه اشتباهات و لایتنر ۵ خانه",
      desc: "میز تصحیح یکپارچه معلم با ابزار قلم Canvas روی برگه، انتقال خودکار غلط‌ها به دفترچه اشتباهات دانش‌آموز با تگ‌گذاری ریشه‌ای، و سیستم مرور فاصله‌دار لایتنر",
      icon: <Edit3 className="w-5 h-5 text-rose-600" />,
      tag: "روز ۶ (عملیاتی)",
      status: "ورود به دفترچه اشتباهات و لایتنر",
      href: "/student",
      isReady: true,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: "module-6",
      title: "۶. آزمون آنلاین ضدتقلب و تراز کنکوری",
      desc: "اتاق آزمون با قفل تمام‌صفحه، مانیتورینگ خروج از تب با سلب صلاحیت خودکار، واترمارک شناور کدملی، کش آفلاین LocalStorage، نمره منفی ۱/۳ و تراز سنجش",
      icon: <Lock className="w-5 h-5 text-purple-600" />,
      tag: "روز ۷ (عملیاتی)",
      status: "ورود به آزمون ضدتقلب",
      href: "/student",
      isReady: true,
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      id: "module-7",
      title: "۷. ماتریس سلامت مدرسه، سیدا و انضباط",
      desc: "داشبورد ارشد مدیر، نقشه حرارتی نقاط کور یادگیری، رجیستری دانش‌آموزان لب مرز افت، حضور/غیاب سریع، کارتکس انضباط و صدور فایل اکسل رسمی سیدا",
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />,
      tag: "روز ۸ (عملیاتی)",
      status: "ورود به پنل مدیر و سیدا",
      href: "/principal",
      isReady: true,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "module-8",
      title: "۸. پرتال مشاور و برنامه‌ریز مطالعاتی AI",
      desc: "نظارت بر ساعت مطالعه هفتگی و تراز، تحلیل عارضه‌یابی و ابزار تولید خودکار جدول برنامه مطالعاتی هفتگی هوشمند منطبق بر نقاط ضعف کارنامه",
      icon: <Compass className="w-5 h-5 text-cyan-600" />,
      tag: "روز ۹ (عملیاتی)",
      status: "ورود به پنل مشاور تحصیلی",
      href: "/counselor",
      isReady: true,
      badgeColor: "bg-cyan-100 text-cyan-800",
    },
    {
      id: "module-9",
      title: "۹. پورتال اولیا، اقساط شهریه و پیامک",
      desc: "خلاصه وضعیت هوشمند دانش‌آموز برای والدین، رهگیری تردد، کارت مالی اقساط و شبیه‌ساز پرداخت آنلاین شاپرک/شتاب و لاگ دیسپچ پیامک",
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      tag: "روز ۹ (عملیاتی)",
      status: "ورود به پورتال اولیا",
      href: "/parent",
      isReady: true,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "module-10",
      title: "۱۰. تور جامع تعاملی و اپلیکیشن PWA ملی",
      desc: "سناریوی گام‌به‌گام ۷ مرحله‌ای End-to-End، نصب آسان PWA بدون نیاز به استور، استقرار ۱۰۰٪ لوکال منطبق بر اینترانت ملی بدون هیچ وابستگی خارجی",
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      tag: "روز ۱۰ (فینال)",
      status: "شروع تور تعاملی جامع",
      href: "/demo",
      isReady: true,
      badgeColor: "bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 border border-amber-300 font-black",
    },
    {
      id: "module-11",
      title: "۱۱. داشبورد ارزیابی آماری و روان‌سنجی نمرات (SPSS Suite)",
      desc: "محاسبه انحراف معیار، CV، منحنی نرمال گاوسی، نمودار جعبه‌ای چارک‌ها، رگرسیون همبستگی مطالعه با نمره، پایایی آلفای کرونباخ، غربالگری تریاژ و صدور کارنامه چاپی A4",
      icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
      tag: "سوئیت آماری جامع",
      status: "ورود به داشبورد تحلیلی نمرات",
      href: "/analytics",
      isReady: true,
      badgeColor: "bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold",
    },
    {
      id: "module-12",
      title: "۱۲. پیام‌رسان داخلی و تالار رفع اشکال علمی",
      desc: "کانال اعلانات رسمی مدرسه، تالار پرسش‌وپاسخ درسی با پشتیبانی فرمول‌نویسی KaTeX، و ارتباط مستقیم و محرمانه اولیا با کادر دبیرستان",
      icon: <MessageSquare className="w-5 h-5 text-cyan-500" />,
      tag: "ارتباطات چندطرفه",
      status: "ورود به پیام‌رسان و رفع اشکال",
      href: "/messages",
      isReady: true,
      badgeColor: "bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold",
    },
    {
      id: "module-13",
      title: "۱۳. برنامه هفتگی کلاسی و تقویم تحصیلی هوشمند",
      desc: "جدول ساعات درسی شنبه تا چهارشنبه (زنگ‌های ۱ تا ۴)، رصد زنده زنگ در حال برگزاری، تقویم زمانی امتحانات و یادآور مهلت تکالیف",
      icon: <Calendar className="w-5 h-5 text-amber-500" />,
      tag: "مدیریت زمان و تقویم",
      status: "مشاهده برنامه و تقویم",
      href: "/schedule",
      isReady: true,
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
    },
    {
      id: "module-14",
      title: "۱۴. کتابخانه دیجیتال، مخزن جزوات و اسناد آموزشی",
      desc: "مطالعه و پیش‌نمایش مستقیم PDF درون مرورگر، دسته‌بندی ۳ سطحی کتب رسمی و جزوات طلایی دبیران، و آرشیو نمونه‌سوالات نهایی و کنکور",
      icon: <BookMarked className="w-5 h-5 text-emerald-500" />,
      tag: "مخزن محتوا و جزوه‌سرا",
      status: "ورود به کتابخانه دیجیتال",
      href: "/library",
      isReady: true,
      badgeColor: "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold",
    },
    {
      id: "module-15",
      title: "۱۵. سامانه هوشمند پیامک و هشدارهای خودکار اولیا (SMS Gateway)",
      desc: "ارسال آنی پیامک غیبت زنده، افت تراز در آزمون، سررسید اقساط شهریه، شبیه‌ساز زنده موبایل، و خروجی فایل اکسل گزارش ارسالی‌ها",
      icon: <Smartphone className="w-5 h-5 text-rose-500" />,
      tag: "اطلاع‌رسانی پیامکی و هشدارهای آنی",
      status: "ورود به مرکز پیامک و خروجی اکسل",
      href: "/sms",
      isReady: true,
      badgeColor: "bg-rose-100 text-rose-900 border border-rose-300 font-bold",
    },
    {
      id: "module-17",
      title: "۱۶. کلاس آنلاین تصویری، تخته هوشمند و اشتراک اسلاید (Virtual Classroom)",
      desc: "برگزاری کلاس زنده با وب‌کم دبیر و دانش‌آموز، تخته سفید با درج فرمول‌های KaTeX، اشتراک صفحات کتاب درسی، چت زنده، دست بلند کردن و آرشیو ضبط جلسه",
      icon: <Video className="w-5 h-5 text-purple-500" />,
      tag: "آموزش مجازی و وبینار تعاملی",
      status: "ورود به کلاس آنلاین زنده",
      href: "/classroom",
      isReady: true,
      badgeColor: "bg-purple-100 text-purple-900 border border-purple-300 font-bold",
    },
    {
      id: "module-18",
      title: "۱۷. سامانه ارزشیابی ۳۶۰ درجه عملکرد دبیران (Teacher 360 Evaluation)",
      desc: "نظرسنجی محرمانه اولیا و دانش‌آموزان در ۶ شاخص استاندارد، نمودار راداری عملکرد، تحلیل هوش مصنوعی و صدور کارنامه چاپی A4",
      icon: <Award className="w-5 h-5 text-amber-500" />,
      tag: "نظارت کیفی و تعالی آموزش",
      status: "ورود به ارزشیابی و کارنامه A4",
      href: "/evaluation",
      isReady: true,
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* بنر گرند فیناله و هدایت به سناریوی جامع دمو */}
      <section className="bg-gradient-to-l from-indigo-950 via-indigo-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 text-amber-300 border border-amber-400/40 text-xs px-3.5 py-1.5 rounded-full font-bold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>پایان موفقیت‌آمیز فاز نهایی (روز ۱۰): سامانه ۱۰۰٪ تکمیل و آماده تحویل است</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              درود، {currentUser.fullName} عزیز! 👋
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              به سامانه «داناتک»؛ سامانه هوشمند تسلط و ارتقای تحصیلی (با الگوبرداری از استانداردهای نوین آموزشی و مدارس سمپاد) خوش آمدید. کلیه ماژول‌های ۵ نقش (معلم، دانش‌آموز، مدیر، مشاور، اولیا) و زیرساخت PWA و اینترانت ملی با موفقیت مستقر شده و یکپارچه می‌باشند.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 border border-amber-300"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                اجرای سناریوی دمو تعاملی (End-to-End Tour)
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md transition border border-indigo-400/30"
              >
                <BarChart3 className="w-4 h-4 text-amber-300" />
                داشبورد آمار و روان‌سنجی نمرات (SPSS)
              </Link>
              <Link
                href="/student"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
              >
                <GraduationCap className="w-4 h-4" />
                میز کار دانش‌آموز و لایتنر
              </Link>
              <Link
                href="/teacher"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
              >
                <Briefcase className="w-4 h-4" />
                میز قلم‌گذاری دبیر
              </Link>
              <Link
                href="/principal"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-2xl border border-slate-700 shadow-md transition"
              >
                <Shield className="w-4 h-4" />
                مدیر و صدور سیدا
              </Link>
              <Link
                href="/counselor"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <Compass className="w-4 h-4" />
                مشاور و هوش مصنوعی
              </Link>
              <Link
                href="/parent"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <Users className="w-4 h-4" />
                پورتال اولیا و شتاب
              </Link>
              <Link
                href="/messages"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                پیام‌ها و رفع اشکال
              </Link>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                برنامه و تقویم
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <BookMarked className="w-4 h-4 text-emerald-400" />
                کتابخانه و جزوات
              </Link>
              <Link
                href="/sms"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition"
              >
                <Smartphone className="w-4 h-4 text-rose-400" />
                سامانه هوشمند پیامک
              </Link>
              <Link
                href="/classroom"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-2xl border border-rose-400/40 transition shadow-lg animate-pulse"
              >
                <Video className="w-4 h-4 text-white" />
                کلاس آنلاین زنده 🔴
              </Link>
              <Link
                href="/evaluation"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-2xl border border-amber-400/40 transition shadow-md"
              >
                <Award className="w-4 h-4 text-amber-400" />
                ارزشیابی دبیران ⭐
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/15 shadow-xl">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-14 h-14 rounded-full border-2 border-amber-400 shadow-md bg-slate-800"
              />
              <div>
                <div className="font-bold text-base text-white">{currentUser.fullName}</div>
                <div className="text-xs text-indigo-200">کد ملی: {currentUser.nationalId}</div>
                <div className="text-xs text-slate-300 mt-0.5">{currentUser.description}</div>
              </div>
            </div>

            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-200 gap-4">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                PWA فعال
              </span>
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                اینترانت ملی ۱۰۰٪
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* بنر وضعیت آمادگی شبکه ملی اطلاعات و PWA */}
      <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-950">
              سازگاری ۱۰۰٪ با شبکه ملی اطلاعات (اینترانت ملی) و حالت آفلاین PWA
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              تمامی فونت‌ها، اسکریپت‌ها، استایل‌های KaTeX و آواتارها به طور محلی میزبانی می‌شوند و سامانه در بستر بسته بدون اتصال به وب جهانی با حداکثر سرعت اجرا می‌گردد.
            </p>
          </div>
        </div>
        <Link
          href="/demo"
          className="shrink-0 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          مشاهده در سناریوی دمو
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* پیش‌نمایش تست فرمول‌های KaTeX */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              $\Sigma$
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                موتور رندر فرمول‌های ریاضی و فیزیک (KaTeX لوکال)
              </h2>
              <p className="text-xs text-slate-500">
                کاملاً مستقل از CDN خارجی - نمونه سوالات کنکور و نهایی تعبیه‌شده در دیتابیس
              </p>
            </div>
          </div>
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 ml-1" /> فعال و آماده
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <span className="text-xs font-bold text-indigo-600 block mb-1">
              نمونه سوال تستی (مشتق کسری پایه دوازدهم):
            </span>
            <KaTeXRenderer
              content="مشتق تابع $f(x) = \frac{2x - 1}{x^2 + 1}$ در نقطه $x = 1$ برابر کدام است؟"
            />
            <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
              <KaTeXRenderer
                content="فرمول راه حل: $$f'(x) = \frac{2(x^2+1) - 2x(2x-1)}{(x^2+1)^2} \implies f'(1) = \frac{1}{2}$$"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <span className="text-xs font-bold text-indigo-600 block mb-1">
              نمونه سوال تشریحی (قاعده زنجیره‌ای و مثلثات):
            </span>
            <KaTeXRenderer
              content="مشتق مرتبه اول $y = \sin^3(2x)$ در نقطه $x = \frac{\pi}{6}$ را به دست آورید."
            />
            <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
              <KaTeXRenderer
                content="حل: $$y' = 3\sin^2(2x) \cdot (2\cos(2x)) = 6\sin^2\left(\frac{\pi}{3}\right)\cos\left(\frac{\pi}{3}\right) = \frac{9}{4}$$"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ماژول‌های ۱۰ گانه نقشه راه */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800">معماری ۱۰ ماژول سامانه در برنامه ۱۰ روزه</h2>
            <p className="text-xs text-slate-500">
              تمام ۱۰ ماژول با موفقیت طبق زنجیره پیش‌نیازها و به صورت یکپارچه با پایگاه داده SQLite و Prisma مستقر شده‌اند.
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-300 self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ۱۰ از ۱۰ ماژول مستقر شد (۱۰۰٪)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between group border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md ring-1 ring-slate-100 hover:ring-indigo-500/20`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-110 transition-transform">
                    {m.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${m.badgeColor}`}>
                    {m.tag}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>{m.status}</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
