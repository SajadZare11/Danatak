"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { BellCurveBin, DescriptiveStats } from "@/lib/analytics/psychometrics";

interface BellCurveHistogramProps {
  bins: BellCurveBin[];
  stats: DescriptiveStats;
}

export const BellCurveHistogram: React.FC<BellCurveHistogramProps> = ({
  bins,
  stats,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            توزیع فراوانی نمرات و برازش منحنی نرمال گاوسی (Bell Curve)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            مقایسه توزیع واقعی نمرات کلاس با منحنی استاندارد نرمال بر پایه $\mu = {stats.mean}$ و $\sigma = {stats.stdDev}$
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
            میانگین: {stats.mean}
          </span>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200">
            انحراف معیار: {stats.stdDev}
          </span>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={bins} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="binLabel"
              tick={{ fontSize: 11, fill: "#64748b" }}
              interval={0}
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              unit="٪"
              domain={[0, "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as BellCurveBin;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                        بازه نمره: {data.binLabel}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">تعداد دانش‌آموز:</span>
                        <span className="font-black text-indigo-300">{data.count} نفر</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">درصد کلاسی واقعی:</span>
                        <span className="font-bold text-white">{data.percentage}٪</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">چگالی تئوری نرمال:</span>
                        <span className="font-bold text-purple-300">{data.normalDensity}٪</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="left"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />
            <Bar
              name="درصد فراوانی واقعی نمرات کلاس"
              dataKey="percentage"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              barSize={38}
            />
            <Line
              name="منحنی برازش تئوری نرمال گاوسی"
              type="monotone"
              dataKey="normalDensity"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ r: 4, fill: "#a855f7" }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <span className="text-slate-400 block">کمترین نمره (Min)</span>
          <span className="font-black text-slate-800 text-sm">{stats.min}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <span className="text-slate-400 block">بیشترین نمره (Max)</span>
          <span className="font-black text-slate-800 text-sm">{stats.max}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <span className="text-slate-400 block">دامنه نمرات (Range)</span>
          <span className="font-black text-slate-800 text-sm">{stats.range}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <span className="text-slate-400 block">واریانس ($\sigma^2$)</span>
          <span className="font-black text-slate-800 text-sm">{stats.variance}</span>
        </div>
      </div>
    </div>
  );
};
