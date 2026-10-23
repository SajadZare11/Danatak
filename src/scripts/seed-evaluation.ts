import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Teacher 360 Evaluation seeding for Danatak...");

  // ۱. خلاصه‌های تجمیعی دبیران
  const summaries = [
    {
      teacherId: "teacher-demo",
      teacherName: "استاد احسان محمدی",
      subjectName: "حسابان ۲ و ریاضی پایه",
      totalEvaluations: 48,
      studentSatisfaction: 95.8,
      parentSatisfaction: 93.4,
      overallScore: 94.6,
      radarMastery: 4.9,
      radarFairness: 4.7,
      radarEthics: 4.9,
      radarDiscipline: 4.8,
      radarInspiration: 4.8,
      radarEngagement: 4.6,
      aiSummaryStrengths: "تسلط استثنایی بر هندسه تحلیلی و فرمول‌های مشتق، صبوری در پاسخگویی به ابهامات دانش‌آموزان ضعیف، و قلم‌گذاری شفاف روی تکالیف.",
      aiSummaryImprovements: "پیشنهاد ارسال گزارش کتبی ماهانه بیشتر به اولیا در مورد تکالیف جبرانی.",
    },
    {
      teacherId: "teacher-physics",
      teacherName: "استاد رضا کمالی",
      subjectName: "فیزیک ۳ (الکتریسیته و مغناطیس)",
      totalEvaluations: 42,
      studentSatisfaction: 90.2,
      parentSatisfaction: 88.2,
      overallScore: 89.2,
      radarMastery: 4.7,
      radarFairness: 4.4,
      radarEthics: 4.6,
      radarDiscipline: 4.6,
      radarInspiration: 4.5,
      radarEngagement: 4.2,
      aiSummaryStrengths: "آزمایش‌های عملی جذاب در آزمایشگاه فیزیک، حل تست‌های دشوار کنکور با روش‌های مفهومی.",
      aiSummaryImprovements: "تعدیل سطح دشواری کوییزهای کلاسی و بارم‌بندی منعطف‌تر برای دانش‌آموزان متوسط.",
    },
    {
      teacherId: "teacher-chemistry",
      teacherName: "دکتر سهراب علیزاده",
      subjectName: "شیمی ۳ و ترکیبات کربن",
      totalEvaluations: 45,
      studentSatisfaction: 93.0,
      parentSatisfaction: 91.0,
      overallScore: 92.0,
      radarMastery: 4.8,
      radarFairness: 4.6,
      radarEthics: 4.8,
      radarDiscipline: 4.7,
      radarInspiration: 4.6,
      radarEngagement: 4.5,
      aiSummaryStrengths: "جزوات تایپ‌شده رنگی بسیار منظم، طبقه‌بندی تست‌های استوکیومتری، اخلاق بسیار محترمانه.",
      aiSummaryImprovements: "اختصاص زمان بیشتر به حل مسائل استوکیومتری در زنگ‌های جبرانی.",
    },
    {
      teacherId: "teacher-geometry",
      teacherName: "مهندس نیما صادقی",
      subjectName: "هندسه ۳ و مقاطع مخروطی",
      totalEvaluations: 38,
      studentSatisfaction: 87.5,
      parentSatisfaction: 85.5,
      overallScore: 86.5,
      radarMastery: 4.6,
      radarFairness: 4.3,
      radarEthics: 4.5,
      radarDiscipline: 4.4,
      radarInspiration: 4.3,
      radarEngagement: 4.1,
      aiSummaryStrengths: "رسم سه‌بعدی بی‌نقص اشکال هندسی، تسلط بالا بر مباحث ماتریس و بردار.",
      aiSummaryImprovements: "سرعت تدریس کمی بالاست و نیاز به مرور بیشتر تمرین‌های کتاب درسی دارد.",
    },
  ];

  for (const s of summaries) {
    await prisma.teacherEvaluationSummary.upsert({
      where: { teacherId: s.teacherId },
      update: s,
      create: s,
    });
  }

  // ۲. رکوردهای نظرسنجی فردی (ناشناس)
  const records = [
    {
      id: "eval-01",
      teacherId: "teacher-demo",
      teacherName: "استاد احسان محمدی",
      subjectName: "حسابان ۲",
      evaluatorRole: "STUDENT",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      academicMastery: 5.0,
      gradingFairness: 4.8,
      professionalEthics: 5.0,
      classroomDiscipline: 4.9,
      inspiration: 5.0,
      parentEngagement: 4.6,
      overallScore: 98.0,
      strengthsText: "تدریس استاد محمدی بی‌نظیر است. مفاهیم سخت مشتق را با مثال‌های شهودی به سادگی تفهیم می‌کنند.",
      improvementSuggestions: "اگر تست‌های تالیفی بیشتری در جزوه قرار گیرد فوق‌العاده خواهد بود.",
    },
    {
      id: "eval-02",
      teacherId: "teacher-demo",
      teacherName: "استاد احسان محمدی",
      subjectName: "حسابان ۲",
      evaluatorRole: "PARENT",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      academicMastery: 4.9,
      gradingFairness: 4.7,
      professionalEthics: 5.0,
      classroomDiscipline: 4.8,
      inspiration: 4.8,
      parentEngagement: 4.8,
      overallScore: 96.0,
      strengthsText: "فرزندم بعد از کلاس‌های ایشان جهش چشمگیری در تراز آزمون سنجش پیدا کرده است. از زحمات ایشان سپاسگزاریم.",
      improvementSuggestions: "اطلاع‌رسانی تاریخ آزمون‌های مستمر حداقل از ۴ روز قبل انجام شود.",
    },
    {
      id: "eval-03",
      teacherId: "teacher-physics",
      teacherName: "استاد رضا کمالی",
      subjectName: "فیزیک ۳",
      evaluatorRole: "STUDENT",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      academicMastery: 4.8,
      gradingFairness: 4.2,
      professionalEthics: 4.5,
      classroomDiscipline: 4.7,
      inspiration: 4.6,
      parentEngagement: 4.0,
      overallScore: 89.0,
      strengthsText: "آزمایش‌های مغناطیس در کلاس فوق‌العاده بود و باعث درک عمیق قانون لنز شد.",
      improvementSuggestions: "امتحانات مستمر بارم‌بندی بسیار سختی دارند و نیاز به تخفیف در نمرات است.",
    },
    {
      id: "eval-04",
      teacherId: "teacher-chemistry",
      teacherName: "دکتر سهراب علیزاده",
      subjectName: "شیمی ۳",
      evaluatorRole: "PARENT",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      academicMastery: 5.0,
      gradingFairness: 4.7,
      professionalEthics: 4.9,
      classroomDiscipline: 4.8,
      inspiration: 4.7,
      parentEngagement: 4.6,
      overallScore: 94.0,
      strengthsText: "نظم دبیر و نحوه تحویل کارنامه کلاسی بسیار حرفه‌ای و شایسته تقدیر است.",
      improvementSuggestions: "معرفی کتب کمک‌آموزشی سطح یک برای داوطلبان المپیاد.",
    },
  ];

  for (const r of records) {
    await prisma.teacherEvaluationRecord.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  console.log("✅ Teacher 360 Evaluation seeded: 4 Summaries, 4 Individual Anonymous Records.");
}

main()
  .catch((e) => {
    console.error("❌ Evaluation Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
