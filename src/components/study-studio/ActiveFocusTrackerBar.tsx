"use client";

import React from "react";
import { FocusStatus } from "@/hooks/useActiveFocusTracker";
import {
  Flame,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Zap,
  Activity,
} from "lucide-react";

interface ActiveFocusTrackerBarProps {
  status: FocusStatus;
  activeSeconds: number;
  idleSeconds: number;
  focusRatio: number;
}

export const ActiveFocusTrackerBar: React.FC<ActiveFocusTrackerBarProps> = ({
  status,
  activeSeconds,
  idleSeconds,
  focusRatio,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isIdle = status !== "ACTIVE";

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-3.5 shadow-sm space-y-2 ${
        status === "ACTIVE"
          ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
          : status === "IDLE_TAB_HIDDEN"
          ? "bg-rose-50 border-rose-300 text-rose-950 animate-pulse"
          : "bg-amber-50 border-amber-300 text-amber-950"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* نشانگر وضعیت زنده */}
        <div className="flex items-center gap-2 font-black">
          {status === "ACTIVE" && (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-emerald-900">حالت تمرکز و مطالعه فعال (Active) 🟢</span>
            </>
          )}

          {status === "IDLE_TAB_HIDDEN" && (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <span className="text-rose-900 font-bold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                خروج از برگه مرورگر / مانیتورینگ ضد تقلب 🔴
              </span>
            </>
          )}

          {status === "IDLE_NO_INPUT" && (
            <>
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="text-amber-900 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                عدم فعالیت کاربر (بیش از ۳۰ ثانیه بدون ورودی) ⏳
              </span>
            </>
          )}
        </div>

        {/* زمان‌سنج‌های تفکیک‌شده مطالعه مفید و غیرفعال */}
        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 text-emerald-800 bg-white/80 px-2.5 py-1 rounded-xl border border-emerald-200">
            <span className="font-sans text-[11px] text-slate-500 font-bold">مطالعه مفید:</span>
            <span>{formatTime(activeSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-800 bg-white/80 px-2.5 py-1 rounded-xl border border-amber-200">
            <span className="font-sans text-[11px] text-slate-500 font-bold">زمان هرز (Idle):</span>
            <span>{formatTime(idleSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-900 bg-white/80 px-2.5 py-1 rounded-xl border border-indigo-200 font-sans">
            <span className="text-[11px] text-slate-500 font-bold">نرخ تمرکز:</span>
            <span className="font-mono font-black">{focusRatio}٪</span>
          </div>
        </div>
      </div>

      {/* بنر هشدار در حالت Idle */}
      {isIdle && (
        <div className="text-[11px] font-bold text-slate-700 bg-white/90 p-2 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            تایمر «مطالعه مفید» به دلیل عدم تعامل یا خروج از صفحه متوقف شده است. برای ثبت زمان در گزارش مشاور و پورتفولیو، در این برگه به مطالعه ادامه دهید.
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Page Visibility API</span>
        </div>
      )}
    </div>
  );
};
