"use client";

import React, { useState } from "react";
import { X, Sparkles, Plus, Check } from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface KaTeXEquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latexCode: string) => void;
}

export const KaTeXEquationModal: React.FC<KaTeXEquationModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [latex, setLatex] = useState("f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}");

  if (!isOpen) return null;

  const quickPresets = [
    { label: "مشتق حدی", code: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
    { label: "کسر ساده", code: "\\frac{a}{b}" },
    { label: "رادیکال", code: "\\sqrt{x^2 + y^2}" },
    { label: "انتگرال معین", code: "\\int_{a}^{b} f(x)\\,dx" },
    { label: "مجموع (سیگما)", code: "\\sum_{i=1}^{n} x_i" },
    { label: "حد تابع", code: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1" },
    { label: "ماتریس ۲×۲", code: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
    { label: "معادله درجه ۲", code: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
    { label: "بردار و زاویه", code: "\\vec{v} = (v_x, v_y), \\quad \\theta = 45^\\circ" },
  ];

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden text-right text-slate-100">
        {/* هدر مدال */}
        <div className="px-6 py-4 bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">درج فرمول ریاضی و علمی (KaTeX)</h3>
              <p className="text-[10px] text-slate-400">تایپ کدهای استاندارد لاتک با پیش‌نمایش آنی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* میانبرهای سریع فرمول‌ها */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400">میانبرهای فرمول‌های پرکاربرد:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLatex(p.code)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-700 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* فیلد ورودی لاتک */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">کد لاتک (LaTeX):</label>
            <textarea
              rows={3}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-indigo-300 text-xs focus:outline-hidden focus:border-indigo-500 text-left"
              dir="ltr"
              placeholder="\frac{a}{b}"
            />
          </div>

          {/* پیش‌نمایش آنی با KaTeX */}
          <div className="space-y-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-800 min-h-20 flex flex-col justify-center items-center">
            <span className="text-[10px] text-slate-500 self-start">پیش‌نمایش فرمول روی تخته:</span>
            <div className="text-white text-base overflow-x-auto py-2">
              <KaTeXRenderer content={`$$${latex}$$`} />
            </div>
          </div>

          {/* دکمه‌های پایین مدال */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>درج روی تخته‌سیاه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
