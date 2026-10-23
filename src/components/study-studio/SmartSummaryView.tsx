"use client";

import React, { useState } from "react";
import { GeneratedSummary } from "@/lib/study-studio/types";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  FileText,
  Key,
  BookMarked,
  CheckCircle2,
  Copy,
  Check,
  Search,
} from "lucide-react";

interface SmartSummaryViewProps {
  summary: GeneratedSummary;
  topicTitle?: string;
}

export const SmartSummaryView: React.FC<SmartSummaryViewProps> = ({
  summary,
  topicTitle = "خلاصه مبحث",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);

  const filteredGlossary = (summary.glossary || []).filter(
    (g) =>
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (term: string, def: string) => {
    navigator.clipboard.writeText(`${term}: ${def}`);
    setCopiedTerm(term);
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* بخش چکیده مفهومی درس */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5" />
          <h3 className="text-base font-black text-slate-800">چکیده مفهومی و ساختار کلی سرفصل</h3>
        </div>

        <div className="text-sm leading-relaxed text-slate-700 font-sans" dir="auto">
          <KaTeXRenderer content={summary.overview} />
        </div>
      </section>

      {/* نکات کلیدی و تقلب‌نامه امتحانی */}
      <section className="bg-gradient-to-br from-indigo-50/70 to-slate-50 p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-amber-600 font-bold border-b border-indigo-100/70 pb-3">
          <Key className="w-5 h-5" />
          <h3 className="text-base font-black text-slate-800">نکات کلیدی و تقلب‌نامه سریع (Key Takeaways)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(summary.keyTakeaways || []).map((point, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium" dir="auto">
                <KaTeXRenderer content={point} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* واژه‌نامه تخصصی و اصطلاحات */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <BookMarked className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">واژه‌نامه تخصصی مفاهیم و تعاریف (Glossary)</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در اصطلاحات..."
              className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {filteredGlossary.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:bg-slate-50/70 p-2 rounded-xl transition"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {item.term}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed pr-4 font-sans" dir="auto">
                    <KaTeXRenderer content={item.definition} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item.term, item.definition)}
                  className="self-end sm:self-center p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                  title="کپی تعریف"
                >
                  {copiedTerm === item.term ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            اصطلاحی مطابق با عبارت جستجو یافت نشد.
          </div>
        )}
      </section>
    </div>
  );
};
