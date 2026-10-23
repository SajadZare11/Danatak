"use client";

import React, { useState } from "react";
import {
  DescriptiveStats,
  DistributionShape,
  QuartileStats,
  CorrelationResult,
} from "@/lib/analytics/psychometrics";
import { Sparkles, Copy, Check, FileText, ShieldAlert, Cpu } from "lucide-react";

interface ClassNarrativeReportProps {
  stats: DescriptiveStats;
  shape: DistributionShape;
  quartiles: QuartileStats;
  correlation: CorrelationResult;
  narrativeText: string;
  classNameTitle: string;
}

export const ClassNarrativeReport: React.FC<ClassNarrativeReportProps> = ({
  stats,
  shape,
  quartiles,
  correlation,
  narrativeText,
  classNameTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-indigo-700/40 shadow-xl space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              تفسیر کیفی و تشخیصی وضعیت کلاس ({classNameTitle})
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                تحلیلگر خودکار داناتک
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              ترجمه شاخص‌های عددی و روان‌سنجی به گزارش متنی قابل ارائه در شورای معلمان و مدیریت
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "کپی شد!" : "کپی متن گزارش"}
        </button>
      </div>

      {/* نشانگرهای تشخیصی ۴ گانه */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">سطح همگونی کلاسی (CV)</span>
          <span
            className={`text-xs font-black mt-1 block ${
              stats.cv < 18 ? "text-emerald-400" : stats.cv <= 30 ? "text-amber-400" : "text-rose-400"
            }`}
          >
            {stats.cv}٪ • {stats.cv < 18 ? "همگن و یکدست" : stats.cv <= 30 ? "ناهمگونی متوسط" : "شکاف آموزشی عمیق"}
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">چولگی توزیع (Skewness)</span>
          <span className="text-xs font-black text-cyan-300 mt-1 block">
            {shape.skewness} • {shape.skewnessType === "LEFT_SKEWED" ? "تمرکز در نمرات بالا" : shape.skewnessType === "RIGHT_SKEWED" ? "تراکم در نمرات ضعیف" : "متقارن و نرمال"}
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">ضریب همبستگی مطالعه (r)</span>
          <span className="text-xs font-black text-amber-300 mt-1 block">
            r = {correlation.r} • {correlation.strength === "STRONG_POSITIVE" ? "اثرگذاری شدید" : correlation.strength === "MODERATE_POSITIVE" ? "اثرگذاری متوسط" : "نیاز به روش‌شناسی"}
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">غربالگری داده‌های پرت</span>
          <span className="text-xs font-black text-purple-300 mt-1 block">
            {quartiles.outliers.length > 0 ? `${quartiles.outliers.length} نمره خارج از قاعده` : "فاقد داده غیرطبیعی"}
          </span>
        </div>
      </div>

      {/* کادر متن تشخیصی */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-indigo-900/40 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
        <p className="whitespace-pre-line">{narrativeText}</p>
      </div>
    </div>
  );
};
