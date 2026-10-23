"use client";

import React from "react";
import { QuartileStats, DescriptiveStats } from "@/lib/analytics/psychometrics";
import { HelpCircle, AlertTriangle } from "lucide-react";

interface BoxWhiskerChartProps {
  quartiles: QuartileStats;
  stats: DescriptiveStats;
}

export const BoxWhiskerChart: React.FC<BoxWhiskerChartProps> = ({
  quartiles,
  stats,
}) => {
  // مقیاس‌بندی از ۰ تا ۲۰ به عرض ۱۰۰ درصد
  const scale = (val: number) => Math.max(0, Math.min(100, (val / 20) * 100));

  const q1Pos = scale(quartiles.q1);
  const medPos = scale(quartiles.median);
  const q3Pos = scale(quartiles.q3);
  const lowWhiskerPos = scale(quartiles.lowerWhisker);
  const upWhiskerPos = scale(quartiles.upperWhisker);
  const boxWidth = Math.max(2, q3Pos - q1Pos);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            نمودار جعبه‌ای چارک‌ها (Box & Whisker Plot) و داده‌های پرت
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            نمایش میانه ($Q_2$)، چارک اول ($Q_1$)، چارک سوم ($Q_3$) و غربالگری نمرات غیرعادی خارج از دامنه
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
            دامنه میان‌چارکی (IQR): {quartiles.iqr}
          </span>
        </div>
      </div>

      {/* نمودار جعبه‌ای تعاملی برداری */}
      <div className="space-y-6 pt-4 pb-2 px-4">
        {/* محور خط‌کش نمرات ۰ تا ۲۰ */}
        <div className="relative h-6 border-b border-slate-300">
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map((tick) => (
            <div
              key={tick}
              className="absolute -bottom-1 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${(tick / 20) * 100}%` }}
            >
              <div className="w-0.5 h-2 bg-slate-300"></div>
              <span className="text-[10px] text-slate-400 mt-1">{tick}</span>
            </div>
          ))}
        </div>

        {/* جعبه و سبیل‌ها (Box and Whiskers) */}
        <div className="relative h-20 w-full flex items-center">
          {/* خط سبیل افقی از کران پایین تا کران بالا */}
          <div
            className="absolute h-0.5 bg-slate-400 z-0"
            style={{
              left: `${lowWhiskerPos}%`,
              width: `${Math.max(1, upWhiskerPos - lowWhiskerPos)}%`,
            }}
          />

          {/* خط ترمز سبیل چپ (Lower Whisker) */}
          <div
            className="absolute w-1 h-8 bg-slate-600 rounded-full -translate-x-1/2 z-10"
            style={{ left: `${lowWhiskerPos}%` }}
            title={`کران پایین مجاز: ${quartiles.lowerWhisker}`}
          />

          {/* خط ترمز سبیل راست (Upper Whisker) */}
          <div
            className="absolute w-1 h-8 bg-slate-600 rounded-full -translate-x-1/2 z-10"
            style={{ left: `${upWhiskerPos}%` }}
            title={`کران بالا: ${quartiles.upperWhisker}`}
          />

          {/* بدنه جعبه میان‌چارکی (Interquartile Box: Q1 to Q3) */}
          <div
            className="absolute h-14 bg-gradient-to-r from-emerald-100 via-teal-100 to-indigo-100 border-2 border-emerald-500 rounded-xl shadow-md z-10 flex items-center justify-center transition-all hover:ring-2 hover:ring-emerald-400/50"
            style={{
              left: `${q1Pos}%`,
              width: `${boxWidth}%`,
            }}
          >
            <span className="text-[10px] text-emerald-800 font-bold opacity-70 hidden sm:inline">
              ۵۰٪ نمرات میانی
            </span>
          </div>

          {/* خط میانه (Median Q2) */}
          <div
            className="absolute w-1 h-16 bg-rose-500 rounded-full shadow-lg -translate-x-1/2 z-20"
            style={{ left: `${medPos}%` }}
            title={`میانه کلاس (Q2): ${quartiles.median}`}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
              {quartiles.median}
            </div>
          </div>

          {/* نقاط پرت خارج از کران‌ها (Outliers) */}
          {quartiles.outliers.map((outlier, idx) => (
            <div
              key={idx}
              className="absolute w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md -translate-x-1/2 z-20 animate-pulse cursor-pointer"
              style={{ left: `${scale(outlier)}%` }}
              title={`داده پرت (Outlier): نمره ${outlier}`}
            >
              <div className="absolute -bottom-6 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1 rounded whitespace-nowrap">
                پرت: {outlier}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* خلاصه کارت‌های چارک‌ها */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 text-[11px] block">چارک اول (Q1)</span>
          <span className="font-black text-slate-800 text-sm">{quartiles.q1}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">صدک ۲۵ کلاس</span>
        </div>

        <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
          <span className="text-rose-600 font-bold text-[11px] block">میانه (Q2)</span>
          <span className="font-black text-rose-700 text-sm">{quartiles.median}</span>
          <span className="text-[10px] text-rose-500 block mt-0.5">صدک ۵۰ کلاس</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 text-[11px] block">چارک سوم (Q3)</span>
          <span className="font-black text-slate-800 text-sm">{quartiles.q3}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">صدک ۷۵ کلاس</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 text-[11px] block">دامنه میان‌چارکی</span>
          <span className="font-black text-slate-800 text-sm">{quartiles.iqr}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">فاصله Q3 - Q1</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-slate-400 text-[11px] block">نمرات پرت (Outliers)</span>
          <span className="font-black text-amber-600 text-sm">
            {quartiles.outliers.length > 0 ? `${quartiles.outliers.length} نمره` : "فاقد داده پرت"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {quartiles.outliers.length > 0 ? quartiles.outliers.join("، ") : "نمرات در دامنه نرمال"}
          </span>
        </div>
      </div>
    </div>
  );
};
