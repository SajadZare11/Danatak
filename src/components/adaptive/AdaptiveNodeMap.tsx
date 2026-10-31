"use client";

import React from "react";
import {
  AdaptiveCourseStructure,
  AdaptiveLearningNode,
} from "@/lib/adaptive/types";
import {
  Sparkles,
  Lock,
  Play,
  CheckCircle2,
  Star,
  Flame,
  Award,
  Zap,
  Clock,
  Swords,
  BookOpen,
  Calendar,
  Share2,
} from "lucide-react";

interface NodeProgressRecord {
  nodeId: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  bestScore: number;
  starsEarned: number;
  heartsLeft: number;
}

interface AdaptiveNodeMapProps {
  course: AdaptiveCourseStructure;
  progresses?: Record<string, NodeProgressRecord>;
  onSelectNode: (node: AdaptiveLearningNode) => void;
  onOpenDailyDeck?: () => void;
  dailyDueCount?: number;
  totalXP?: number;
  currentStreak?: number;
  onUploadNew?: () => void;
}

export const AdaptiveNodeMap: React.FC<AdaptiveNodeMapProps> = ({
  course,
  progresses = {},
  onSelectNode,
  onOpenDailyDeck,
  dailyDueCount = 0,
  totalXP = 420,
  currentStreak = 5,
  onUploadNew,
}) => {
  const allNodes: AdaptiveLearningNode[] = [...course.nodes, course.bossFight];

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      {/* بنر هدر نقشه با استایل بازی‌های مدرن آموزشی */}
      <section className="bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-400/30 text-xs px-3.5 py-1 rounded-full font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              موتور یادگیری تطبیقی بر پایه علوم شناختی و FSRS
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {course.title}
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
              {course.summary || course.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-[11px] font-bold bg-white/10 px-3 py-1 rounded-xl border border-white/10 text-indigo-200">
                مبحث: {course.topicTag || "حسابان"}
              </span>
              <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                کشینگ هش SHA-256 (هزینه ۰$)
              </span>
            </div>
          </div>

          {/* ابزارک‌های وضعیت گیمیفیکیشن */}
          <div className="flex flex-wrap sm:flex-col gap-3 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-xs text-slate-200 w-full sm:w-auto shrink-0">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>مجموع امتیاز (XP)</span>
              </div>
              <span className="font-mono font-black text-amber-300 text-sm">{totalXP} XP</span>
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>استریک روزانه</span>
              </div>
              <span className="font-mono font-black text-orange-400 text-sm">{currentStreak} روز 🔥</span>
            </div>

            {onOpenDailyDeck && (
              <button
                type="button"
                onClick={onOpenDailyDeck}
                className="mt-1 w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>مرورهای امروز FSRS</span>
                {dailyDueCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {dailyDueCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* نقشه نودهای مرحله‌ای (Path Progression) */}
      <div className="relative py-4 space-y-6">
        {/* خط اتصال بین مراحل */}
        <div className="absolute right-8 top-12 bottom-12 w-1 bg-gradient-to-b from-indigo-500 via-indigo-300 to-purple-600 rounded-full hidden sm:block pointer-events-none" />

        {allNodes.map((node, index) => {
          const prog = progresses[node.id];
          const isUnlocked = prog ? prog.isUnlocked : index === 0;
          const isCompleted = prog?.isCompleted || false;
          const stars = prog?.starsEarned || 0;
          const bestScore = prog?.bestScore || 0;
          const isBoss = node.isBossFight;

          let cardBorder = "border-slate-200 bg-white hover:border-indigo-400";
          if (!isUnlocked) {
            cardBorder = "border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed";
          } else if (isBoss) {
            cardBorder =
              "border-2 border-rose-500 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:border-rose-400";
          } else if (isCompleted) {
            cardBorder = "border-emerald-300 bg-emerald-50/30 hover:border-emerald-400";
          }

          return (
            <div
              key={node.id}
              className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border shadow-xs ${cardBorder}`}
            >
              <div className="flex items-start sm:items-center gap-4">
                {/* آیکون وضعیت نود */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    !isUnlocked
                      ? "bg-slate-200 text-slate-500"
                      : isBoss
                      ? "bg-gradient-to-tr from-rose-600 to-amber-500 text-white animate-bounce"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-indigo-600 text-white ring-4 ring-indigo-200/50 animate-pulse"
                  }`}
                >
                  {!isUnlocked ? (
                    <Lock className="w-6 h-6" />
                  ) : isBoss ? (
                    <Swords className="w-7 h-7 text-amber-200" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </div>

                {/* جزئیات نود */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        isBoss
                          ? "bg-rose-500/30 text-rose-300 border border-rose-400/30"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {isBoss ? "مرحله غول نهایی" : `مرحله ${node.nodeNumber}`}
                    </span>

                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        isBoss ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {node.estimatedMinutes} دقیقه
                    </span>

                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        isBoss ? "text-amber-300" : "text-amber-600"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      +{node.xpReward} XP
                    </span>
                  </div>

                  <h3
                    className={`text-base sm:text-lg font-black tracking-tight ${
                      isBoss ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {node.title}
                  </h3>

                  <p
                    className={`text-xs line-clamp-1 max-w-xl ${
                      isBoss ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {node.description}
                  </p>

                  {/* مفاهیم کلیدی */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {node.keyConcepts.map((concept, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded-md ${
                          isBoss
                            ? "bg-white/10 text-slate-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* اکشن و ستاره‌ها */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                {/* ستاره‌ها */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= stars
                          ? "text-amber-400 fill-amber-400"
                          : isBoss
                          ? "text-slate-600"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                  {bestScore > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold mr-1 ${
                        isBoss ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {bestScore}٪
                    </span>
                  )}
                </div>

                {/* دکمه ورود به مرحله */}
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => onSelectNode(node)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                    !isUnlocked
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : isBoss
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-slate-950 font-black shadow-lg hover:scale-105"
                      : isCompleted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-md shadow-indigo-600/20"
                  }`}
                >
                  {isBoss ? (
                    <>
                      <Swords className="w-4 h-4" />
                      <span>ورود به نبرد غول ⚔️</span>
                    </>
                  ) : isCompleted ? (
                    <span>مرور مجدد مرحله</span>
                  ) : (
                    <span>شروع مرحله ۵ دقیقه‌ای</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
