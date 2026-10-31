"use client";

import React, { useState, useEffect } from "react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  Calendar,
  X,
  TrendingDown,
  Sparkles,
  Zap,
  CheckCircle2,
  RotateCw,
  Award,
} from "lucide-react";

interface DailyFSRSReviewDeckModalProps {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
  onCardReviewed?: () => void;
}

export const DailyFSRSReviewDeckModal: React.FC<DailyFSRSReviewDeckModalProps> = ({
  isOpen,
  studentId,
  onClose,
  onCardReviewed,
}) => {
  const [loading, setLoading] = useState(true);
  const [deckData, setDeckData] = useState<any | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [activeTab, setActiveTab] = useState<"deck" | "curve">("deck");

  const fetchFSRSData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/adaptive/fsrs?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setDeckData(data);
      }
    } catch (err) {
      console.error("Failed to load FSRS deck:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchFSRSData();
      setCurrentCardIndex(0);
      setIsAnswerRevealed(false);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const dueCards = deckData?.analysis?.dueCards || [];
  const currentCard = dueCards[currentCardIndex];
  const forgettingCurve = deckData?.forgettingCurve || [];

  const handleRate = async (rating: number) => {
    if (!currentCard) return;

    try {
      await fetch("/api/adaptive/fsrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          itemId: currentCard.itemId,
          conceptKey: currentCard.conceptKey,
          rating,
        }),
      });

      setIsAnswerRevealed(false);
      if (currentCardIndex + 1 < dueCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // پایان دسته کارت‌های امروز
        fetchFSRSData();
      }

      if (onCardReviewed) onCardReviewed();
    } catch (err) {
      console.error("Error submitting FSRS rating:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* هدر مدال با تم های‌تک */}
        <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-xs text-indigo-300 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                الگوریتم پیشرفته تکرار با فاصله FSRS v4.5
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                دسته مرورهای روزانه (Daily Review Deck)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* سوییچر تب‌ها: کارت‌ها vs نمودار فراموشی */}
        <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("deck")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "deck"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>کارت‌های سررسید امروز ({dueCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("curve")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "curve"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>نمودار فراموشی اِبینگ‌هاوس و نرخ پایداری</span>
          </button>
        </div>

        {/* محتوای بدنه */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-500">در حال همگام‌سازی الگوریتم FSRS...</div>
            </div>
          ) : activeTab === "deck" ? (
            dueCards.length > 0 && currentCard ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                    مفهوم: {currentCard.conceptKey}
                  </span>
                  <span>
                    کارت {currentCardIndex + 1} از {dueCards.length}
                  </span>
                </div>

                {/* کارت مرور سریع */}
                <div className="min-h-56 p-6 rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 flex flex-col justify-between text-center space-y-4 shadow-sm">
                  <div className="text-xs text-slate-400 font-bold">
                    پایداری در حافظه: {currentCard.stability} روز • دشواری: {currentCard.difficulty} از ۱۰
                  </div>

                  <div className="text-sm sm:text-base font-black text-slate-900 py-4 leading-relaxed">
                    <KaTeXRenderer content={currentCard.conceptKey} />
                  </div>

                  {!isAnswerRevealed ? (
                    <button
                      type="button"
                      onClick={() => setIsAnswerRevealed(true)}
                      className="mx-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>نمایش پاسخ و ارزیابی</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-200 text-xs font-bold animate-in fade-in">
                      پاسخ در حافظه شما بازیابی شد. رتبه بازیابی خود را انتخاب کنید:
                    </div>
                  )}
                </div>

                {/* رتبه‌بندی ۴ گانه FSRS */}
                {isAnswerRevealed && (
                  <div className="grid grid-cols-4 gap-2 text-xs pt-2 animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => handleRate(1)}
                      className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold flex flex-col items-center gap-1 transition"
                    >
                      <span>دوباره (Again)</span>
                      <span className="text-[10px] text-rose-600">&lt;۱۰ دقیقه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(2)}
                      className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold flex flex-col items-center gap-1 transition"
                    >
                      <span>سخت (Hard)</span>
                      <span className="text-[10px] text-amber-600">۱ روز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(3)}
                      className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold flex flex-col items-center gap-1 transition"
                    >
                      <span>خوب (Good)</span>
                      <span className="text-[10px] text-indigo-600">۳ روز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(4)}
                      className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-bold flex flex-col items-center gap-1 transition"
                    >
                      <span>آسان (Easy)</span>
                      <span className="text-[10px] text-emerald-700">۷ روز</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-800">
                    تمامی مرورهای امروز شما انجام شد! 🎉
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    هیچ مفهومی در آستانه فراموشی قرار ندارد. مرورهای بعدی به صورت خودکار در موعد علمی دقیق سررسید خواهند شد.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* تب نمودار فراموشی اِبینگ‌هاوس */
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                  <span>منحنی زوال حافظه و نقطه یادآوری هدف (Retention Target = 90%)</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  الگوریتم FSRS دقیقا در روزی که احتمال یادآوری شما به ۹۰٪ افت کند، کارت را در مرور قرار می‌دهد تا منحنی حافظه مجدداً به ۱۰۰٪ بازگردد.
                </p>
              </div>

              {/* نمایش بصری نقاط منحنی */}
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2">
                  {forgettingCurve.slice(0, 7).map((pt: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-center space-y-1"
                    >
                      <div className="text-[10px] text-slate-400 font-bold">روز {pt.day}</div>
                      <div
                        className={`text-xs font-black font-mono ${
                          pt.percent >= 90
                            ? "text-emerald-600"
                            : pt.percent >= 70
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {pt.percent}٪
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pt.percent >= 90 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${pt.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
