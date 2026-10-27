"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { DEMO_USERS, UserRole } from "@/types";
import {
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
  ChevronDown,
  Layers,
  BookOpen,
  Compass,
  Briefcase,
  GraduationCap,
  Users,
  Shield,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, currentUser, isAuthenticated, logout, setRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

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

  const isPublicPage = pathname === "/" || pathname === "/login";

  // پیوندهای ناوبری هوشمند بر اساس صفحه یا نقش فعال
  const getRoleNavLinks = () => {
    if (isPublicPage) {
      return [
        { title: "صفحه اصلی", href: "/", icon: <Home className="w-3.5 h-3.5" /> },
        { title: "معرفی سامانه", href: "/#about", icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
        { title: "امکانات کلیدی", href: "/#features", icon: <Layers className="w-3.5 h-3.5 text-indigo-400" /> },
        { title: "پرتال‌های کاربری", href: "/#portals", icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
        { title: "تور تعاملی (دمو)", href: "/demo", icon: <Compass className="w-3.5 h-3.5 text-rose-400" /> },
      ];
    }

    switch (currentRole) {
      case "STUDENT":
        return [
          { title: "میز کار دانش‌آموز", href: "/student", icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> },
          { title: "برنامه کلاسی", href: "/schedule", icon: <Calendar className="w-3.5 h-3.5 text-amber-400" /> },
          { title: "کتابخانه و جزوات", href: "/library", icon: <BookMarked className="w-3.5 h-3.5 text-blue-400" /> },
          { title: "کلاس آنلاین", href: "/classroom", icon: <Video className="w-3.5 h-3.5 text-rose-400" /> },
          { title: "پیام‌ها و رفع اشکال", href: "/messages", icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> },
        ];
      case "TEACHER":
        return [
          { title: "میز کار دبیر", href: "/teacher", icon: <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> },
          { title: "بانک سوالات", href: "/questions", icon: <BookOpen className="w-3.5 h-3.5 text-teal-400" /> },
          { title: "استودیو هوشمند", href: "/study-studio", icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
          { title: "کلاس آنلاین", href: "/classroom", icon: <Video className="w-3.5 h-3.5 text-rose-400" /> },
          { title: "پیام‌ها", href: "/messages", icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> },
        ];
      case "PRINCIPAL":
        return [
          { title: "داشبورد مدیریت", href: "/principal", icon: <Shield className="w-3.5 h-3.5 text-amber-400" /> },
          { title: "تحلیل نمرات و آمار", href: "/analytics", icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> },
          { title: "سامانه پیامک", href: "/sms", icon: <Smartphone className="w-3.5 h-3.5 text-rose-400" /> },
          { title: "ارزشیابی دبیران", href: "/evaluation", icon: <Award className="w-3.5 h-3.5 text-yellow-400" /> },
          { title: "برنامه تحصیلی", href: "/schedule", icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" /> },
        ];
      case "COUNSELOR":
        return [
          { title: "میز کار مشاور", href: "/counselor", icon: <Compass className="w-3.5 h-3.5 text-cyan-400" /> },
          { title: "رادار تسلط", href: "/mastery", icon: <Layers className="w-3.5 h-3.5 text-blue-400" /> },
          { title: "تحلیل نمرات", href: "/analytics", icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> },
          { title: "پیام‌ها", href: "/messages", icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> },
        ];
      case "PARENT":
        return [
          { title: "پورتال اولیا", href: "/parent", icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
          { title: "برنامه درسی فرزند", href: "/schedule", icon: <Calendar className="w-3.5 h-3.5 text-amber-400" /> },
          { title: "پیام‌ها و ارتباط", href: "/messages", icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> },
        ];
      default:
        return [
          { title: "خانه", href: "/", icon: <Home className="w-3.5 h-3.5" /> },
        ];
    }
  };

  const navLinks = getRoleNavLinks();

  const roleNameMap: Record<UserRole, string> = {
    TEACHER: "دبیر",
    STUDENT: "دانش‌آموز",
    PRINCIPAL: "مدیر",
    COUNSELOR: "مشاور",
    PARENT: "اولیا",
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm transition-all h-14">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 flex items-center justify-between gap-2 md:gap-4 flex-nowrap">
        {/* ۱. لوگو و برند سامانه (سمت راست در RTL) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition group"
            title="داناتک؛ صفحه اصلی"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-sm text-sm shrink-0">
              د
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                داناتک
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-md px-1.5 py-0.5 hidden xl:inline-block whitespace-nowrap font-medium">
                سامانه هوشمند آموزشی
              </span>
            </div>
          </Link>
        </div>

        {/* ۲. پیوندهای ناوبری هوشمند (افقی با اسکرول نامرئی در صفحات کوچک‌تر) */}
        <nav className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 overflow-x-auto no-scrollbar scroll-smooth shrink min-w-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                {link.icon}
                <span>{link.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* ۳. بخش دسترسی سریع، کارت کاربری و ورود/خروج */}
        <div className="flex items-center gap-2 shrink-0">
          {/* در صفحات لندینگ یا لاگین: دکمه ورود به پرتال یا میز کار */}
          {isPublicPage ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap border border-indigo-500/40"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ورود به پرتال</span>
              </Link>
              {isAuthenticated && (
                <Link
                  href={getPanelRoute()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>میز کار من</span>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* دکمه بازگشت به صفحه اصلی */}
              <Link
                href="/"
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700/60 transition whitespace-nowrap"
                title="بازگشت به صفحه اصلی"
              >
                <Home className="w-3.5 h-3.5" />
                <span>صفحه اصلی</span>
              </Link>

              {/* دکمه میز کار اختصاصی نقش جاری */}
              <Link
                href={getPanelRoute()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm shrink-0 ${
                  pathname === getPanelRoute()
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border border-emerald-500/50"
                    : "bg-slate-800/80 text-emerald-400 border border-slate-700/70 hover:bg-slate-700 hover:text-emerald-300"
                }`}
                title="میز کار من"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>میز کار من</span>
              </Link>
            </>
          )}

          {/* کارت مشخصات کاربر (شامل آواتار، نام، سمت، سوییچ نقش دمو و دکمه خروج) */}
          {isAuthenticated && (
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800/95 px-2.5 py-1 rounded-xl border border-slate-700/70 shadow-sm transition">
                {/* دکمه خروج */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                    router.push("/");
                  }}
                  title="خروج از حساب کاربری"
                  className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/80 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* نام و سمت کاربر (کلیک برای سوییچ نقش در حالت دمو) */}
                <div
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="text-right cursor-pointer select-none leading-tight hidden sm:block"
                  title="تغییر نقش کاربری (حالت دمو)"
                >
                  <div className="text-xs font-black text-slate-100 flex items-center gap-1 whitespace-nowrap">
                    <span>{currentUser.fullName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">
                    {currentUser.roleTitleFa}
                  </div>
                </div>

                {/* آواتار کاربر */}
                <div
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner cursor-pointer shrink-0 border border-indigo-400/40 overflow-hidden"
                  title="پروفایل کاربر - کلیک جهت تغییر نقش"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* منوی بازشونده انتخاب سریع نقش‌ها (دمو) */}
              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 text-right animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 bg-slate-800/80 rounded-xl mb-2 border border-slate-700/50">
                      <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                      <div className="text-[11px] text-indigo-300 mt-0.5">{currentUser.roleTitleFa}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        دبیرستان علامه حلی ۱ • سال تحصیلی ۱۴۰۳-۱۴۰۴
                      </div>
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                      <span>تغییر نقش کاربر (حالت دمو):</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">آزمایشی</span>
                    </div>

                    <div className="space-y-1">
                      {(Object.keys(DEMO_USERS) as UserRole[]).map((role) => {
                        const u = DEMO_USERS[role];
                        const isCurrent = currentRole === role;
                        return (
                          <button
                            key={role}
                            onClick={() => {
                              setRole(role);
                              setShowRoleDropdown(false);
                              const routes: Record<UserRole, string> = {
                                TEACHER: "/teacher",
                                STUDENT: "/student",
                                PRINCIPAL: "/principal",
                                COUNSELOR: "/counselor",
                                PARENT: "/parent",
                              };
                              router.push(routes[role] || "/");
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition ${
                              isCurrent
                                ? "bg-indigo-600 text-white font-bold shadow-sm"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>{u.fullName} ({roleNameMap[role]})</span>
                            </span>
                            {isCurrent && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">فعال</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
