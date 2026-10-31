"use client";

import React, { useState, useEffect } from "react";
import {
  AdaptiveLearningNode,
  AdaptiveAssessmentItem,
} from "@/lib/adaptive/types";
import { MultipleChoiceView } from "./MultipleChoiceView";
import { ClozeDeletionView } from "./ClozeDeletionView";
import { SpeedMatchView } from "./SpeedMatchView";
import { SpotErrorView } from "./SpotErrorView";
import { FeynmanRoomView } from "./FeynmanRoomView";
import { FlashcardMnemonicView } from "./FlashcardMnemonicView";
import { GroundedRemediationModal } from "./GroundedRemediationModal";
import {
  Heart,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  Swords,
  Timer,
  CheckCircle2,
  XCircle,
  Star,
  ChevronLeft,
} from "lucide-react";

interface GamifiedStudyPlayerProps {
  node: AdaptiveLearningNode;
  onFinish: (result: {
    score: number;
    heartsLeft: number;
    starsEarned: number;
    streakCount: number;
  }) => void;
  onBackToMap: () => void;
}

export const GamifiedStudyPlayer: React.FC<GamifiedStudyPlayerProps> = ({
  node,
  onFinish,
  onBackToMap,
}) => {
  const items = node.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [remediationItem, setRemediationItem] = useState<AdaptiveAssessmentItem | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // برای باس فایت: زمان و جون غول
  const isBoss = node.isBossFight;
  const [bossHp, setBossHp] = useState(100);
  const [bossTimeLeft, setBossTimeLeft] = useState(180);

  // تایمر باس‌فایت
  useEffect(() => {
    if (!isBoss || isCompleted || isGameOver) return;
    if (bossTimeLeft <= 0) {
      setIsGameOver(true);
      return;
    }

    const t = setInterval(() => {
      setBossTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [isBoss, bossTimeLeft, isCompleted, isGameOver]);

  const currentItem = items[currentIndex];

  const handleItemAnswer = (isCorrect: boolean, answerStr: string) => {
    if (isCorrect) {
      setStreak((prev) => prev + 1);
      setScoreCount((prev) => prev + 1);
      setSessionXP((prev) => prev + (isBoss ? 30 : 15));

      if (isBoss) {
        // کاهش جان باس
        const damage = Math.round(100 / Math.max(1, items.length));
        setBossHp((prev) => Math.max(0, prev - damage));
      }

      // حرکت خودکار به سوال بعدی پس از ۸۰۰ میلی‌ثانیه
      setTimeout(() => {
        advanceNext();
      }, 750);
    } else {
      // پاسخ نادرست: کاهش جان و صفر شدن استریک
      setStreak(0);
      setHearts((prev) => {
        const nextHearts = Math.max(0, prev - 1);
        if (nextHearts === 0) {
          setIsGameOver(true);
        }
        return nextHearts;
      });

      // فعال‌سازی مدال رفع اشکال مبتنی بر شواهد (Grounded Remediation)
      setRemediationItem(currentItem);
    }
  };

  const advanceNext = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // پایان جلسه نود
      completeSession();
    }
  };

  const completeSession = () => {
    setIsCompleted(true);
    const finalScore = Math.round((scoreCount / Math.max(1, items.length)) * 100);
    let stars = 1;
    if (finalScore >= 90) stars = 3;
    else if (finalScore >= 70) stars = 2;

    onFinish({
      score: finalScore,
      heartsLeft: hearts,
      starsEarned: stars,
      streakCount: streak,
    });
  };

  const handleCloseRemediation = () => {
    setRemediationItem(null);
    advanceNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      {/* نوار وضعیت بالایی HUD (Hearts, Streak, Progress, XP) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all flex items-center justify-between gap-4 ${
          isBoss
            ? "bg-slate-950 border-rose-900/60 text-white"
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        <button
          type="button"
          onClick={onBackToMap}
          className="p-2 rounded-xl hover:bg-slate-100/10 text-slate-400 hover:text-slate-200 transition flex items-center gap-1 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden sm:inline">نقشه مراحل</span>
        </button>

        {/* نوار پیشرفت */}
        <div className="flex-1 max-w-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>
              سوال {currentIndex + 1} از {items.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / items.length) * 100)}٪</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200/40 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isBoss ? "bg-rose-500" : "bg-indigo-600"
              }`}
              style={{
                width: `${((currentIndex + 1) / items.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* قلب‌ها (Lives) */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((h) => (
            <Heart
              key={h}
              className={`w-5 h-5 transition-all ${
                h <= hearts
                  ? "text-rose-500 fill-rose-500 scale-100"
                  : "text-slate-300 dark:text-slate-700 scale-90"
              }`}
            />
          ))}
        </div>

        {/* شمارنده استریک */}
        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-2xl text-xs font-bold">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{streak}</span>
        </div>

        {/* مجموع XP در این جلسه */}
        <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-2xl text-xs font-bold font-mono">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>+{sessionXP}</span>
        </div>
      </div>

      {/* بخش اختصاصی غول مرحله نهایی (Boss Arena HUD) */}
      {isBoss && (
        <div className="bg-gradient-to-l from-rose-950 via-slate-900 to-indigo-950 p-5 rounded-3xl border border-rose-700/50 text-white space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-rose-400 animate-bounce" />
              <span className="font-black text-sm">غول حسابان و مشتق کنکور (Boss Fight)</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs bg-rose-500/20 px-3 py-1 rounded-xl text-rose-300 border border-rose-500/30">
              <Timer className="w-4 h-4" />
              <span>{bossTimeLeft} ثانیه تا پایان نبرد</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-200">
              <span>میزان جان باقی‌مانده غول:</span>
              <span className="font-mono font-bold">{bossHp}٪</span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-rose-500/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-500 rounded-full"
                style={{ width: `${bossHp}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* کانتینر اصلی رندر سوال فعلی */}
      {!isCompleted && !isGameOver && currentItem && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md min-h-96">
          {currentItem.type === "multiple_choice" && (
            <MultipleChoiceView item={currentItem} onAnswer={handleItemAnswer} />
          )}
          {currentItem.type === "cloze_deletion" && (
            <ClozeDeletionView item={currentItem} onAnswer={handleItemAnswer} />
          )}
          {currentItem.type === "speed_match" && (
            <SpeedMatchView item={currentItem} onAnswer={handleItemAnswer} />
          )}
          {currentItem.type === "spot_error" && (
            <SpotErrorView item={currentItem} onAnswer={handleItemAnswer} />
          )}
          {currentItem.type === "feynman_prompt" && (
            <FeynmanRoomView item={currentItem} onAnswer={handleItemAnswer} />
          )}
          {currentItem.type === "flashcard_mnemonic" && (
            <FlashcardMnemonicView item={currentItem} onAnswer={handleItemAnswer} />
          )}
        </div>
      )}

      {/* مدال ارجاع مستقیم به جزوه (Grounded Remediation Modal) */}
      {remediationItem && (
        <GroundedRemediationModal
          isOpen={true}
          item={remediationItem}
          onClose={handleCloseRemediation}
        />
      )}

      {/* صفحه باخت / تمام شدن جان‌ها */}
      {isGameOver && (
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 border border-rose-800 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/40">
            <XCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">جان‌های شما به پایان رسید!</h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              نگران نباشید! طبق علوم شناختی، اشتباه کردن اولین گام درک عمیق است. می‌توانید پس از مرور کوتاه، مجدداً این مرحله را آغاز کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToMap}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 text-white font-black text-xs rounded-2xl shadow-lg transition"
          >
            بازگشت به نقشه مراحل
          </button>
        </div>
      )}

      {/* صفحه پیروزی و تکمیل نود */}
      {isCompleted && (
        <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 border border-indigo-700 shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 mx-auto flex items-center justify-center shadow-lg animate-bounce">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              مرحله با موفقیت فتح شد!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {isBoss ? "🏆 پیروزی حماسی بر غول مرحله نهایی!" : "آفرین! تسلط عالی بر این مفاهیم"}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              +{isBoss ? 150 : node.xpReward} امتیاز تجربه (XP) به حساب شما واریز شد و نود بعدی باز شد.
            </p>
          </div>

          {/* ستاره‌ها */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className="w-8 h-8 text-amber-400 fill-amber-400 filter drop-shadow-md"
              />
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToMap}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition transform hover:scale-105"
            >
              ادامه مسیر یادگیری روی نقشه 🗺️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
