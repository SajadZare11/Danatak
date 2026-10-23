/**
 * کتابخانه جامع محاسبات آماری، روان‌سنجی و ارزیابی تحصیلی داناتک (Danatak Psychometrics Suite)
 * پیاده‌سازی فرمول‌های استاندارد روان‌سنجی آموزشی و آمار توصیفی/استنباطی (مشابه SPSS و Jamovi)
 */

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  variance: number;
  stdDev: number;
  cv: number; // Coefficient of Variation (درصد)
  min: number;
  max: number;
  range: number;
}

export interface QuartileStats {
  q1: number; // چارک اول (صدک ۲۵)
  median: number; // چارک دوم (صدک ۵۰)
  q3: number; // چارک سوم (صدک ۷۵)
  iqr: number; // دامنه میان‌چارکی
  lowerWhisker: number; // کران پایین نمودار جعبه‌ای
  upperWhisker: number; // کران بالا
  outliers: number[]; // داده‌های پرت خارج از کران‌ها
}

export interface DistributionShape {
  skewness: number; // چولگی (تقارن توزیع)
  kurtosis: number; // کشیدگی (پهن یا نوک‌تیز بودن)
  skewnessType: "SYMMETRIC" | "RIGHT_SKEWED" | "LEFT_SKEWED";
  interpretation: string;
}

export interface StudentStandardScores {
  rawScore: number;
  zScore: number; // نمره استاندارد زد (میانگین ۰، انحراف معیار ۱)
  tScore: number; // نمره استاندارد تی (میانگین ۵۰، انحراف معیار ۱۰)
  taraz: number; // تراز سازمان سنجش (۳۰۰۰ تا ۱۰۰۰۰)
  percentileRank: number; // رتبه صدکی (۰ تا ۱۰۰ درصد)
  classRank: number; // رتبه عددی در کلاس (۱ = بهترین)
  status: "EXCELLENT" | "GOOD" | "AVERAGE" | "AT_RISK" | "CRITICAL";
}

export interface CorrelationResult {
  r: number; // ضریب همبستگی پیرسون (-1 تا +1)
  rSquared: number; // ضریب تعیین (R^2)
  slope: number; // شیب خط رگرسیون y = ax + b
  intercept: number; // عرض از مبدا
  strength: "STRONG_POSITIVE" | "MODERATE_POSITIVE" | "WEAK" | "NEGATIVE";
  interpretation: string;
}

export interface ItemAnalysisResult {
  difficultyIndex: number; // ضریب دشواری p (0 تا 1)
  discriminationIndex: number; // ضریب تمیز d (-1 تا +1)
  evaluation: "VERY_EASY" | "EASY" | "IDEAL" | "HARD" | "VERY_HARD";
  discriminationQuality: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "DEFECTIVE";
}

export interface BellCurveBin {
  binLabel: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  normalDensity: number; // مقدار تئوری منحنی نرمال برای برازش
}

// ==========================================
// ۱. شاخص‌های گرایش به مرکز و پراکندگی
// ==========================================

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(2));
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

export function calculateMode(values: number[]): number[] {
  if (values.length === 0) return [];
  const freqMap = new Map<number, number>();
  let maxFreq = 0;

  for (const v of values) {
    const f = (freqMap.get(v) || 0) + 1;
    freqMap.set(v, f);
    if (f > maxFreq) maxFreq = f;
  }

  if (maxFreq === 1 && values.length > 1) return []; // تمام اعداد برابر ۱ بار تکرار شده‌اند

  const modes: number[] = [];
  freqMap.forEach((freq, key) => {
    if (freq === maxFreq) modes.push(key);
  });
  return modes.sort((a, b) => a - b);
}

export function calculateVariance(values: number[], isSample: boolean = true): number {
  if (values.length <= 1) return 0;
  const mean = calculateMean(values);
  const sumSq = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const divisor = isSample ? values.length - 1 : values.length;
  return Number((sumSq / divisor).toFixed(3));
}

export function calculateStdDev(values: number[], isSample: boolean = true): number {
  return Number(Math.sqrt(calculateVariance(values, isSample)).toFixed(2));
}

