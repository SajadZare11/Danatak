"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";

interface SubjectRadarItem {
  subject: string;
  studentScore: number;
  classAverage: number;
  maxScore: number;
  zScore: number;
}

interface SubjectComparisonRadarProps {
  data: SubjectRadarItem[];
  studentName: string;
}

export const SubjectComparisonRadar: React.FC<SubjectComparisonRadarProps> = ({
  data,
  studentName,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            رادار مقایسه چنددرسی ({studentName} در برابر میانگین کلاس)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تحلیل متوازن نقاط قوت و ضعف مهارتی دانش‌آموز در کلیه دروس بر مقیاس ۲۰ نمره
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 20]} stroke="#cbd5e1" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as SubjectRadarItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                        درس: {item.subject}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">نمره دانش‌آموز:</span>
                        <span className="font-black text-rose-400">{item.studentScore} از ۲۰</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">میانگین کل کلاس:</span>
                        <span className="font-bold text-indigo-300">{item.classAverage} از ۲۰</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">نمره استاندارد Z:</span>
                        <span className="font-bold text-purple-300">{item.zScore}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Radar
              name={`نمرات ${studentName}`}
              dataKey="studentScore"
              stroke="#f43f5e"
              fill="#f43f5e"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Radar
              name="میانگین کل کلاس"
              dataKey="classAverage"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
