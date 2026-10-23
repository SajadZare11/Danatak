"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MasteryRadarChart, RadarItem } from "@/components/mastery/MasteryRadarChart";
import {
  PrerequisiteGraphViewer,
  GraphNode,
  GraphEdge,
} from "@/components/mastery/PrerequisiteGraphViewer";
import { DiagnosticTestModal, DiagnosticData } from "@/components/mastery/DiagnosticTestModal";
import {
  Award,
  GitBranch,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  User,
  CheckCircle,
} from "lucide-react";

export default function MasteryPage() {
  const [activeTab, setActiveTab] = useState<"radar" | "graph">("radar");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    student: {
      id: string;
      fullName: string;
      nationalId: string;
      gradeLevel: number;
      major: string;
      schoolName: string;
      avgMastery: number;
      streakDays: number;
      totalXP: number;
    };
    radarData: RadarItem[];
    graphNodes: GraphNode[];
    graphEdges: GraphEdge[];
    diagnosticRecommendations: DiagnosticData[];
  } | null>(null);

  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticData | null>(null);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/mastery/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
        if (data.diagnosticRecommendations && data.diagnosticRecommendations.length > 0) {
          setSelectedDiagnostic(data.diagnosticRecommendations[0]);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">
          در حال بارگذاری موتور رادار تسلط و گراف پیش‌نیازها...
        </p>
      </div>
    );
  }

  const student = analyticsData?.student;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* هدر ماژول روز سوم */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              موتور تحلیلی رادار تسلط موضوعی و گراف پیوسته پیش‌نیازها
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            بررسی دقیق سطح فهم سرفصل‌ها، ردیابی پیوسته زنجیره یادگیری و کشف ریشه افت تحصیلی از سال‌های پایه
          </p>
        </div>

        <Link
          href="/teacher"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <ArrowRight className="w-4 h-4" /> بازگشت به پنل معلم
        </Link>
      </div>

      {/* بنر مشخصات دانش‌آموز فعال در دمو (علی رضایی) */}
      {student && (
        <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-indigo-400">
              {student.fullName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">{student.fullName}</span>
                <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  کد ملی: {student.nationalId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                پایه {student.gradeLevel} {student.major} • {student.schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block">میانگین تسلط کل</span>
              <strong className="text-sm font-black text-amber-400">{student.avgMastery}٪</strong>
            </div>
            <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block">امتیاز گیمیفیکیشن</span>
              <strong className="text-sm font-black text-indigo-300">{student.totalXP} XP</strong>
            </div>
          </div>
        </div>
      )}

      {/* نوار تب‌های ماژول رادار / گراف */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("radar")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === "radar"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" />
          رادار تسلط موضوعی (Mastery Radar)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === "graph"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          گراف پیوسته پیش‌نیازها و عارضه‌یابی ریشه‌ای
        </button>
      </div>

      {/* محتوای رادار تسلط */}
      {activeTab === "radar" && analyticsData?.radarData && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-150">
          <MasteryRadarChart
            data={analyticsData.radarData}
            studentName={student?.fullName || "علی رضایی"}
          />
        </div>
      )}

      {/* محتوای گراف پیش‌نیازها و عارضه‌یابی */}
      {activeTab === "graph" && analyticsData?.graphNodes && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-150 space-y-6">
          <PrerequisiteGraphViewer
            nodes={analyticsData.graphNodes}
            edges={analyticsData.graphEdges}
            onOpenDiagnosticTest={(nodeId, nodeTitle) => {
              const diag =
                analyticsData.diagnosticRecommendations.find(
                  (d) => d.strugglingTopic.id === nodeId || d.rootCausePrerequisite.id === nodeId
                ) || analyticsData.diagnosticRecommendations[0];

              if (diag) {
                setSelectedDiagnostic(diag);
                setIsDiagnosticModalOpen(true);
              }
            }}
          />

          {/* کارت توصیه‌های عارضه‌یابی هوشمند */}
          {analyticsData.diagnosticRecommendations.length > 0 && (
            <div className="p-5 bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  پیشنهاد عارضه‌یابی ریشه‌ای آماده اجرا:
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  تشخیص خودکار سیستم
                </span>
              </div>

              {analyticsData.diagnosticRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                      {rec.analysisMessage}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      مبحث هدف: {rec.strugglingTopic.title} ({rec.strugglingTopic.mastery}٪) ⬅ مبحث پیش‌نیاز:{" "}
                      {rec.rootCausePrerequisite.title} ({rec.rootCausePrerequisite.currentMastery}٪)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDiagnostic(rec);
                      setIsDiagnosticModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" /> اجرای تست تشخیصی ریشه‌ای
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مدال تعاملی تست تشخیصی */}
      {student && (
        <DiagnosticTestModal
          isOpen={isDiagnosticModalOpen}
          onClose={() => setIsDiagnosticModalOpen(false)}
          diagnostic={selectedDiagnostic}
          studentProfileId={student.id}
          onCompleted={() => {
            fetchAnalytics();
          }}
        />
      )}
    </div>
  );
}
