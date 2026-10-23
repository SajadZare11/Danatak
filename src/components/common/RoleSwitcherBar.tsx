"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
  GraduationCap,
  Briefcase,
  Shield,
  Compass,
  Users,
  Home,
  BarChart3,
  MessageSquare,
  Calendar,
  BookMarked,
  LogOut,
  LogIn,
  Sparkles,
  Smartphone,
  Video,
  Award,
} from "lucide-react";
import Link from "next/link";

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, currentUser, isAuthenticated, logout } = useRole();
  const router = useRouter();
  const pathname = usePathname();

  // تعیین مسیر پنل فعال کاربر جاری
  const getPanelRoute = () => {
    switch (currentRole) {
      case "TEACHER":
        return "/teacher";
      case "STUDENT":
        return "/student";
      case "PRINCIPAL":
        return "/principal";
      case "COUNSELOR":
        return "/counselor";
      case "PARENT":
        return "/parent";
      default:
        return "/";
    }
  };

  const navLinks = [
    {
      title: "خانه",
      href: "/",
      icon: <Home className="w-3.5 h-3.5" />,
    },
    {
      title: "پیام‌ها و رفع اشکال",
      href: "/messages",
      icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      title: "سامانه پیامک",
      href: "/sms",
      icon: <Smartphone className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      title: "کلاس آنلاین 🔴",
      href: "/classroom",
      icon: <Video className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
    },
    {
      title: "برنامه و تقویم",
      href: "/schedule",
      icon: <Calendar className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      title: "کتابخانه و جزوات",
      href: "/library",
      icon: <BookMarked className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      title: "ارزشیابی دبیران",
      href: "/evaluation",
      icon: <Award className="w-3.5 h-3.5 text-yellow-400" />,
    },
    {
      title: "آمار تحلیلی",
      href: "/analytics",
      icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 px-4 py-2.5 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* برند و عنوان سامانه */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition group"
            title="داناتک؛ صفحه اصلی"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-md text-base">
              د
            </div>
            <div>
              <div className="text-sm font-black tracking-tight flex items-center gap-2">
                داناتک (Danatak)
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 rounded-full px-2 py-0.5 hidden sm:inline-block">
                  سامانه هوشمند تسلط و ارتقای تحصیلی
                </span>
              </div>
              <div className="text-xs text-slate-400">
                دبیرستان علامه حلی ۱ • سال تحصیلی ۱۴۰۳-۱۴۰۴
              </div>
            </div>
          </Link>
        </div>

        {/* پیوندهای ناوبری اصلی سامانه */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto text-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                {link.icon}
                <span>{link.title}</span>
              </Link>
            );
          })}

          {/* کلید مستقیم به پنل کاربری نقش جاری */}
          <Link
            href={getPanelRoute()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              pathname === getPanelRoute()
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                : "bg-slate-700/50 text-emerald-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>میز کار من ({currentUser.roleTitleFa})</span>
          </Link>
        </nav>

        {/* ناحیه کاربری، وضعیت لاگین و دکمه خروج */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-slate-800/60 p-1.5 pr-2.5 rounded-xl border border-slate-700/50">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600"
              />
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-100">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400">{currentUser.roleTitleFa}</div>
              </div>
              <button
                onClick={logout}
                title="خروج از حساب کاربری"
                className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/80 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود به سامانه</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