export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      mode: [],
      variance: 0,
      stdDev: 0,
      cv: 0,
      min: 0,
      max: 0,
      range: 0,
    };
  }

  const count = values.length;
  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const mode = calculateMode(values);
  const variance = calculateVariance(values, true);
  const stdDev = calculateStdDev(values, true);
  const cv = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Number((max - min).toFixed(2));

  return {
    count,
    mean,
    median,
    mode,
    variance,
    stdDev,
    cv,
    min,
    max,
    range,
  };
}

// ==========================================
// ۲. چارک‌ها و نمودار جعبه‌ای (Box Plot)
// ==========================================

export function calculateQuartiles(values: number[]): QuartileStats {
  if (values.length === 0) {
    return { q1: 0, median: 0, q3: 0, iqr: 0, lowerWhisker: 0, upperWhisker: 0, outliers: [] };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const median = calculateMedian(sorted);

  const lowerHalf = n % 2 === 0 ? sorted.slice(0, n / 2) : sorted.slice(0, Math.floor(n / 2));
  const upperHalf = n % 2 === 0 ? sorted.slice(n / 2) : sorted.slice(Math.floor(n / 2) + 1);

  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);
  const iqr = Number((q3 - q1).toFixed(2));

  // کران‌های Tukey برای نمودار جعبه‌ای
  const lowerThreshold = Number((q1 - 1.5 * iqr).toFixed(2));
  const upperThreshold = Number((q3 + 1.5 * iqr).toFixed(2));

  const regularPoints = sorted.filter((v) => v >= lowerThreshold && v <= upperThreshold);
  const outliers = sorted.filter((v) => v < lowerThreshold || v > upperThreshold);

  const lowerWhisker = regularPoints.length > 0 ? Math.min(...regularPoints) : q1;
  const upperWhisker = regularPoints.length > 0 ? Math.max(...regularPoints) : q3;

  return {
    q1,
    median,
    q3,
    iqr,
    lowerWhisker,
    upperWhisker,
    outliers,
  };
}

// ==========================================
// ۳. چولگی و کشیدگی (Skewness & Kurtosis)
// ==========================================

export function calculateDistributionShape(values: number[]): DistributionShape {
  const n = values.length;
  if (n < 3) {
    return {
      skewness: 0,
      kurtosis: 0,
      skewnessType: "SYMMETRIC",
      interpretation: "داده‌های کافی برای برازش توزیع موجود نیست.",
    };
  }

  const mean = calculateMean(values);
  const s = calculateStdDev(values, false);

  if (s === 0) {
    return {
      skewness: 0,
      kurtosis: 0,
      skewnessType: "SYMMETRIC",
      interpretation: "تمام نمرات کاملاً یکسان هستند.",
    };
  }

  // چولگی نمونه‌ای فیشر
  const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
  const skewness = Number((m3 / Math.pow(s, 3)).toFixed(2));

  // کشیدگی (Excess Kurtosis)
  const m4 = values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n;
  const kurtosis = Number((m4 / Math.pow(s, 4) - 3).toFixed(2));

  let skewnessType: "SYMMETRIC" | "RIGHT_SKEWED" | "LEFT_SKEWED" = "SYMMETRIC";
  let interpretation = "";

  if (skewness < -0.5) {
    skewnessType = "LEFT_SKEWED";
    interpretation =
      "توزیع با چولگی به چپ (منفی): تراکم نمرات در سمت نمرات بالا قرار دارد. آزمون موفق و عموم کلاس سطح تسلط بالایی را به نمایش گذاشته‌اند.";
  } else if (skewness > 0.5) {
    skewnessType = "RIGHT_SKEWED";
    interpretation =
      "توزیع با چولگی به راست (مثبت): تراکم نمرات در بازه نمرات پایین متمرکز است. آزمون دشوار بوده یا مفاهیم پایه نیازمند تدریس جبرانی هستند.";
  } else {
    skewnessType = "SYMMETRIC";
    interpretation =
      "توزیع متقارن و زنگوله‌ای: پراکندگی نمرات کاملاً نرمال و تفکیک آموزشی کلاس در وضعیت استاندارد قرار دارد.";
  }

  return {
    skewness,
    kurtosis,
    skewnessType,
    interpretation,
  };
}

