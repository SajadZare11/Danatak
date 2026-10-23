"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Tag,
  BookOpen,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

export interface QuestionItem {
  id: string;
  topicId: string;
  content: string;
  type: string;
  difficulty: string;
  isPublic: boolean;
  explanation?: string | null;
  tags?: string | null;
  createdAt: string;
  topic?: {
    id: string;
    title: string;
    textbook?: {
      title: string;
      gradeLevel: number;
    };
  };
  author?: {
    id: string;
    fullName: string;
  } | null;
  options: Array<{
    id: string;
    optionText: string;
    orderIndex: number;
    isCorrect: boolean;
  }>;
}

interface QuestionCardProps {
  question: QuestionItem;
  onDelete?: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onDelete }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "OLYMPIAD":
        return { label: "المپیادی / ویژه", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "HARD":
        return { label: "سخت (کنکوری)", color: "bg-rose-100 text-rose-800 border-rose-200" };
      case "MEDIUM":
        return { label: "متوسط (نهایی)", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "EASY":
      default:
        return { label: "ساده (مفهومی)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "DESCRIPTIVE":
        return "تشریحی";
      case "TRUE_FALSE":
        return "صحیح / غلط";
      case "FILL_BLANK":
        return "جای خالی";
      case "MULTIPLE_CHOICE":
      default:
        return "تستی ۴ گزینه‌ای";
    }
  };

  const diffBadge = getDifficultyBadge(question.difficulty);

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این سوال از بانک سوالات اطمینان دارید؟")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(question.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const tagList = question.tags ? question.tags.split(",").map((t) => t.trim()) : [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4">
      {/* هدر بالایی کارت سوال */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {question.topic && (
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              [{question.topic.textbook?.title || "کتاب درسی"}] {question.topic.title}
            </span>
          )}

          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${diffBadge.color}`}
          >
            {diffBadge.label}
          </span>

          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {getTypeLabel(question.type)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            {question.isPublic ? (
              <span className="text-emerald-700 flex items-center gap-0.5">
                <Globe className="w-3 h-3" /> عمومی
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-0.5">
                <Lock className="w-3 h-3" /> اختصاصی
              </span>
            )}
          </span>

          {question.author && (
            <span className="text-indigo-700 font-medium">طراح: {question.author.fullName}</span>
          )}

          {onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
              title="حذف سوال"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* صورت سوال */}
      <div className="text-xs font-semibold text-slate-900 leading-relaxed">
        <KaTeXRenderer content={question.content} />
      </div>

      {/* گزینه‌ها (برای سوالات تستی) */}
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {question.options.map((opt) => (
            <div
              key={opt.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                opt.isCorrect
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <KaTeXRenderer content={opt.optionText} />
              {opt.isCorrect && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> کلید
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* راهنمای تصحیح / پاسخ تشریحی تاشو */}
      {question.explanation && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            {showExplanation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showExplanation ? "بستن پاسخنامه و راهنمای تصحیح" : "مشاهده پاسخنامه تشریحی و بارم‌بندی"}
          </button>

          {showExplanation && (
            <div className="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-indigo-100 text-xs text-slate-800 leading-relaxed space-y-1 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-indigo-700 block">
                راهنمای حل تشریحی و بارم نمره:
              </span>
              <KaTeXRenderer content={question.explanation} />
            </div>
          )}
        </div>
      )}

      {/* برچسب‌ها */}
      {tagList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tagList.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
            >
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
