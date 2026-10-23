import { CardRating } from "./types";

export interface SM2State {
  easinessFactor: number; // پیش‌فرض: ۲.۵، حداقل: ۱.۳
  interval: number; // فاصله به روز
  repetitions: number; // تعداد تکرارهای متوالی موفق
  lapseCount: number; // تعداد دفعات افتادن کارت
}

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  lapseCount: number;
  nextReviewDate: Date;
  intervalDisplayFa: string; // نمایش متنی زیبا برای کاربر: «فردا»، «۳ روز بعد»، «۲ هفته بعد»
}

/**
 * پیاده‌سازی رسمی الگوریتم مرور فاصله‌دار SuperMemo-2 (SM-2)
 */
export class SM2Engine {
  /**
   * محاسبه پیش‌بینی فاصله مرور بعدی برای هر ۴ دکمه قبل از انتخاب کاربر
   */
  static getEstimatedIntervals(currentState: SM2State): Record<CardRating, string> {
    return {
      1: this.calculate(currentState, 1).intervalDisplayFa,
      2: this.calculate(currentState, 2).intervalDisplayFa,
      3: this.calculate(currentState, 3).intervalDisplayFa,
      4: this.calculate(currentState, 4).intervalDisplayFa,
    };
  }

  /**
   * اجرای الگوریتم SM-2 بر روی امتیاز انتخابی کاربر
   * @param currentState وضعیت فعلی کارت
   * @param rating امتیاز انتخابی: ۱ (دوباره)، ۲ (سخت)، ۳ (خوب)، ۴ (آسان)
   */
  static calculate(currentState: SM2State, rating: CardRating): SM2Result {
    let { easinessFactor, interval, repetitions, lapseCount } = currentState;

    // تبدیل امتیاز ۱ تا ۴ به مقیاس کیفیت ۰ تا ۵ در استاندارد SM-2
    // ۱ (دوباره) -> ۱ (Fail)
    // ۲ (سخت) -> ۳ (Pass with difficulty)
    // ۳ (خوب) -> ۴ (Good pass)
    // ۴ (آسان) -> ۵ (Perfect pass)
    const qualityMap: Record<CardRating, number> = {
      1: 1,
      2: 3,
      3: 4,
      4: 5,
    };
    const q = qualityMap[rating];

    // ۱. به‌روزرسانی ضریب سهولت (Easiness Factor)
    // فرمول SM-2: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easinessFactor = easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easinessFactor < 1.3) easinessFactor = 1.3;
    easinessFactor = Math.round(easinessFactor * 100) / 100;

    // ۲. محاسبه تکرارها و فاصله مرور
    if (q < 3) {
      // حالت فراموشی (دوباره): ریست شدن تکرارها
      repetitions = 0;
      interval = 1; // مرور مجدد در فردا (یا در پایان جلسه جاری)
      lapseCount = (lapseCount || 0) + 1;
    } else {
      // حالت پاسخ درست
      if (repetitions === 0) {
        interval = rating === 2 ? 1 : 1;
      } else if (repetitions === 1) {
        interval = rating === 2 ? 2 : rating === 3 ? 4 : 6;
      } else {
        const factor = rating === 2 ? Math.max(1.2, easinessFactor * 0.85) : easinessFactor;
        interval = Math.round(interval * factor);
      }
      repetitions += 1;
    }

    // ۳. محاسبه تاریخ دقیق سررسید بعدی
    const nextReviewDate = new Date();
    if (rating === 1) {
      // ۱۰ دقیقه بعد برای دوباره (یا ابتدای روز بعد)
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 15);
    } else {
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    }

    // ۴. برچسب متنی فارسی فاصله مرور
    const intervalDisplayFa = this.formatIntervalFa(interval, rating);

    return {
      easinessFactor,
      interval,
      repetitions,
      lapseCount,
      nextReviewDate,
      intervalDisplayFa,
    };
  }

  /**
   * قالب‌بندی فارسی مدت زمان تا مرور بعدی
   */
  private static formatIntervalFa(intervalDays: number, rating: CardRating): string {
    if (rating === 1) return "< ۱۵ دقیقه";
    if (intervalDays === 1) return "فردا (۱ روز)";
    if (intervalDays === 2) return "۲ روز بعد";
    if (intervalDays < 7) return `${intervalDays} روز بعد`;
    if (intervalDays < 14) return "۱ هفته بعد";
    if (intervalDays < 30) return `${Math.round(intervalDays / 7)} هفته بعد`;
    return `${Math.round(intervalDays / 30)} ماه بعد`;
  }
}
