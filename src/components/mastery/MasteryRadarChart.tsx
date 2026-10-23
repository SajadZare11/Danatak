"use client";

import React, { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Award, AlertTriangle, CheckCircle, TrendingUp, Sparkles } from "lucide-react";

export interface RadarItem {
  subject: string;
  topicId: string;
  mastery: number;
  classAverage: number;
  fullMark: number;
}

interface MasteryRadarChartProps {
  data: RadarItem[];
  studentName?: string;
  className?: string;
}

export const MasteryRadarChart: React.FC<MasteryRadarChartProps> = ({
  data,
  studentName = "دانش‌آموز",
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-200">
        <span className="text-xs text-slate-400 font-bold animate-pulse">
          در حال بارگذاری نمودار راداری تسلط...
        </span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p className="text-xs text-slate-500 font-medium">
          داده‌ای برای ترسیم نمودار رادار تسلط ثبت نشده است.
        </p>
      </div>
    );
  }

  // محاسبه میانگین کل
  const totalAvg = Math.round(data.reduce((acc, d) => acc + d.mastery, 0) / data.length);
  const classTotalAvg = Math.round(data.reduce((acc, d) => acc + d.classAverage, 0) / data.length);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* هدر تحلیلی رادار */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-l from-indigo-50 to-slate-50 p-4 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              رادار تسلط موضوعی (Mastery Radar) — {studentName}
            </h3>
            <p className="text-[11px] text-slate-500">
              نمایش چندبعدی میزان درک مفاهیم در مقایسه با میانگین کلاس
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 bg-white rounded-xl border border-indigo-200 shadow-xs">
            <span className="text-slate-500 text-[10px] block">تسلط دانش‌آموز:</span>
            <span className="font-extrabold text-indigo-700">{totalAvg}٪</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-[10px] block">میانگین کلاس:</span>
            <span className="font-bold text-slate-700">{classTotalAvg}٪</span>
          </div>
        </div>
      </div>

      {/* نمودار راداری عنکبوتی */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#334155", fontSize: 11, fontFamily: "var(--font-vazir)" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="#94a3b8"
                tick={{ fontSize: 9 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as RadarItem;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-vazir border border-slate-700 text-right">
                        <div className="font-bold text-amber-300">{item.subject}</div>
                        <div className="text-slate-300">
                          درصد تسلط دانش‌آموز: <strong className="text-white font-mono">{item.mastery}٪</strong>
                        </div>
                        <div className="text-slate-400">
                          میانگین همتایان کلاس: <span className="font-mono">{item.classAverage}٪</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-700 font-vazir">
                    {value === "mastery" ? `تسلط ${studentName}` : "میانگین کلاس"}
                  </span>
                )}
              />
              <Radar
                name="mastery"
                dataKey="mastery"
                stroke="#4f46e5"
                fill="#6366f1"
                fillOpacity={0.45}
              />
              <Radar
                name="classAverage"
                dataKey="classAverage"
                stroke="#94a3b8"
                fill="#cbd5e1"
                fillOpacity={0.25}
                strokeDasharray="4 4"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول پیشرفت ستونی به تفکیک مبحث با سطح‌بندی آموزشی ایران */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> ریز نمرات تسلط و سطح یادگیری
        </h4>
        <div className="space-y-2">
          {data.map((item) => {
            const isCritical = item.mastery < 60;
            const isMastered = item.mastery >= 75;

            return (
              <div
                key={item.topicId}
                className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCritical
                          ? "bg-rose-500"
                          : isMastered
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="font-bold text-slate-800">{item.subject}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        isCritical
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isMastered
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isCritical
                        ? "نیازمند جبران"
                        : isMastered
                        ? "تسلط عالی"
                        : "در حال تثبیت"}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900">{item.mastery}٪</span>
                  </div>
                </div>

                {/* نوار پیشرفت افقی */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? "bg-rose-500"
                        : isMastered
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
