import { prisma } from "../lib/prisma";

async function seedDay6Data() {
  console.log("Seeding Day 6: Mistakes Notebook and Leitner Flashcards...");

  const student = await prisma.user.findFirst({
    where: { role: "STUDENT", nationalId: "0022334455" },
    include: { studentProfile: true },
  });

  if (!student) throw new Error("Student Ali Rezaei not found");

  const questions = await prisma.question.findMany({
    include: { options: true, topic: true },
    take: 5,
  });

  if (questions.length === 0) throw new Error("Questions not found");

  // 1. Seed Mistakes in StudentMistake table
  const reasons = [
    "عدم تسلط مفهومی",
    "بی‌دقتی محاسباتی",
    "کمبود زمان",
    "بدخوانی صورت سوال",
  ];

  for (let i = 0; i < Math.min(questions.length, 4); i++) {
    const q = questions[i];
    const wrongOpt = q.options.find((o) => !o.isCorrect);

    await prisma.studentMistake.upsert({
      where: {
        studentId_questionId: {
          studentId: student.id,
          questionId: q.id,
        },
      },
      update: {
        errorReason: reasons[i % reasons.length],
        selectedOpt: wrongOpt ? wrongOpt.id : "2",
        isResolved: i === 3, // چهارمی به صورت پیش‌فرض رفع نقص شده
        notes: i === 1 ? "در علامت منفی صورت کسر دقت نکردم" : null,
      },
      create: {
        studentId: student.id,
        questionId: q.id,
        source: "ASSIGNMENT",
        selectedOpt: wrongOpt ? wrongOpt.id : "2",
        errorReason: reasons[i % reasons.length],
        isResolved: i === 3,
        notes: i === 1 ? "در علامت منفی صورت کسر دقت نکردم" : null,
      },
    });
  }
  console.log("✓ Seeded sample mistakes in StudentMistake table.");

  // 2. Seed Leitner Cards across the 5 boxes
  const leitnerCardsData = [
    {
      boxLevel: 1,
      front: "فرمول مشتق تابع کسری چیست؟ $\\left(\\frac{u}{v}\\right)'$",
      back: "$\\frac{u'v - v'u}{v^2}$ (مشتق صورت در مخرج منهای مشتق مخرج در صورت بر توان دوم مخرج)",
    },
    {
      boxLevel: 2,
      front: "قاعده زنجیره‌ای در مشتق ترکیب توابع: $(f(g(x)))'$",
      back: "$g'(x) \\cdot f'(g(x))$ (ابتدا مشتق داخل پرانتز ضربدر مشتق تابع بیرونی)",
    },
    {
      boxLevel: 3,
      front: "حد مبهم صفر صفرم مثلثاتی: $\\lim_{x \\to 0} \\frac{\\sin ax}{bx}$",
      back: "برابر با $\\frac{a}{b}$ است، مشروط بر اینکه کمان به سمت صفر میل کند.",
    },
    {
      boxLevel: 4,
      front: "مشتق توابع رادیکالی با فرجه ۲: $(\\sqrt{u})'$",
      back: "$\\frac{u'}{2\\sqrt{u}}$ (مشتق زیر رادیکال تقسیم بر دو برابر خود رادیکال)",
    },
    {
      boxLevel: 5,
      front: "تعریف اصلی مشتق بر حسب حد (نیوتون): $f'(a)$",
      back: "$f'(a) = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x - a} = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$",
    },
  ];

  for (const c of leitnerCardsData) {
    const existing = await prisma.leitnerCard.findFirst({
      where: {
        studentId: student.id,
        frontContent: c.front,
      },
    });

    if (!existing) {
      await prisma.leitnerCard.create({
        data: {
          studentId: student.id,
          frontContent: c.front,
          backContent: c.back,
          boxLevel: c.boxLevel,
          topicId: questions[0]?.topicId || null,
          questionId: questions[0]?.id || null,
          nextReviewAt: new Date(),
          reviewCount: c.boxLevel * 2,
          successCount: c.boxLevel,
        },
      });
    }
  }
  console.log("✓ Seeded 5-box Leitner Cards successfully.");
}

seedDay6Data()
  .catch((e) => {
    console.error("Day 6 seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
