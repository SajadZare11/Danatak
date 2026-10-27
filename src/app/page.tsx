"use client";

import React from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import {
  GraduationCap,
  Briefcase,
  Shield,
  Compass,
  Users,
  Layers,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar,
  Lock,
  Edit3,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Box,
  Video,
  Play,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, currentUser } = useRole();

  const rolePortals = [
    {
      id: "student-portal",
      role: "STUDENT",
      title: "پرتال دانش‌آموزان",
      badge: "فضای یادگیری و تکالیف",
      tagline: "تکالیف درسی، آزمون‌های آنلاین، مرور لایتنر و کارنامه",
      icon: <GraduationCap className="w-7 h-7 text-emerald-600" />,
      color: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/40",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      href: "/login?role=STUDENT",
      points: [
        "مشاهده و حل آنلاین تکالیف هفتگی",
        "دفترچه اشتباهات هوشمند و مرور در جعبه ۵ خانه لایتنر",
        "شرکت در آزمون‌های تستی و تشریحی با نمره و تراز آنی",
        "دسترسی به برنامه کلاسی، کتابخانه و کلاس آنلاین تصویری",
      ],
    },
    {
      id: "teacher-portal",
      role: "TEACHER",
      title: "پرتال دبیران",
      badge: "میز کار آموزشی و تدریس",
      tagline: "مدیریت کلاس، ثبت درصد یادگیری، صدور تکالیف و تصحیح",
      icon: <Briefcase className="w-7 h-7 text-indigo-600" />,
      color: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/40",
      btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
      href: "/login?role=TEACHER",
      points: [
        "لیست کلاسی، حضور و غیاب سریع و پورتفولیوی دانش‌آموزان",
        "میز قلم‌گذاری دیجیتال جهت تصحیح برگه‌ها با ابزار Canvas",
        "بانک سوالات طبقه‌بندی‌شده و استودیوی آزمون‌ساز آنلاین",
        "برگزاری کلاس آنلاین، اشتراک تخته هوشمند و جزوات",
      ],
    },
    {
      id: "parent-portal",
      role: "PARENT",
      title: "پرتال اولیا",
      badge: "نظارت و پیگیری وضعیت فرزند",
      tagline: "رهگیری زنده حضور و غیاب، کارنامه، اقساط شهریه و پیام‌ها",
      icon: <Users className="w-7 h-7 text-rose-600" />,
      color: "border-rose-200 hover:border-rose-400 bg-rose-50/40",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
      href: "/login?role=PARENT",
      points: [
        "گزارش لحظه‌ای تردد و حضور و غیاب فرزند در مدرسه",
        "مشاهده کارنامه جامع، نمودار روند تحصیلی و تحلیل نمرات",
        "سامانه شفاف اقساط شهریه و شبیه‌ساز پرداخت شتاب",
        "ارتباط مستقیم، محرمانه و دوسویه با کادر آموزشی و اداری",
      ],
    },
    {
      id: "principal-portal",
      role: "PRINCIPAL",
      title: "پرتال مدیریت و مشاور",
      badge: "نظارت کلان و هدایت تحصیلی",
      tagline: "ماتریس سلامت مدرسه، خروجی سیدا، تحلیل آماری و مشاوره",
      icon: <Shield className="w-7 h-7 text-purple-600" />,
      color: "border-purple-200 hover:border-purple-400 bg-purple-50/40",
      btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
      href: "/login?role=PRINCIPAL",
      points: [
        "داشبورد کلان شاخص‌های یادگیری و غربالگری دانش‌آموزان در معرض افت",
        "تولید فایل اکسل استاندارد منطبق بر فرمت سامانه سیدا (Sida)",
        "سامانه پیامک هوشمند هشدارهای غیبت و افت تراز به اولیا",
        "برنامه‌ریزی مطالعاتی هوشمند، ترازسنجی و ارزشیابی دبیران",
      ],
    },
  ];

  const highlights = [
    {
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: "رادار تسلط و زنجیره پیش‌نیازها",
      desc: "نمایش گراف پیوسته پیش‌نیاز مباحث از دهم تا دوازدهم و عارضه‌یابی ریشه‌ای نقاط ضعف هر دانش‌آموز.",
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      title: "تکلیف هوشمند و تمرین تعاملی",
      desc: "صدور تکالیف هدفمند متناسب با سطح یادگیری با بازخورد گام‌به‌گام و راهکارهای جبرانی فوری.",
    },
    {
      icon: <Edit3 className="w-5 h-5 text-rose-600" />,
      title: "میز تصحیح با قلم‌گذاری دیجیتال",
      desc: "تصحیح برگه‌ها و تکالیف تشریحی با قلم روان و انتقال خودکار غلط‌ها به دفترچه اشتباهات فردی.",
    },
    {
      icon: <Lock className="w-5 h-5 text-purple-600" />,
      title: "آزمون آنلاین ایمن و تراز کنکوری",
      desc: "محیط آزمون ضدتقلب، ذخیره‌سازی محلی پاسخ‌ها، نمره منفی ۱/۳ و محاسبه دقیق تراز و صدک کشوری.",
    },
    {
      icon: <Box className="w-5 h-5 text-emerald-600" />,
      title: "جعبه مرور فاصله‌دار لایتنر",
      desc: "تثبیت پایدار مفاهیم کلیدی و فرمول‌ها در حافظه بلندمدت بر اساس منحنی علمی فراموشی ابینگهاوس.",
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-blue-600" />,
      title: "سازگاری کامل با سیدا و آموزش و پرورش",
      desc: "امکان خروجی اکسل رسمی نمرات با هدر مدارس و بارگذاری سریع در سامانه سیدای وزارت آموزش و پرورش.",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* ۱. بخش سربرگ اصلی (Hero Section) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-12 pb-20 px-4">
        {/* افکت نور ملایم پس‌زمینه */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-4 py-1.5 rounded-full font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>سامانه هوشمند ارتقای تحصیلی و مدیریت یکپارچه مدرسه</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
            سامانه هوشمند یادگیری و تسلط تحصیلی <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-indigo-300 bg-clip-text text-transparent">«داناتک»</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            محیطی یکپارچه، خلوت و هدفمند برای تعامل دانش‌آموزان، دبیران، اولیا و کادر مدیریت مدرسه؛ با رویکرد ارتقای تسلط، تحلیل ریشه‌ای یادگیری و تکالیف هوشمند.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#portals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              <span>انتخاب پرتال کاربری و ورود</span>
              <ArrowLeft className="w-4 h-4" />
            </a>

            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold rounded-2xl backdrop-blur-md transition"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>مشاهده سناریوی تور تعاملی (دمو)</span>
            </Link>
          </div>

          {/* آمارهای کلیدی پلتفرم */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center border-t border-white/10">
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-amber-300">۵ نقش</div>
              <div className="text-xs text-slate-400 mt-1">پرتال کاملاً تفکیک‌شده</div>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">۱۰۰٪</div>
              <div className="text-xs text-slate-400 mt-1">سازگار با شبکه ملی و PWA</div>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-cyan-300">هوشمند</div>
              <div className="text-xs text-slate-400 mt-1">رادار تسلط و زنجیره پیش‌نیازها</div>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-purple-300">رسمی</div>
              <div className="text-xs text-slate-400 mt-1">منطبق با سیدا و آموزش و پرورش</div>
            </div>
          </div>
        </div>
      </section>

      {/* ۲. بخش پرتال‌های ورود کاربری (Portals Gateway) */}
      <section id="portals" className="max-w-7xl mx-auto px-4 scroll-mt-20 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            مسیرهای ورود به سامانه
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            پرتال اختصاصی خود را انتخاب کنید
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            هر نقش به میز کار، ابزارها و گزارش‌های مختص خود دسترسی خواهد داشت:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rolePortals.map((portal) => (
            <div
              key={portal.id}
              className={`p-6 sm:p-7 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${portal.color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100">
                    {portal.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white/80 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    {portal.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{portal.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{portal.tagline}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {portal.points.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href={portal.href}
                  className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition shadow-sm ${portal.btnColor}`}
                >
                  <span>ورود به {portal.title}</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ۳. بخش ویژگی‌های کلیدی سامانه (Features Section) */}
      <section id="features" className="max-w-7xl mx-auto px-4 scroll-mt-20 space-y-8 pt-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            امکانات و نوآوری‌ها
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            چرا دبیرستان‌های برتر داناتک را انتخاب می‌کنند؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            ابزارهایی که کار یادگیری را برای دانش‌آموز لذت‌بخش و مدیریت کلاس را برای دبیر تسهیل می‌کنند.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {h.icon}
              </div>
              <h3 className="text-sm font-black text-slate-900">{h.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ۴. بخش درباره سامانه و زیرساخت بومی (About Section) */}
      <section id="about" className="max-w-7xl mx-auto px-4 scroll-mt-20">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-right">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold inline-block">
              زیرساخت مستقل و پایدار
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              سامانه ۱۰۰٪ بومی با پشتیبانی کامل از حالت آفلاین و PWA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              کلیه اسکریپت‌ها، فونت‌های فارسی و فرمول‌نویس ریاضی بدون وابستگی به سرورهای خارجی میزبانی می‌شوند و سامانه با حداکثر سرعت و پایداری در بستر شبکه ملی مدارس و اینترنت در دسترس است.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/demo"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>مشاهده دموی تعاملی</span>
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>ورود به حساب کاربری</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ۵. پاورقی تمیز و استاندارد (Footer) */}
      <footer className="max-w-7xl mx-auto px-4 pt-12 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
        <div>
          <span className="font-bold text-slate-800">سامانه هوشمند داناتک</span> • کلیه حقوق محفوظ است (سال تحصیلی ۱۴۰۳-۱۴۰۴)
        </div>
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <a href="#about" className="hover:text-indigo-600 transition">درباره سامانه</a>
          <a href="#features" className="hover:text-indigo-600 transition">امکانات</a>
          <a href="#portals" className="hover:text-indigo-600 transition">پرتال‌ها</a>
          <Link href="/login" className="hover:text-indigo-600 transition font-bold text-indigo-600">ورود اعضا</Link>
        </div>
      </footer>
    </div>
  );
}
