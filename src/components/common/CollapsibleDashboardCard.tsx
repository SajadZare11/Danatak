"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleDashboardCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  colorScheme?: "indigo" | "emerald" | "amber" | "purple" | "rose" | "blue";
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  quickAction?: React.ReactNode;
}

export const CollapsibleDashboardCard: React.FC<CollapsibleDashboardCardProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  colorScheme = "indigo",
  isOpen,
  onToggle,
  children,
  quickAction,
}) => {
  const colorStyles = {
    indigo: {
      border: "border-indigo-100 hover:border-indigo-300",
      activeBorder: "border-indigo-300 shadow-md ring-1 ring-indigo-500/10",
      iconBg: "bg-indigo-50 text-indigo-600",
      accent: "text-indigo-600",
    },
    emerald: {
      border: "border-emerald-100 hover:border-emerald-300",
      activeBorder: "border-emerald-300 shadow-md ring-1 ring-emerald-500/10",
      iconBg: "bg-emerald-50 text-emerald-600",
      accent: "text-emerald-600",
    },
    amber: {
      border: "border-amber-100 hover:border-amber-300",
      activeBorder: "border-amber-300 shadow-md ring-1 ring-amber-500/10",
      iconBg: "bg-amber-50 text-amber-600",
      accent: "text-amber-600",
    },
    purple: {
      border: "border-purple-100 hover:border-purple-300",
      activeBorder: "border-purple-300 shadow-md ring-1 ring-purple-500/10",
      iconBg: "bg-purple-50 text-purple-600",
      accent: "text-purple-600",
    },
    rose: {
      border: "border-rose-100 hover:border-rose-300",
      activeBorder: "border-rose-300 shadow-md ring-1 ring-rose-500/10",
      iconBg: "bg-rose-50 text-rose-600",
      accent: "text-rose-600",
    },
    blue: {
      border: "border-blue-100 hover:border-blue-300",
      activeBorder: "border-blue-300 shadow-md ring-1 ring-blue-500/10",
      iconBg: "bg-blue-50 text-blue-600",
      accent: "text-blue-600",
    },
  }[colorScheme];

  return (
    <div
      id={id}
      className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
        isOpen ? colorStyles.activeBorder : `${colorStyles.border} shadow-2xs`
      }`}
    >
      {/* سربرگ کارت که همیشه در دید است و وضعیت خلاصه را نشان می‌دهد */}
      <div
        onClick={onToggle}
        className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 transition"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${colorStyles.iconBg}`}
          >
            {icon}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900">{title}</h3>
              {badge && <div onClick={(e) => e.stopPropagation()}>{badge}</div>}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          {quickAction && <div onClick={(e) => e.stopPropagation()}>{quickAction}</div>}

          <button
            type="button"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              isOpen
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>{isOpen ? "بستن بخش" : "مشاهده و مدیریت"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* محتوای بازشونده تفصیلی */}
      {isOpen && (
        <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/30 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
