import { FSRSCardData, FSRSRating, FSRSReviewResult, FSRSState } from "./types";

/**
 * پیاده‌سازی رسمی و ریاضی الگوریتم FSRS (Free Spaced Repetition Scheduler v4.5+)
 * جایگزین فوق‌پیشرفته و هوشمند SM-2 و لایتنر سنتی
 * مبنای محاسبات: پایداری حافظه (S)، دشواری مبحث (D) و احتمال بازیابی/یادآوری (R)
 */
export class FSRSEngine {
  // وزن‌های بهینه‌سازی‌شده علمی FSRS
  private static readonly WEIGHTS = [
    0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
    0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898,
  ];

  // نرخ یادآوری هدف (Retention Target) = ۹۰٪
  private static readonly REQUESTED_RETENTION = 0.9;

  /**
   * محاسبه احتمال یادآوری فعلی بر اساس زمان سپری شده (Retrievability R)
   * فرمول: R(t, S) = (1 + t / (9 * S))^-1
   */
  static calculateRetrievability(card: FSRSCardData, currentDate: Date = new Date()): number {
    if (!card.lastReviewedAt) {
      return card.state === "NEW" ? 0.0 : 0.9;
    }

    const last = new Date(card.lastReviewedAt).getTime();
    const now = currentDate.getTime();
    const elapsedDays = Math.max(0, (now - last) / (1000 * 60 * 60 * 24));

    if (card.stability <= 0) return 0.1;
    const r = Math.pow(1 + elapsedDays / (9 * card.stability), -1);
    return Math.max(0, Math.min(1, r));
  }

  /**
   * ارزیابی و محاسبه وضعیت جدید کارت پس از پاسخ کاربر (Rating: 1..4)
   * 1 = Again (غلط/فراموشی کامل)
   * 2 = Hard (پاسخ با دشواری و مکث زیاد)
   * 3 = Good (پاسخ درست با تسلط مناسب)
   * 4 = Easy (پاسخ آنی و کاملاً مسلط)
   */
  static calculateNextState(
    card: FSRSCardData,
    rating: FSRSRating,
    reviewDate: Date = new Date()
  ): FSRSReviewResult {
    const w = this.WEIGHTS;
    const isNew = card.state === "NEW" || !card.lastReviewedAt;
    const currentR = isNew ? 0.0 : this.calculateRetrievability(card, reviewDate);

    let newStability = card.stability;
    let newDifficulty = card.difficulty;
    let newState: FSRSState = card.state;
    let reps = card.reps;
    let lapses = card.lapses;

    if (isNew) {
      // مقداردهی اولیه پایداری و دشواری
      newStability = Math.max(0.1, w[rating - 1]);
      newDifficulty = Math.min(10, Math.max(1, w[4] - (rating - 3) * w[5]));
      newState = rating === 1 ? "LEARNING" : "REVIEW";
      if (rating >= 2) reps = 1;
      else lapses = 1;
    } else {
      // به‌روزرسانی ضریب دشواری (Difficulty) با رگرسیون به میانگین
      const deltaD = -(w[6] * (rating - 3));
      const initD3 = w[4];
      const meanReversion = w[7] * initD3 + (1 - w[7]) * (card.difficulty + deltaD);
      newDifficulty = Math.min(10, Math.max(1, meanReversion));

      if (rating === 1) {
        // فراموشی و لغزش (Lapse)
        lapses += 1;
        reps = 0;
        newState = "RELEARNING";
        // فرمول کاهش پایداری در لغزش
        const lapseS =
          w[11] *
          Math.pow(newDifficulty, -w[12]) *
          (Math.pow(card.stability + 1, w[13]) - 1) *
          Math.exp(w[14] * (1 - currentR));
        newStability = Math.max(0.1, Math.min(card.stability * 0.5, lapseS));
      } else {
        // پاسخ موفق (Recall)
        reps += 1;
        newState = "REVIEW";

        let hardPenalty = 1.0;
        let easyBonus = 1.0;
        if (rating === 2) hardPenalty = w[15];
        if (rating === 4) easyBonus = w[16];

        // فرمول افزایش پایداری FSRS
        const factor =
          1 +
          Math.exp(w[8]) *
            (11 - newDifficulty) *
            Math.pow(card.stability, -w[9]) *
            (Math.exp(w[10] * (1 - currentR)) - 1) *
            hardPenalty *
            easyBonus;

        newStability = Math.max(card.stability * 1.05, card.stability * factor);
      }
    }

    // محاسبه فاصله زمانی تا مرور بعدی بر اساس احتمال یادآوری ۹۰٪
    // t = 9 * S * (1/R - 1)
    let intervalDays = Math.round(9 * newStability * (1 / this.REQUESTED_RETENTION - 1));
    if (rating === 1) {
      intervalDays = 0; // همان روز یا چند ساعت بعد
    } else if (intervalDays < 1) {
      intervalDays = 1;
    }

    const nextScheduled = new Date(reviewDate);
    if (intervalDays === 0) {
      // مرور مجدد بعد از ۱۰ دقیقه در همان جلسه
      nextScheduled.setMinutes(nextScheduled.getMinutes() + 10);
    } else {
      nextScheduled.setDate(nextScheduled.getDate() + intervalDays);
      nextScheduled.setHours(4, 0, 0, 0); // تنظیم به ۴ صبح روز سررسید
    }

    const updatedCard: FSRSCardData = {
      itemId: card.itemId,
      conceptKey: card.conceptKey,
      stability: Number(newStability.toFixed(3)),
      difficulty: Number(newDifficulty.toFixed(2)),
      reps,
      lapses,
      state: newState,
      lastReviewedAt: reviewDate.toISOString(),
      nextReviewDate: nextScheduled.toISOString(),
      lastRating: rating,
    };

    return {
      updatedCard,
      intervalDays,
      retrievability: Number(currentR.toFixed(3)),
      scheduledDate: nextScheduled,
    };
  }

