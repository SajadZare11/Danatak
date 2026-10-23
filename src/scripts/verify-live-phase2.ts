import { PrismaClient } from "@prisma/client";
import katex from "katex";

const prisma = new PrismaClient();

async function verifyLivePhase2() {
  console.log("==========================================================================================");
  console.log("  LIVE VIRTUAL CLASSROOM - PHASE 2 VERIFICATION: INTERACTIVE WHITEBOARD & KATEX MATH    ");
  console.log("==========================================================================================\n");

  // ۱. اعتبارسنجی موتور رندرینگ ریاضی KaTeX
  console.log("--- 1. Testing KaTeX Mathematical Formula Parsing Engine ---");
  const testEquations = [
    "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    "\\int_{a}^{b} x^2 \\, dx = \\frac{b^3 - a^3}{3}",
    "\\vec{F} = m \\cdot \\vec{a}",
    "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  ];

  for (const eq of testEquations) {
    const rendered = katex.renderToString(eq, { displayMode: true, throwOnError: true });
    if (!rendered.includes("katex-html")) {
      throw new Error(`خطا در رندر فرمول لاتک: ${eq}`);
    }
    console.log(`✓ فرمول KaTeX با موفقیت رندر شد: "${eq.slice(0, 35)}..."`);
  }

  // ۲. ساختار اسلایدها و ابزارهای هندسی تخته‌سیاه (Whiteboard Slides & Elements)
  console.log("\n--- 2. Testing Multi-Slide Deck & Geometric Elements ---");
  const slideDeckData = {
    version: "1.0",
    totalSlides: 3,
    activeSlideIndex: 0,
    slides: [
      {
        id: "slide-1",
        name: "اسلاید ۱: تعریف مشتق و خط مماس",
        elements: [
          {
            id: "elem-1",
            type: "stroke",
            tool: "pen",
            color: "#facc15", // زرد نئونی
            width: 3,
            points: [
              { x: 50, y: 100 },
              { x: 120, y: 150 },
              { x: 200, y: 110 },
            ],
          },
          {
            id: "elem-2",
            type: "coords",
            tool: "coords",
            color: "#38bdf8", // آبی
            width: 2,
            x1: 50,
            y1: 50,
            x2: 350,
            y2: 350,
          },
        ],
        katexElements: [
          {
            id: "k-1",
            latex: "m = f'(x_0) = \\tan(\\alpha)",
            x: 80,
            y: 80,
          },
        ],
      },
      {
        id: "slide-2",
        name: "اسلاید ۲: حل تست کنکور سراسری",
        elements: [
          {
            id: "elem-3",
            type: "rect",
            tool: "rect",
            color: "#ffffff",
            width: 2,
            x1: 40,
            y1: 40,
            x2: 400,
            y2: 250,
          },
          {
            id: "elem-4",
            type: "text",
            tool: "text",
            color: "#4ade80",
            width: 4,
            x1: 60,
            y1: 80,
            text: "نکته تستی: اگر f'(x) = 0 باشد، تابع در آن نقطه مماس افقی دارد.",
          },
        ],
        katexElements: [
          {
            id: "k-2",
            latex: "f(x) = x^3 - 3x \\implies f'(x) = 3x^2 - 3 = 0",
            x: 60,
            y: 140,
          },
        ],
      },
    ],
  };

  const serializedSnapshot = JSON.stringify(slideDeckData);
  console.log(`✓ دک اسلایدهای تخته ایجاد و سریالایز شد (${serializedSnapshot.length} بایت متادیتا)`);
  console.log(`  - تعداد اسلایدها: ${slideDeckData.slides.length}`);
  console.log(`  - تعداد کل المان‌های ترسیمی: ${slideDeckData.slides.reduce((acc, s) => acc + s.elements.length, 0)} المان`);
  console.log(`  - فرمول‌های KaTeX الحاقی: ${slideDeckData.slides.reduce((acc, s) => acc + s.katexElements.length, 0)} کارت فرمول`);

  // ۳. شبیه‌سازی ذخیره اسنپ‌شات تخته‌سیاه در پایگاه‌داده
  console.log("\n--- 3. Testing Whiteboard Snapshot DB Persistence ---");
  const testSession = await prisma.liveClassSession.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!testSession) {
    throw new Error("جلسه تستی در پایگاه داده یافت نشد!");
  }

  const updatedSession = await prisma.liveClassSession.update({
    where: { id: testSession.id },
    data: {
      whiteboardSnapshotJson: serializedSnapshot,
    },
  });

  if (!updatedSession.whiteboardSnapshotJson) {
    throw new Error("اسنپ‌شات تخته‌سیاه با موفقیت ذخیره نشد!");
  }

  const parsedBack = JSON.parse(updatedSession.whiteboardSnapshotJson);
  if (parsedBack.slides.length !== 2) {
    throw new Error("تعداد اسلایدها در بازخوانی تطابق ندارد!");
  }

  console.log(`✓ اسنپ‌شات تخته با موفقیت در جلسه "${updatedSession.title}" ذخیره شد.`);
  console.log(`✓ بازخوانی و پارس مجدد JSON با موفقیت تأیید شد.`);

  console.log("\n==========================================================================================");
  console.log("  ✅ PHASE 2 VERIFICATION COMPLETED WITH 100% SUCCESS (0 ERRORS)!                         ");
  console.log("==========================================================================================\n");
}

verifyLivePhase2()
  .catch((err) => {
    console.error("❌ Phase 2 verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
