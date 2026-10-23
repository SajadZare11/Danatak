"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface KaTeXFormulaHelperProps {
  onInsert: (snippet: string) => void;
  className?: string;
}

export const KaTeXFormulaHelper: React.FC<KaTeXFormulaHelperProps> = ({
  onInsert,
  className = "",
}) => {
  const snippets: { label: string; snippet: string; preview: string }[] = [
    { label: "کسر", snippet: "$\\frac{a}{b}$", preview: "a/b" },
    { label: "رادیکال", snippet: "$\\sqrt{x}$", preview: "√x" },
    { label: "توان", snippet: "$x^2$", preview: "x²" },
    { label: "اندیس", snippet: "$x_1$", preview: "x₁" },
    { label: "حد", snippet: "$\\lim_{x \\to 0} f(x)$", preview: "lim" },
    { label: "انتگرال", snippet: "$\\int_{a}^{b} f(x) dx$", preview: "∫" },
    { label: "مشتق کسری", snippet: "$\\frac{df}{dx}$", preview: "df/dx" },
    { label: "سیگما", snippet: "$\\sum_{i=1}^{n}$", preview: "Σ" },
    { label: "قدر مطلق", snippet: "$|x|$", preview: "|x|" },
    { label: "عدد پی", snippet: "$\\pi$", preview: "π" },
    { label: "آلفا و بتا", snippet: "$\\alpha, \\beta$", preview: "α, β" },
    { label: "نامساوی", snippet: "$\\le, \\ge$", preview: "≤, ≥" },
    { label: "نتیجه‌گیری", snippet: "$\\implies$", preview: "⇒" },
    { label: "بلوک فرمول", snippet: "$$\n f'(x) = 2x \n$$", preview: "$$ ... $$" },
  ];

  return (
    <div className={`p-2.5 bg-slate-100 rounded-xl border border-slate-200/80 space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span className="flex items-center gap-1 text-indigo-700">
          <Sparkles className="w-3 h-3 text-indigo-600" /> جعبه ابزار درج سریع فرمول‌های ریاضی و فیزیک:
        </span>
        <span className="text-[10px] text-slate-400">با یک کلیک در متن قرار می‌گیرد</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {snippets.map((s, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onInsert(s.snippet)}
            className="px-2 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-800 rounded-lg border border-slate-200 text-xs font-mono font-semibold shadow-2xs transition"
            title={s.snippet}
          >
            <span className="text-[11px] font-vazir text-indigo-700 ml-1">{s.label}:</span>
            <span className="text-slate-600">{s.preview}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