// ==========================================
// ۴. نمرات استاندارد Z، T، تراز و رتبه صدکی
// ==========================================

export function calculateStandardScores(
  score: number,
  allScores: number[]
): StudentStandardScores {
  const sorted = [...allScores].sort((a, b) => b - a);
  const classRank = sorted.indexOf(score) + 1;
  const mean = calculateMean(allScores);
  const stdDev = calculateStdDev(allScores, true);

  // نمره Z
  const zScore = stdDev > 0 ? Number(((score - mean) / stdDev).toFixed(2)) : 0;

  // نمره T (میانگین ۵۰، انحراف معیار ۱۰)
  const tScore = Number((50 + 10 * zScore).toFixed(1));

  // تراز سازمان سنجش (میانگین ۵۵۰۰، انحراف معیار ۱۲۰۰)
  const taraz = Math.max(2500, Math.min(10500, Math.round(5500 + 1200 * zScore)));

  // رتبه صدکی (Percentile Rank)
  const strictlyBelow = allScores.filter((v) => v < score).length;
  const equalTo = allScores.filter((v) => v === score).length;
  const percentileRank = Number(
    (((strictlyBelow + 0.5 * equalTo) / allScores.length) * 100).toFixed(1)
  );

  // سطح وضعیت دانش‌آموز بر اساس Z-Score
  let status: StudentStandardScores["status"] = "AVERAGE";
  if (zScore >= 1.2) {
    status = "EXCELLENT";
  } else if (zScore >= 0.3) {
    status = "GOOD";
  } else if (zScore >= -0.8) {
    status = "AVERAGE";
  } else if (zScore >= -1.5) {
    status = "AT_RISK";
  } else {
    status = "CRITICAL";
  }

  return {
    rawScore: score,
    zScore,
    tScore,
    taraz,
    percentileRank,
    classRank,
    status,
  };
}

// ==========================================
// ۵. همبستگی ساعت مطالعه با نمره (Pearson Correlation)
// ==========================================

export function calculatePearsonCorrelation(
  studyHours: number[],
  grades: number[]
): CorrelationResult {
  const n = Math.min(studyHours.length, grades.length);
  if (n < 3) {
    return {
      r: 0,
      rSquared: 0,
      slope: 0,
      intercept: 0,
      strength: "WEAK",
      interpretation: "داده‌های هم‌زمان مطالعه و نمره کافی نیست.",
    };
  }

  const x = studyHours.slice(0, n);
  const y = grades.slice(0, n);

  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  const den = Math.sqrt(denX * denY);
  const r = den === 0 ? 0 : Number((num / den).toFixed(2));
  const rSquared = Number(Math.pow(r, 2).toFixed(2));

  // شیب خط رگرسیون y = a*x + b
  const slope = denX === 0 ? 0 : Number((num / denX).toFixed(2));
  const intercept = Number((meanY - slope * meanX).toFixed(2));

  let strength: CorrelationResult["strength"] = "WEAK";
  let interpretation = "";

  if (r >= 0.7) {
    strength = "STRONG_POSITIVE";
    interpretation = `همبستگی مثبت قوی (r = ${r}): افزایش ساعت مطالعه مستقیماً به نمرات بالاتر منجر می‌شود (بازدهی هر ۱ ساعت مطالعه: حدود ${slope} نمره رشد).`;
  } else if (r >= 0.35) {
    strength = "MODERATE_POSITIVE";
    interpretation = `همبستگی مثبت متوسط (r = ${r}): ساعات مطالعه بر نمره مؤثر است، اما کیفیت روش مطالعه و حل تمرین نقش مکمل پررنگی دارند.`;
  } else if (r >= 0) {
    strength = "WEAK";
    interpretation = `همبستگی ضعیف (r = ${r}): رابطه خطی معناداری بین ساعات ثبت‌شده و نمره دیده نمی‌شود. دانش‌آموزان به آموزش مدیریت زمان و اصلاح شیوه مطالعه نیاز دارند.`;
  } else {
    strength = "NEGATIVE";
    interpretation = `همبستگی معکوس غیرعادی (r = ${r}): ساعت مطالعه بالا به نمره بهتر ختم نشده که علامت اضطراب امتحان یا مطالعه سطحی است.`;
  }

  return {
    r,
    rSquared,
    slope,
    intercept,
    strength,
    interpretation,
  };
}

