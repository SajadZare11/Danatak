"use client";

import React, { useState } from "react";
import { GeneratedMindMapNode, GeneratedMindMapEdge } from "@/lib/study-studio/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Sparkles,
  Share2,
} from "lucide-react";

interface MindMapViewerProps {
  nodes: GeneratedMindMapNode[];
  edges: GeneratedMindMapEdge[];
  title?: string;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  nodes,
  edges,
  title = "نقشه ذهنی مفاهیم",
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // محاسبه موقعیت دوبعدی گره‌ها به فرمت چرخه‌ای/شبکه‌ای
  const width = 800;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodePositions = nodes.map((node, idx) => {
    if (idx === 0) {
      // گره ریشه در مرکز
      return { ...node, x: centerX, y: centerY };
    }
    const angle = ((idx - 1) / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(width, height) * 0.38;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // یافتن یال‌های متصل به گره انتخاب‌شده
  const connectedEdges = edges.filter(
    (e) => e.source === selectedNodeId || e.target === selectedNodeId
  );

  const getCategoryColor = (category?: string, isSelected?: boolean) => {
    if (isSelected) return "fill-amber-400 stroke-amber-600";
    if (category?.includes("ریشه") || category?.includes("پایه")) return "fill-indigo-600 stroke-indigo-800";
    if (category?.includes("کاربرد") || category?.includes("شاخه")) return "fill-emerald-600 stroke-emerald-800";
    if (category?.includes("نتیجه") || category?.includes("فرمول")) return "fill-purple-600 stroke-purple-800";
    return "fill-blue-600 stroke-blue-800";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
      {/* هدر نقشه ذهنی و ابزار زوم */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            گراف پیوسته ارتباطات مفهومی سرفصل‌ها (با کلیک روی هر گره، جزئیات پیوندها را ببینید)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 hover:bg-white text-slate-700 rounded-xl transition shadow-xs"
            title="بزرگنمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-slate-500 px-1 font-mono">
            {Math.round(zoomLevel * 100)}٪
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 hover:bg-white text-slate-700 rounded-xl transition shadow-xs"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 hover:bg-white text-slate-700 rounded-xl transition shadow-xs"
            title="بازنشانی زوم"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* بوم گراف SVG تعاملی */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* خطوط یال‌ها و پیکان‌های ارتباطی */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="16"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.8" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodePositions.find((n) => n.id === edge.source);
            const targetNode = nodePositions.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isConnectedToSelected =
              sourceNode.id === selectedNodeId || targetNode.id === selectedNodeId;

            return (
              <g key={edge.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isConnectedToSelected ? "#f59e0b" : "#475569"}
                  strokeWidth={isConnectedToSelected ? "2.5" : "1.5"}
                  strokeDasharray={isConnectedToSelected ? "none" : "4 2"}
                  markerEnd="url(#arrowhead)"
                  opacity={isConnectedToSelected ? 1 : 0.6}
                  className="transition-all duration-300"
                />
                {edge.label && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2 - 6}
                    fill={isConnectedToSelected ? "#fef08a" : "#94a3b8"}
                    fontSize="11"
                    fontFamily="Vazirmatn, sans-serif"
                    textAnchor="middle"
                    className="select-none font-bold"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* رسم گره‌های گراف */}
          {nodePositions.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const colorClass = getCategoryColor(node.category, isSelected);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer group"
              >
                {/* هاله نور در زمان انتخاب */}
                {isSelected && (
                  <circle
                    r="34"
                    fill="#f59e0b"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                <circle
                  r={isSelected ? "26" : "22"}
                  className={`${colorClass} transition-all duration-300 group-hover:scale-110 shadow-lg`}
                  strokeWidth="2.5"
                />

                <text
                  textAnchor="middle"
                  dy="40"
                  fill={isSelected ? "#fef08a" : "#e2e8f0"}
                  fontSize={isSelected ? "12" : "11"}
                  fontWeight="bold"
                  fontFamily="Vazirmatn, sans-serif"
                  className="select-none drop-shadow"
                >
                  {node.label}
                </text>

                {node.category && (
                  <text
                    textAnchor="middle"
                    dy="-30"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="Vazirmatn, sans-serif"
                    className="select-none"
                  >
                    {node.category}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* کشوی اطلاعات گره انتخاب‌شده */}
      {selectedNode && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-indigo-600" />
              مفهوم انتخاب‌شده: {selectedNode.label}
            </span>
            {selectedNode.category && (
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                دسته‌بندی: {selectedNode.category}
              </span>
            )}
          </div>

          {selectedNode.description && (
            <p className="text-slate-600 leading-relaxed font-sans" dir="auto">
              <KaTeXRenderer content={selectedNode.description} />
            </p>
          )}

          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span>ارتباطات فعال این گره: {connectedEdges.length} پیوند مفهومی</span>
          </div>
        </div>
      )}
    </div>
  );
};
