"use client";

import React, { useState } from "react";
import { GitBranch, ArrowLeft, AlertCircle, CheckCircle2, Zap, HelpCircle, Layers } from "lucide-react";

export interface GraphNode {
  id: string;
  title: string;
  gradeLevel: number;
  major: string;
  bookTitle: string;
  masteryPercentage: number;
  status: "MASTERED" | "MODERATE" | "CRITICAL";
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceGrade: number;
  targetId: string;
  targetTitle: string;
  targetGrade: number;
  importance: number;
}

interface PrerequisiteGraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onOpenDiagnosticTest?: (nodeId: string, nodeTitle: string) => void;
  className?: string;
}

export const PrerequisiteGraphViewer: React.FC<PrerequisiteGraphViewerProps> = ({
  nodes,
  edges,
  onOpenDiagnosticTest,
  className = "",
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // دسته‌بندی گره‌ها بر اساس پایه تحصیلی
  const grade10Nodes = nodes.filter((n) => n.gradeLevel === 10);
  const grade11Nodes = nodes.filter((n) => n.gradeLevel === 11);
  const grade12Nodes = nodes.filter((n) => n.gradeLevel === 12);

  const getStatusColor = (status: "MASTERED" | "MODERATE" | "CRITICAL") => {
    switch (status) {
      case "CRITICAL":
        return {
          bg: "bg-rose-50 hover:bg-rose-100",
          border: "border-rose-400 ring-rose-200",
          text: "text-rose-950",
          badge: "bg-rose-600 text-white",
          dot: "bg-rose-500",
          label: "گره بحرانی (زیر ۶۰٪)",
        };
      case "MODERATE":
        return {
          bg: "bg-amber-50 hover:bg-amber-100",
          border: "border-amber-400 ring-amber-200",
          text: "text-amber-950",
          badge: "bg-amber-600 text-white",
          dot: "bg-amber-500",
          label: "متوسط (۶۰-۷۴٪)",
        };
      case "MASTERED":
      default:
        return {
          bg: "bg-emerald-50 hover:bg-emerald-100",
          border: "border-emerald-400 ring-emerald-200",
          text: "text-emerald-950",
          badge: "bg-emerald-600 text-white",
          dot: "bg-emerald-500",
          label: "تسلط کامل (۷۵٪+)",
        };
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* هدر راهنمای گراف پیوسته پیش‌نیازها */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white border border-indigo-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-0.5 rounded-full">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            گراف پیوسته پیش‌نیازهای درسی (Cross-Grade Knowledge Graph)
          </div>
          <h3 className="font-extrabold text-base text-white">زنجیره اتصال مفاهیم از دهم تا دوازدهم</h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            ضعف در دوازدهم معمولاً ناشی از گره‌های یادگیری حل‌نشده در سال‌های پایه است. روی هر گره کلیک کنید تا ارتباط پیش‌نیازها و راهکار عارضه‌یابی را مشاهده فرمایید.
          </p>
        </div>

        {/* راهنمای رنگ‌ها */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> تسلط مطلوب
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> متوسط
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> گره قرمز
          </span>
        </div>
      </div>

      {/* بوم چیدمان گراف پیش‌نیازها به تفکیک پایه تحصیلی */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 overflow-x-auto shadow-inner">
        <div className="min-w-[720px] grid grid-cols-3 gap-6 relative">
          {/* ستون ۱: پایه دهم (مفاهیم بنیادی) */}
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block">مرحله ۱ (پایه دهم)</span>
              <strong className="text-xs text-slate-800">مفاهیم بنیادی و اتحادها</strong>
            </div>

            <div className="space-y-3">
              {grade10Nodes.map((node) => {
                const styles = getStatusColor(node.status);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                      styles.bg
                    } ${styles.border} ${
                      isSelected ? "scale-105 ring-4" : "hover:scale-102"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">ریاضی ۱ دهم</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                        {node.masteryPercentage}٪
                      </span>
                    </div>
                    <div className={`font-extrabold text-xs mt-2 ${styles.text}`}>{node.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                      {styles.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ستون ۲: پایه یازدهم (پل ارتباطی) */}
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-bold text-indigo-400 block">مرحله ۲ (پایه یازدهم)</span>
              <strong className="text-xs text-slate-800">پل تحلیلی و مبحث حد</strong>
            </div>

            <div className="space-y-3">
              {grade11Nodes.map((node) => {
                const styles = getStatusColor(node.status);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                      styles.bg
                    } ${styles.border} ${
                      isSelected ? "scale-105 ring-4" : "hover:scale-102"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">حسابان ۱ یازدهم</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                        {node.masteryPercentage}٪
                      </span>
                    </div>
                    <div className={`font-extrabold text-xs mt-2 ${styles.text}`}>{node.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                      {styles.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ستون ۳: پایه دوازدهم (مباحث نهایی و کنکوری) */}
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-bold text-amber-500 block">مرحله ۳ (پایه دوازدهم)</span>
              <strong className="text-xs text-slate-800">مشتق و کاربردهای پیشرفته</strong>
            </div>

            <div className="space-y-3">
              {grade12Nodes.map((node) => {
                const styles = getStatusColor(node.status);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                      styles.bg
                    } ${styles.border} ${
                      isSelected ? "scale-105 ring-4" : "hover:scale-102"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">حسابان ۲ دوازدهم</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                        {node.masteryPercentage}٪
                      </span>
                    </div>
                    <div className={`font-extrabold text-xs mt-2 ${styles.text}`}>{node.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                      {styles.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* پنل جزئیات گره انتخابی و زنجیره پیش‌نیازها */}
      {selectedNode ? (
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs text-indigo-600 font-bold">
                تحلیل گره انتخاب‌شده ({selectedNode.bookTitle}):
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedNode.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">درصد تسلط فعلی:</span>
              <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {selectedNode.masteryPercentage}٪
              </span>
            </div>
          </div>

          {/* روابط پیش‌نیازی این گره */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">زنجیره وابستگی در گراف:</span>
            {edges
              .filter((e) => e.targetId === selectedNode.id || e.sourceId === selectedNode.id)
              .map((e) => {
                const isTarget = e.targetId === selectedNode.id;
                return (
                  <div
                    key={e.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 font-bold">
                        {isTarget ? "⬅ پیش‌نیاز مستقیم:" : "➡ پیش‌نیاز برای مبحث:"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {isTarget ? e.sourceTitle : e.targetTitle}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ضریب اهمیت: {e.importance * 100}٪
                    </span>
                  </div>
                );
              })}
          </div>

          {/* پیشنهاد اقدام در صورت افت */}
          {selectedNode.status === "CRITICAL" && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900">
                  <strong>هشدار افت تحصیلی:</strong> تسلط در این مبحث زیر ۶۰٪ است. برای جلوگیری از عمیق‌تر شدن گره یادگیری، تست تشخیصی از پیش‌نیازهای سال قبل پیشنهاد می‌شود.
                </div>
              </div>

              {onOpenDiagnosticTest && (
                <button
                  type="button"
                  onClick={() => onOpenDiagnosticTest(selectedNode.id, selectedNode.title)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" /> شروع تست تشخیصی ریشه‌ای
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          برای دیدن زنجیره پیش‌نیازها و راهکار عارضه‌یابی، روی هر یک از گره‌های بالا کلیک کنید.
        </div>
      )}
    </div>
  );
};