// ==========================================
// ۶. تحلیل سوال و پایایی (Item Analysis & Cronbach Alpha)
// ==========================================

export function calculateItemAnalysis(
  itemScores: number[], // 1 برای درست، 0 برای غلط
  totalStudentScores: number[]
): ItemAnalysisResult {
  const n = itemScores.length;
  if (n === 0) {
    return {
      difficultyIndex: 0,
      discriminationIndex: 0,
      evaluation: "HARD",
      discriminationQuality: "DEFECTIVE",
    };
  }

  // ضریب دشواری p
  const correctCount = itemScores.filter((s) => s > 0).length;
  const p = Number((correctCount / n).toFixed(2));

  // ضریب تمیز d بر اساس تفکیک ۲۷٪ بالا و ۲۷٪ پایین
  const sortedPairs = itemScores
    .map((itemScore, idx) => ({ itemScore, total: totalStudentScores[idx] || 0 }))
    .sort((a, b) => b.total - a.total);

  const groupSize = Math.max(1, Math.floor(n * 0.27));
  const upperGroup = sortedPairs.slice(0, groupSize);
  const lowerGroup = sortedPairs.slice(-groupSize);

  const pUpper = upperGroup.filter((p) => p.itemScore > 0).length / groupSize;
  const pLower = lowerGroup.filter((p) => p.itemScore > 0).length / groupSize;
  const d = Number((pUpper - pLower).toFixed(2));

  let evaluation: ItemAnalysisResult["evaluation"] = "IDEAL";
  if (p >= 0.85) evaluation = "VERY_EASY";
  else if (p >= 0.7) evaluation = "EASY";
  else if (p >= 0.3) evaluation = "IDEAL";
  else if (p >= 0.15) evaluation = "HARD";
  else evaluation = "VERY_HARD";

  let discriminationQuality: ItemAnalysisResult["discriminationQuality"] = "GOOD";
  if (d >= 0.4) discriminationQuality = "EXCELLENT";
  else if (d >= 0.3) discriminationQuality = "GOOD";
  else if (d >= 0.2) discriminationQuality = "ACCEPTABLE";
  else discriminationQuality = "DEFECTIVE";

  return {
    difficultyIndex: p,
    discriminationIndex: d,
    evaluation,
    discriminationQuality,
  };
}

export function calculateCronbachAlpha(itemsMatrix: number[][]): number {
  // itemsMatrix: هر سطر یک دانش‌آموز، هر ستون یک سوال
  const numStudents = itemsMatrix.length;
  if (numStudents <= 1) return 0;
  const numItems = itemsMatrix[0]?.length || 0;
  if (numItems <= 1) return 0;

  // واریانس هر سوال
  let sumItemVariances = 0;
  for (let j = 0; j < numItems; j++) {
    const colValues = itemsMatrix.map((row) => row[j] ?? 0);
    sumItemVariances += calculateVariance(colValues, true);
  }

  // نمرات کل هر دانش‌آموز و واریانس نمره کل
  const totalScores = itemsMatrix.map((row) => row.reduce((acc, v) => acc + (v ?? 0), 0));
  const totalVariance = calculateVariance(totalScores, true);

  if (totalVariance === 0) return 0;

  const alpha = (numItems / (numItems - 1)) * (1 - sumItemVariances / totalVariance);
  return Number(Math.max(0, Math.min(1, alpha)).toFixed(2));
}

