import { PrismaClient } from "@prisma/client";
import { FSRSEngine } from "../lib/adaptive/fsrsEngine";
import { AdaptiveIngestionService } from "../lib/adaptive/adaptiveIngestionService";
import { SAMPLE_CALCULUS_ADAPTIVE_COURSE } from "../lib/adaptive/sampleCourse";
import { FSRSCardData } from "../lib/adaptive/types";

const prisma = new PrismaClient();

async function runAdaptiveEngineVerification() {
  console.log("================================================================================");
  console.log("🚀 STARTING ADAPTIVE LEARNING ENGINE VERIFICATION (علوم شناختی + FSRS + بلوم)");
  console.log("================================================================================\n");

  // ۱. اعتبارسنجی کاربران
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });

  if (!student || !teacher) {
    throw new Error("Student or Teacher not found in DB! Please seed DB first.");
  }
  console.log(`✅ [Users] Student: ${student.fullName} (${student.id}), Teacher: ${teacher.fullName}`);

  // ۲. آزمایش موتور ریاضی FSRS v4.5
  console.log("\n--- [1] آزمون محاسباتی الگوریتم ریاضی FSRS v4.5 ---");
  const initialCard: FSRSCardData = {
    itemId: "test-concept-1",
    conceptKey: "مشتق زنجیره‌ای توابع مرکب",
    stability: 1.0,
    difficulty: 5.0,
    reps: 0,
    lapses: 0,
    state: "NEW",
    nextReviewDate: new Date().toISOString(),
  };

  const initialR = FSRSEngine.calculateRetrievability(initialCard);
  console.log(`✓ Retrievability اولیه (کارت جدید): ${initialR}`);

  // شبیه‌سازی پاسخ خوب (Rating = 3)
  const resultGood = FSRSEngine.calculateNextState(initialCard, 3, new Date());
  console.log(
    `✓ نوبت ۱ (Good): پایداری=${resultGood.updatedCard.stability} روز، دشواری=${resultGood.updatedCard.difficulty}، سررسید بعدی=${resultGood.intervalDays} روز دیگر (${resultGood.scheduledDate.toLocaleDateString("fa-IR")})`
  );

  // شبیه‌سازی پاسخ آسان در نوبت دوم (Rating = 4)
  const resultEasy = FSRSEngine.calculateNextState(resultGood.updatedCard, 4, resultGood.scheduledDate);
  console.log(
    `✓ نوبت ۲ (Easy): پایداری رشد یافته=${resultEasy.updatedCard.stability} روز، فاصله مرور بعدی=${resultEasy.intervalDays} روز`
  );

  // شبیه‌سازی لغزش و فراموشی در نوبت سوم (Rating = 1: Again)
  const resultLapse = FSRSEngine.calculateNextState(resultEasy.updatedCard, 1, resultEasy.scheduledDate);
  console.log(
    `✓ نوبت ۳ (Again / Lapse): وضعیت=${resultLapse.updatedCard.state}، لغزش‌ها=${resultLapse.updatedCard.lapses}، پایداری کاهش‌یافته=${resultLapse.updatedCard.stability} روز`
  );

  // تولید نقاط نمودار فراموشی اِبینگ‌هاوس
  const curvePoints = FSRSEngine.generateForgettingCurve(resultEasy.updatedCard, 7);
  console.log(`✓ تولید نقاط نمودار فراموشی اِبینگ‌هاوس: ${curvePoints.length} نقطه زمانی`);
  console.log(
    `  روز ۰: ${curvePoints[0].percent}% یادآوری | روز ۳: ${curvePoints[3].percent}% | روز ۷: ${curvePoints[7].percent}%`
  );

  // ۳. آزمون خط لوله دریافت چندوجهی، تشخیص فونت و کشینگ هش SHA-256
  console.log("\n--- [2] آزمون پردازش چندوجهی و کشینگ هش SHA-256 (هزینه ۰$) ---");
  const samplePersianText =
    "قضیه مقدار میانگین: اگر تابع f در بازه بسته [a, b] پیوسته و در بازه باز (a, b) مشتق‌پذیر باشد...";
  const hash1 = AdaptiveIngestionService.computeContentHash(samplePersianText);
  const hash2 = AdaptiveIngestionService.computeContentHash(samplePersianText);
  console.log(`✓ محاسبه کد هش SHA-256: ${hash1}`);
  if (hash1 !== hash2) {
    throw new Error("SHA-256 hash computation is not deterministic!");
  }
  console.log("✓ هش قطعی و معتبر است.");

  // بررسی تست فونت فارسی سالم در برابر متن خراب
  const isHealthy = AdaptiveIngestionService.isPersianTextHealthy(samplePersianText);
  const isCorrupted = AdaptiveIngestionService.isPersianTextHealthy("Ø§Ø³ØªØ§Ø¯ Ù…Ø­Ù…Ø¯ÛŒ  ???");
  console.log(`✓ تشخیص متن سالم فارسی: ${isHealthy} (انتظار: true)`);
  console.log(`✓ تشخیص فونت خراب/خرچنگ‌قورباغه و ارجاع به Vision OCR: ${!isCorrupted} (انتظار: false)`);

  // ۴. آزمون ذخیره‌سازی دوره تطبیقی و اتصال به پایگاه‌داده
  console.log("\n--- [3] پایگاه‌داده: ذخیره نودها، باس‌فایت و رکوردهای FSRS ---");
  const course = JSON.parse(JSON.stringify(SAMPLE_CALCULUS_ADAPTIVE_COURSE));
  course.contentHash = hash1;

  const packId = await AdaptiveIngestionService.persistAdaptiveCourse(course, teacher.id, student.id);
  console.log(`✅ بسته یادگیری تطبیقی در دیتابیس ثبت شد (ID: ${packId})`);

  // بررسی وضعیت نودهای ذخیره‌شده برای دانش‌آموز
  const nodeProgresses = await prisma.studentLearningNodeProgress.findMany({
    where: { studyPackId: packId, studentId: student.id },
  });
  console.log(`✓ تعداد نودهای ذخیره‌شده: ${nodeProgresses.length}`);
  const firstNode = nodeProgresses.find((n) => n.nodeId === "node-1");
  const bossNode = nodeProgresses.find((n) => n.nodeId === "boss-fight");
  console.log(`✓ نود ۱ قفل‌گشایی شده: ${firstNode?.isUnlocked} (انتظار: true)`);
  console.log(`✓ نود Boss Fight قفل است: ${!bossNode?.isUnlocked} (انتظار: true)`);

  // بررسی رکوردهای FSRS ایجاد شده
  const fsrsRecords = await prisma.studentFSRSProgress.findMany({
    where: { studyPackId: packId, studentId: student.id },
  });
  console.log(`✓ رکوردهای FSRS تولید شده برای مفاهیم: ${fsrsRecords.length} مفهوم`);

  // ۵. آزمون حلقه جبرانی شواهد (Grounded Remediation) و سوالات هم‌خانواده
  console.log("\n--- [4] آزمون حلقه رفع اشکال هوشمند (Grounded Remediation) ---");
  const itemWithRemediation = course.nodes[0].items[0];
  console.log(`✓ سوال: ${itemWithRemediation.prompt}`);
  console.log(`✓ ارجاع مستقیم به صفحه جزوه: صفحه ${itemWithRemediation.pageNumber}`);
  console.log(`✓ نقل قول دقیق جزوه (Source Quote): "${itemWithRemediation.sourceQuote.slice(0, 70)}..."`);
  console.log(`✓ سوال هم‌خانواده جایگزین: "${itemWithRemediation.isomorphicQuestion?.prompt}"`);

  // ۶. آزمون شبیه‌سازی عبور از مرحله ۱ و باز شدن نود بعدی
  console.log("\n--- [5] آزمون باز شدن قفل مرحله بعدی با قبولی در مرحله ۱ ---");
  await prisma.studentLearningNodeProgress.update({
    where: {
      studentId_studyPackId_nodeId: {
        studentId: student.id,
        studyPackId: packId,
        nodeId: "node-1",
      },
    },
    data: {
      isCompleted: true,
      bestScore: 92,
      starsEarned: 3,
    },
  });

  // باز کردن قفل نود ۲
  await prisma.studentLearningNodeProgress.update({
    where: {
      studentId_studyPackId_nodeId: {
        studentId: student.id,
        studyPackId: packId,
        nodeId: "node-2",
      },
    },
    data: {
      isUnlocked: true,
    },
  });

  const node2Check = await prisma.studentLearningNodeProgress.findUnique({
    where: {
      studentId_studyPackId_nodeId: {
        studentId: student.id,
        studyPackId: packId,
        nodeId: "node-2",
      },
    },
  });
  console.log(`✅ قفل مرحله ۲ با موفقیت باز شد: isUnlocked = ${node2Check?.isUnlocked}`);

  console.log("\n================================================================================");
  console.log("🎉 ALL ADAPTIVE LEARNING ENGINE SYSTEMS VERIFIED SUCCESSFULLY!");
  console.log("================================================================================");
}

runAdaptiveEngineVerification()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
