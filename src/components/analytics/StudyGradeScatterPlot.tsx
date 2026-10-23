"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";
import { CorrelationResult } from "@/lib/analytics/psychometrics";
import { TrendingUp, Clock, Award } from "lucide-react";

interface ScatterPoint {
  name: string;
  studyHours: number;
  grade: number;
  zScore: number;
  taraz: number;
}

interface StudyGradeScatterPlotProps {
  data: ScatterPoint[];
  correlation: CorrelationResult;
}

export const StudyGradeScatterPlot: React.FC<StudyGradeScatterPlotProps> = ({
  data,
  correlation,
}) => {
  // ساخت نقاط خط رگرسیون y = a*x + b برای ابتدا و انتهای محور X
  const minX = Math.min(...data.map((d) => d.studyHours), 0);
  const maxX = Math.max(...data.map((d) => d.studyHours), 20);

  const regLineData = [
    {
      studyHours: minX,
      regressionGrade: Math.max(0, Math.min(20, correlation.slope * minX + correlation.intercept)),
    },
    {
      studyHours: maxX,
      regressionGrade: Math.max(0, Math.min(20, correlation.slope * maxX + correlation.intercept)),
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            نمودار پراکندگی و رگرسیون همبستگی ساعت مطالعه هفتگی با نمره
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            سنجش ضریب همبستگی پیرسون ($r = {correlation.r}$) و اثر واقعی ساعات مطالعه بر عملکرد کلاسی
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              correlation.r >= 0.5
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : correlation.r >= 0.2
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            ضریب پیرسون: r = {correlation.r} (ضریب تعیین: {correlation.rSquared})
          </span>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="studyHours"
              name="ساعت مطالعه هفتگی"
              unit=" ساعت"
              domain={[0, "auto"]}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              type="number"
              dataKey="grade"
              name="نمره"
              domain={[0, 20]}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as ScatterPoint;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                        {pt.name}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">ساعت مطالعه هفتگی:</span>
                        <span className="font-bold text-blue-300">{pt.studyHours} ساعت</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">نمره ارزشیابی:</span>
                        <span className="font-black text-emerald-300">{pt.grade} از ۲۰</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">نمره استاندارد Z:</span>
                        <span className="font-bold text-purple-300">{pt.zScore}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">تراز سنجش:</span>
                        <span className="font-bold text-amber-400">{pt.taraz}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              name="دانش‌آموزان"
              data={data}
              fill="#3b82f6"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs">
        <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800">
            معادله خط رگرسیون پیش‌بینی نمره:{" "}
            <span dir="ltr" className="inline-block font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              Grade = {correlation.slope} × (Hours) + {correlation.intercept}
            </span>
          </span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {correlation.interpretation}
          </p>
        </div>
      </div>
    </div>
  );
};