// ==========================================
// ۷. تولید هیستوگرام و منحنی زنگوله‌ای برای Recharts
// ==========================================

export function generateBellCurveData(
  scores: number[],
  numBins: number = 6
): BellCurveBin[] {
  if (scores.length === 0) return [];

  const minScore = 0;
  const maxScore = 20;
  const binWidth = (maxScore - minScore) / numBins;
  const mean = calculateMean(scores);
  const stdDev = calculateStdDev(scores, true) || 1;

  const bins: BellCurveBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const bMin = Number((minScore + i * binWidth).toFixed(1));
    const bMax = Number((minScore + (i + 1) * binWidth).toFixed(1));
    const bMid = (bMin + bMax) / 2;

    const count = scores.filter((s) => {
      if (i === numBins - 1) return s >= bMin && s <= bMax;
      return s >= bMin && s < bMax;
    }).length;

    const percentage = Number(((count / scores.length) * 100).toFixed(1));

    // محاسبه تابع چگالی توزیع نرمال گاوسی: f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x - mu)/sigma)^2)
    const exponent = -0.5 * Math.pow((bMid - mean) / stdDev, 2);
    const gaussianDensity = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    // مقیاس‌گذاری برای هم‌پوشانی زیبا روی نمودار درصد
    const normalDensity = Number((gaussianDensity * binWidth * 100).toFixed(1));

    bins.push({
      binLabel: `${bMin} الی ${bMax}`,
      min: bMin,
      max: bMax,
      count,
      percentage,
      normalDensity,
    });
  }

  return bins;
}

// ==========================================
// ۸. تولید متن تحلیلی هوشمند وضعیت کلاس (Narrative Generator)
// ==========================================

export function generateClassNarrative(
  stats: DescriptiveStats,
  shape: DistributionShape,
  quartiles: QuartileStats,
  correlation: CorrelationResult
): string {
  const parts: string[] = [];

  // بررسی سطح میانگین
  if (stats.mean >= 17) {
    parts.push(
      `عملکرد کلی کلاس با میانگین ${stats.mean} از ۲۰ در سطح **بسیار ممتاز و بالاشاخه‌ای** ارزیابی می‌شود.`
    );
  } else if (stats.mean >= 14) {
    parts.push(
      `میانگین نمرات کلاس برابر ${stats.mean} از ۲۰ بوده و بیانگر سطح **مطلوب و قابل‌قبول** پیشرفت درسی است.`
    );
  } else {
    parts.push(
      `میانگین نمرات کلاس (${stats.mean} از ۲۰) پایین‌تر از حد بهینه ارزیابی شده و لزوم اجرای مداخلات آموزشی در این درس مشهود است.`
    );
  }

  // بررسی همگونی کلاس با CV
  if (stats.cv < 18) {
    parts.push(
      `ضریب تغییرات کلاس (${stats.cv}٪) نشان‌دهنده یک کلاس **بسیار یکدست و همگن** است که آموزش عمومی در آن با اثربخشی بالا پیش رفته است.`
    );
  } else if (stats.cv <= 30) {
    parts.push(
      `پراکندگی نمرات (انحراف معیار ${stats.stdDev} و ضریب تغییرات ${stats.cv}٪) گویای شکاف آموزشی متوسط بین گروه‌های کلاسی است.`
    );
  } else {
    parts.push(
      `ضریب تغییرات بحرانی (${stats.cv}٪) هشداردهنده **شکاف آموزشی عمیق** بین دانش‌آموزان صدرنشین و انتهای کلاس است و نیازمند گروه‌بندی تکالیف تفکیکی است.`
    );
  }

  // بررسی داده‌های پرت و چولگی
  if (quartiles.outliers.length > 0) {
    parts.push(
      `تعداد ${quartiles.outliers.length} دانش‌آموز با نمرات خارج از دامنه طبیعی شناسایی شدند که باید پرونده انضباطی یا وضعیت روحی آنان به مشاور ارجاع داده شود.`
    );
  }

  // جمع‌بندی همبستگی مطالعه
  parts.push(correlation.interpretation);

  return parts.join(" ");
}
