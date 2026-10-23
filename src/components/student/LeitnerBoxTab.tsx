"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  Flame,
  Award,
  Zap,
  BookOpen,
  ChevronLeft,
  X,
  HelpCircle,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface LeitnerCardItem {
  id: string;
  studentId: string;
  frontContent: string;
  backContent: string;
  boxLevel: number; // 1 to 5
  nextReviewAt: string;
  reviewCount: number;
  successCount: number;
  topic?: {
    id: string;
    title: string;
  };
}

interface LeitnerBoxTabProps {
  studentId: string;
  onRefreshStats?: () => void;
}

export const LeitnerBoxTab: React.FC<LeitnerBoxTabProps> = ({
  studentId,
  onRefreshStats,
}) => {
  const [cards, setCards] = useState<LeitnerCardItem[]>([]);
  const [boxCounts, setBoxCounts] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [totalCards, setTotalCards] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // فیلتر خانه انتخابی (ALL یا ۱ تا ۵)
  const [selectedBoxFilter, setSelectedBoxFilter] = useState<number | "ALL">("ALL");

  // حالت جلسه فعال مرور کارت‌ها (Active Review Session)
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);

  // مودال افزودن کارت جدید
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/leitner?studentId=${studentId}&boxLevel=${selectedBoxFilter}`
      );
      const data = await res.json();
      setCards(data.cards || []);
      if (data.boxCounts) setBoxCounts(data.boxCounts);
      if (data.totalCards !== undefined) setTotalCards(data.totalCards);
      if (data.dueTodayCount !== undefined) setDueTodayCount(data.dueTodayCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [selectedBoxFilter]);

  // ثبت نتیجه مرور کارت (ارتقا به خانه بالاتر یا برگشت به خانه ۱)
  const handleReviewCard = async (isSuccess: boolean) => {
    const currentCard = cards[activeReviewIndex];
    if (!currentCard) return;

    try {
      const res = await fetch("/api/student/leitner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reviewCard",
          cardId: currentCard.id,
          isSuccess,
        }),
      });
      const data = await res.json();

      if (isSuccess) {
        setSessionXP((prev) => prev + 5);
        if (onRefreshStats) onRefreshStats();
      }

      // حرکت به کارت بعدی یا اتمام مرور
      setIsFlipped(false);
      if (activeReviewIndex + 1 < cards.length) {
        setActiveReviewIndex((prev) => prev + 1);
      } else {
        setIsReviewing(false);
        setActiveReviewIndex(0);
        fetchCards();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // افزودن کارت فلش‌کارت دستی جدید
  const handleCreateNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    setIsCreatingCard(true);
    try {
      const res = await fetch("/api/student/leitner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createCard",
          frontContent: newFront,
          backContent: newBack,
        }),
      });

      if (res.ok) {
        setNewFront("");
        setNewBack("");
        setIsAddModalOpen(false);
        fetchCards();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingCard(false);
    }
  };

  const boxDetails = [
    { level: 1, title: "خانه ۱", interval: "هر روز", color: "from-rose-500 to-pink-600", desc: "یادگیری اولیه" },
    { level: 2, title: "خانه ۲", interval: "هر ۲ روز", color: "from-orange-500 to-amber-600", desc: "تثبیت مقدماتی" },
    { level: 3, title: "خانه ۳", interval: "هر ۴ روز", color: "from-amber-500 to-yellow-600", desc: "تثبیت میان‌مدت" },
    { level: 4, title: "خانه ۴", interval: "هر ۸ روز", color: "from-blue-500 to-indigo-600", desc: "تسلط بالا" },
    { level: 5, title: "خانه ۵", interval: "هر ۱۶ روز", color: "from-emerald-500 to-teal-600", desc: "حافظه بلندمدت 🎯" },
  ];

  return (
    <div className="space-y-6">
      {/* بنر سربرگ جعبه لایتنر ۵ خانه */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-indigo-100 border border-white/30 text-xs px-3 py-1 rounded-full">
            <Box className="w-3.5 h-3.5 text-amber-300" />
            سیستم مرور فاصله‌دار لایتنر (Spaced Repetition System)
          </div>
          <h2 className="text-xl md:text-2xl font-black">جعبه ۵ خانه لایتنر هوشمند</h2>
          <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
            کارت‌ها و فرمول‌های مهم بر اساس الگوریتم علمی منحنی فراموشی ابینگهاوس در ۵ مرحله مرور
            می‌شوند تا برای همیشه در حافظه بلندمدت شما ثبت گردند.
          </p>
        </div>

        {/* دکمه‌های اکشن سریع */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {cards.length > 0 && !isReviewing && (
            <button
              type="button"
              onClick={() => {
                setActiveReviewIndex(0);
                setIsFlipped(false);
                setIsReviewing(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              شروع مرور کارت‌ها ({cards.length} کارت)
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/20 transition"
          >
            <Plus className="w-4 h-4" />
            کارت فرمول جدید
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* نمای بصری خانه‌های ۵گانه جعبه لایتنر */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {boxDetails.map((b) => {
          const count = boxCounts[b.level] || 0;
          const isSelected = selectedBoxFilter === b.level;

          return (
            <button
              key={b.level}
              type="button"
              onClick={() => setSelectedBoxFilter(isSelected ? "ALL" : b.level)}
              className={`p-4 rounded-3xl border text-right transition-all flex flex-col justify-between h-32 relative overflow-hidden group ${
                isSelected
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{b.title}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {b.interval}
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {count} <span className="text-xs font-normal text-slate-400">کارت</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{b.desc}</div>
              </div>

              {/* نوار رنگی نشانگر خانه */}
              <div
                className={`absolute bottom-0 right-0 left-0 h-1.5 bg-gradient-to-r ${b.color}`}
              />
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* حالت فعال جلسه مرور ۳D (Active Flashcard Review Deck) */}
      {/* ========================================================================= */}
      {isReviewing && cards.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-100 p-6 md:p-10 rounded-3xl border border-indigo-100 shadow-xl max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          {/* نوار بالای کارت در حال مرور */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              کارت {activeReviewIndex + 1} از {cards.length}
            </span>

            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">
              مستقر در خانه {cards[activeReviewIndex]?.boxLevel}
            </span>

            <button
              type="button"
              onClick={() => setIsReviewing(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              خروج از مرور ✕
            </button>
          </div>

          {/* کارت ۳D فلش‌کارت لایتنر */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-md min-h-[260px] flex flex-col justify-between text-center transition-all transform hover:scale-[1.01]"
          >
            <div className="text-[11px] font-bold text-slate-400">
              {isFlipped ? "پشت کارت (پاسخ و نکته کلیدی):" : "روی کارت (فرمول یا سوال):"}
            </div>

            <div className="py-6 text-base md:text-lg font-bold text-slate-900 leading-relaxed">
              <KaTeXRenderer
                content={
                  isFlipped
                    ? cards[activeReviewIndex]?.backContent
                    : cards[activeReviewIndex]?.frontContent
                }
              />
            </div>

            <div className="text-[11px] text-indigo-600 font-bold flex items-center justify-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>برای مشاهده {isFlipped ? "روی کارت" : "پاسخ کارت"} کلیک کنید</span>
            </div>
          </div>

          {/* دکمه‌های ارزیابی خودکار دانش‌آموز (بلدم / بلد نیستم) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleReviewCard(false)}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition"
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>بلد نیستم (برگشت به خانه ۱)</span>
            </button>

            <button
              type="button"
              onClick={() => handleReviewCard(true)}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs font-black transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>کاملاً مسلطم (+۵ XP ➔ خانه بعدی)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* لیست کارت‌های موجود در جعبه لایتنر */}
      {/* ========================================================================= */}
      {!isReviewing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              کارت‌های ثبت‌شده ({cards.length} کارت)
            </h3>
            {selectedBoxFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedBoxFilter("ALL")}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                نمایش تمام خانه‌ها
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-bold mt-2">در حال بارگذاری کارت‌های لایتنر...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-bold">
                <Box className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-800">هنوز کارتی در این خانه قرار ندارد</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                می‌توانید از تب «دفترچه اشتباهات» سوالات سخت را به لایتنر بفرستید، یا با دکمه زیر کارت فرمول جدید بسازید.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                افزودن اولین کارت فرمول
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((c, index) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                        مستقر در خانه {c.boxLevel}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        مرور بعدی: {new Date(c.nextReviewAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 leading-relaxed pt-1">
                      <KaTeXRenderer content={c.frontContent} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>دفعات مرور: {c.reviewCount} بار</span>
                    <span className="text-emerald-600 font-bold">
                      موفقیت: {c.successCount} بار
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* مودال ساخت کارت جدید */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                افزودن فلش‌کارت و فرمول جدید به جعبه لایتنر
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCard} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  روی کارت (صورت سوال یا فرمول KaTeX):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: مشتق تابع کسری: $\left(\frac{u}{v}\right)'$"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  پشت کارت (پاسخ تشریحی، اثبات، نکته کلیدی):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: $\frac{u'v - v'u}{v^2}$ (مشتق صورت در مخرج منهای مشتق مخرج در صورت بر توان دو مخرج)"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCard}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {isCreatingCard ? "در حال ثبت..." : "ثبت در خانه ۱ لایتنر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