  /**
   * آیا زمان مرور این کارت فرا رسیده است؟
   */
  static isDue(card: FSRSCardData, currentDate: Date = new Date()): boolean {
    const dueTime = new Date(card.nextReviewDate).getTime();
    return currentDate.getTime() >= dueTime;
  }

  /**
   * تولید نقاط نمودار فراموشی اِبینگ‌هاوس (Forgetting Curve) برای نمایش به دانش‌آموز
   */
  static generateForgettingCurve(
    card: FSRSCardData,
    daysAhead: number = 14
  ): Array<{ day: number; dateStr: string; retrievability: number; percent: number }> {
    const points: Array<{ day: number; dateStr: string; retrievability: number; percent: number }> = [];
    const baseDate = card.lastReviewedAt ? new Date(card.lastReviewedAt) : new Date();

    for (let day = 0; day <= daysAhead; day++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + day);

      const r = Math.pow(1 + day / (9 * Math.max(0.1, card.stability)), -1);
      const clampedR = Math.max(0, Math.min(1, r));

      points.push({
        day,
        dateStr: targetDate.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        retrievability: Number(clampedR.toFixed(3)),
        percent: Math.round(clampedR * 100),
      });
    }

    return points;
  }

  /**
   * تحلیل و دسته‌بندی کارتهای سررسید روزانه (Daily Review Deck)
   */
  static analyzeDeck(cards: FSRSCardData[], now: Date = new Date()) {
    const dueCards: FSRSCardData[] = [];
    const upcomingCards: FSRSCardData[] = [];
    let totalRetention = 0;

    cards.forEach((c) => {
      const r = this.calculateRetrievability(c, now);
      totalRetention += r;

      if (this.isDue(c, now)) {
        dueCards.push(c);
      } else {
        upcomingCards.push(c);
      }
    });

    const avgRetention = cards.length > 0 ? Math.round((totalRetention / cards.length) * 100) : 100;

    return {
      totalCards: cards.length,
      dueCount: dueCards.length,
      dueCards,
      upcomingCards,
      avgRetention,
    };
  }
}
