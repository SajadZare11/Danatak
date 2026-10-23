"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
  Lock,
  UserCheck,
  Shield,
  GraduationCap,
  Briefcase,
  Compass,
  Users,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole();

  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const demoAccounts = [
    {
      role: "TEACHER",
      name: "استاد احسان محمدی",
      title: "دبیر تخصصی ریاضی و حسابان",
      nationalId: "0011223344",
      password: "demo1234",
      icon: <Briefcase className="w-4 h-4 text-indigo-400" />,
      color: "from-blue-600 to-indigo-700",
    },
    {
      role: "STUDENT",
      name: "علی رضایی",
      title: "دانش‌آموز پایه دوازدهم ریاضی",
      nationalId: "0022334455",
      password: "demo1234",
      icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
      color: "from-emerald-600 to-teal-700",
    },
    {
      role: "PRINCIPAL",
      name: "دکتر مسعود حسینی",
      title: "مدیریت دبیرستان علامه حلی ۱",
      nationalId: "0099887766",
      password: "demo1234",
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      color: "from-purple-600 to-violet-800",
    },
    {
      role: "COUNSELOR",
      name: "خانم مریم صابری",
      title: "مشاور ارشد تحصیلی و کنکور",
      nationalId: "0088776655",
      password: "demo1234",
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      color: "from-amber-600 to-orange-700",
    },
    {
      role: "PARENT",
      name: "مهندس حسین رضایی",
      title: "ولی دانش‌آموز (پدر علی)",
      nationalId: "0077665544",
      password: "demo1234",
      icon: <Users className="w-4 h-4 text-rose-400" />,
      color: "from-rose-600 to-pink-700",
    },
  ];

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!nationalId.trim() || !password.trim()) {
      setErrorMessage("لطفاً کد ملی و رمز عبور را وارد فرمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(nationalId.trim(), password.trim());
      if (res.success) {
        router.push(res.targetRoute || "/");
      } else {
        setErrorMessage(res.error || "کد ملی یا رمز عبور نامعتبر است.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    setNationalId(account.nationalId);
    setPassword(account.password);
    setErrorMessage("");
    // اجرای فوری ورود
    login(account.nationalId, account.password).then((res) => {
      if (res.success) {
        router.push(res.targetRoute || "/");
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* ستون راست: فرم ورود رسمی */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-2 text-center sm:text-right">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full font-bold">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              درگاه امن ورود یکپارچه اعضای دبیرستان
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ورود به سامانه هوشمند داناتک
            </h1>
            <p className="text-xs text-slate-500">
              دبیرستان علامه حلی ۱ (سمپاد) • سال تحصیلی ۱۴۰۳-۱۴۰۴
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                کد ملی (۱۰ رقم بدون خط تیره):
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="مثال: 0011223344"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                رمز عبور حساب کاربری:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="رمز عبور خود را وارد کنید"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-4 pl-10 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  ورود به پنل کاربری
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ستون چپ: راهنمای حساب‌های دمو و ورود با یک کلیک */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-black">حساب‌های آزمایشی آماده (ورود سریع)</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              برای بررسی سریع عملکرد هر یک از ۵ نقش، روی حساب مورد نظر کلیک کنید تا فرم به صورت خودکار پر و احراز هویت شود:
            </p>

            <div className="space-y-2 pt-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full text-right p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${acc.color} flex items-center justify-center text-white shrink-0`}>
                      {acc.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {acc.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg text-indigo-300 font-mono">
                      {acc.nationalId}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 text-center">
              رمز عبور کلیه حساب‌های آزمایشی: <span className="font-mono text-slate-400 font-bold">demo1234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
