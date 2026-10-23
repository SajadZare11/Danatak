import { PrismaClient } from "@prisma/client";
import { AIStudyStudioService } from "../lib/study-studio/aiService";
import { SM2Engine } from "../lib/study-studio/sm2";
import { TelemetryAnalyticsService } from "../lib/study-studio/telemetryAnalytics";

const prisma = new PrismaClient();

async function verifyPhase5() {
  console.log("==========================================================================================");
  console.log("  PHASE 5 & FINAL CHECKPOINT: TEACHER ASSIGNMENT, STUDENT STUDY & TELEMETRY DASHBOARD   ");
  console.log("==========================================================================================\n");

  // -------------------------------------------------------------------------
  // گام ۱: ورود به عنوان معلم و تبدیل جزوه به بسته مطالعه (جزوه -> آزمون و فلش‌کارت)
  // -------------------------------------------------------------------------
  console.log("--- 1. Teacher Action: Generate Study Pack from Educational Notes ---");
  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
  });
  if (!teacher) throw new Error("معلم در دیتابیس یافت نشد!");
  console.log(`✓ ورود به عنوان دبیر: ${teacher.fullName} (ID: ${teacher.id})`);

  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });
  if (!student) throw new Error("دانش‌آموز در دیتابیس یافت نشد!");
  console.log(`✓ دانش‌آموز هدف: ${student.fullName} (ID: ${student.id})`);

  // جزوه خام جهت پردازش هوش مصنوعی
  const rawLectureNotes = `
  فصل چهارم: مشتق و کاربردها
  تعریف مشتق: مشتق تابع f در نقطه x0 برابر است با حد نسبت تغییرات تابع به تغییرات متغیر مستقل هنگامی که تغییرات به صفر میل می‌کند.
  شیب خط مماس: مقدار عددی مشتق تابع در هر نقطه، برابر است با شیب خط مماس بر منحنی در همان نقطه (m = f'(x0)).
  معادله خط مماس: y - y0 = f'(x0)(x - x0)
  قواعد مشتق‌گیری:
  ۱. مشتق عدد ثابت صفر است: (c)' = 0
  ۲. مشتق تابع توانی: (x^n)' = n * x^(n-1)
  ۳. مشتق حاصل ضرب: (u * v)' = u'v + uv'
  ۴. مشتق کسری: (u / v)' = (u'v - uv') / v^2
  اکسترمم‌های نسبی: اگر تابع در نقطه c دارای اکسترمم نسبی باشد و مشتق‌پذیر باشد، آنگاه f'(c) = 0 است (نقاط بحرانی).
  `;

  console.log("در حال پردازش جزوه و تولید بسته آموزشی کامل با هوش مصنوعی...");
  const generatedPack = await AIStudyStudioService.generateStudyPack(
    rawLectureNotes,
    "مشتق، خط مماس و نقاط بحرانی",
    "مشتق و کاربردها",
    12
  );

  // ذخیره بسته در دیتابیس
  const createdPack = await prisma.studyPack.create({
    data: {
      creatorId: teacher.id,
      title: generatedPack.title,
      description: generatedPack.summary.overview.slice(0, 200),
      topicTag: generatedPack.topicTag,
      gradeLevel: generatedPack.gradeLevel,
      summaryJson: JSON.stringify(generatedPack.summary),
      mindMapJson: JSON.stringify(generatedPack.mindMap),
      flashcards: {
        create: generatedPack.flashcards.map((f, idx) => ({
          front: f.front,
          back: f.back,
          hint: f.hint,
          topicTag: f.topicTag,
          difficulty: f.difficulty,
          orderIndex: idx + 1,
        })),
      },
      quizzes: {
        create: [
          {
            title: `آزمون تشخیصی مبحث ${generatedPack.topicTag}`,
            description: "سنجش درک مفهومی و توانایی حل مسئله",
            timeLimitMinutes: 20,
            questions: {
              create: generatedPack.quiz.questions.map((q, idx) => ({
                questionText: q.questionText,
                optionsJson: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                bloomLevel: q.bloomLevel,
                topicTag: q.topicTag,
                orderIndex: idx + 1,
              })),
            },
          },
        ],
      },
    },
    include: {
      flashcards: true,
      quizzes: {
        include: { questions: true },
      },
    },
  });

  console.log(`✓ بسته مطالعه هوشمند ساخته شد: "${createdPack.title}"`);
  console.log(`  - تعداد فلش‌کارت‌ها: ${createdPack.flashcards.length}`);
  console.log(`  - تعداد سوالات کوییز: ${createdPack.quizzes[0].questions.length}`);
  console.log(`  - گره‌های نقشه ذهنی: ${generatedPack.mindMap.nodes.length} مفهوم`);

  // -------------------------------------------------------------------------
  // گام ۲: تخصیص تکلیف توسط دبیر به دانش‌آموز با شرط تسلط و مهلت تحویل (MagicSchool)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Teacher Action: Assign Study Pack to Student ---");
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 5); // مهلت ۵ روز آینده
  const minMasteryScore = 80;

  const assignment = await prisma.studyPackAssignment.create({
    data: {
      studyPackId: createdPack.id,
      teacherId: teacher.id,
      studentId: student.id,
      dueDate,
      minMasteryScore,
      instructions: "لطفاً تا پیش از آزمون مستمر هفته آینده، به تسلط حداقل ۸۰٪ برسید.",
    },
  });

  console.log(`✓ تکلیف با موفقیت به ${student.fullName} ابلاغ شد:`);
  console.log(`  - شناسه تکلیف: ${assignment.id}`);
  console.log(`  - حداقل نمره قبولی الزامی: ${assignment.minMasteryScore}٪`);
  console.log(`  - مهلت تحویل: ${assignment.dueDate.toLocaleDateString("fa-IR")}`);

  // -------------------------------------------------------------------------
  // گام ۳: ورود دانش‌آموز، مطالعه فلش‌کارت‌ها با الگوریتم SM-2 و شرکت در آزمون
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Student Action: Study Cards with SM-2 & Take Diagnostic Quiz ---");

  // الف) مرور فلش‌کارت اول (پاسخ "خوب" - Rating 3)
  const card1 = createdPack.flashcards[0];
  const sm2Review1 = SM2Engine.calculate(
    { easinessFactor: 2.5, interval: 0, repetitions: 0, lapseCount: 0 },
    3
  );

  const cardProgress1 = await prisma.studentCardProgress.create({
    data: {
      studentId: student.id,
      flashcardId: card1.id,
      easinessFactor: sm2Review1.easinessFactor,
      interval: sm2Review1.interval,
      repetitions: sm2Review1.repetitions,
      nextReviewDate: sm2Review1.nextReviewDate,
      lastRating: 3,
      reviewCount: 1,
    },
  });
  console.log(`✓ فلش‌کارت ۱ مرور شد (پاسخ: خوب): فاصله بعدی ${sm2Review1.intervalDisplayFa} (${cardProgress1.nextReviewDate.toLocaleDateString("fa-IR")})`);

  // ب) مرور فلش‌کارت دوم (پاسخ "آسان" - Rating 4)
  const card2 = createdPack.flashcards[1];
  const sm2Review2 = SM2Engine.calculate(
    { easinessFactor: 2.5, interval: 0, repetitions: 0, lapseCount: 0 },
    4
  );

  const cardProgress2 = await prisma.studentCardProgress.create({
    data: {
      studentId: student.id,
      flashcardId: card2.id,
      easinessFactor: sm2Review2.easinessFactor,
      interval: sm2Review2.interval,
      repetitions: sm2Review2.repetitions,
      nextReviewDate: sm2Review2.nextReviewDate,
      lastRating: 4,
      reviewCount: 1,
    },
  });
  console.log(`✓ فلش‌کارت ۲ مرور شد (پاسخ: آسان): ضریب سهولت به ${sm2Review2.easinessFactor} ارتقا یافت.`);

  // ج) شرکت در کوییز تشخیصی با پاسخ‌دهی کامل و کسب نمره ۱۰۰٪ (بالاتر از شرط ۸۰٪)
  const quiz = createdPack.quizzes[0];
  const quizQuestions = quiz.questions;
  const userAnswers: Record<string, string> = {};
  quizQuestions.forEach((q) => {
    userAnswers[q.id] = q.correctAnswer; // پاسخ صحیح
  });

  const quizAttempt = await prisma.studyQuizAttempt.create({
    data: {
      studentId: student.id,
      quizId: quiz.id,
      score: quizQuestions.length,
      maxScore: quizQuestions.length,
      percentage: 100,
      answersJson: JSON.stringify(userAnswers),
    },
  });
  console.log(`✓ آزمون تشخیصی تکمیل شد: نمره ${quizAttempt.score} از ${quizAttempt.maxScore} (درصد: ${quizAttempt.percentage}٪)`);

  // د) ارسال ضربان دورسنجی تمرکز (Active Focus Heartbeat: 120 ثانیه مطالعه مفید، 10 ثانیه هرز)
  const telemetryHeartbeat = await prisma.studyTelemetryLog.create({
    data: {
      studentId: student.id,
      studyPackId: createdPack.id,
      topicTag: createdPack.topicTag,
      eventType: "quiz_attempt_completed",
      activeDurationSeconds: 120,
      idleDurationSeconds: 10,
      metadataJson: JSON.stringify({
        source: "VerificationScript",
        score: 100,
        focusRatio: 92,
      }),
    },
  });
  console.log(`✓ سیگنال دورسنجی زنده ثبت شد: ۱۲۰ ثانیه فعال، ۱۰ ثانیه غیرفعال (ID: ${telemetryHeartbeat.id})`);

  // -------------------------------------------------------------------------
  // گام ۴: مشاهده گزارش لحظه‌ای و داشبورد رصد فعالیت توسط معلم
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Teacher Verification: Real-Time Activity Tracking & Weakness Analytics ---");
  const teacherReport = await TelemetryAnalyticsService.getStudentReport(student.id);

  console.log(`✓ دانش‌آموز: ${teacherReport.studentName}`);
  console.log(`✓ کل دقایق مطالعه مفید: ${teacherReport.totalActiveMinutes} دقیقه`);
  console.log(`✓ نرخ تمرکز خالص (Focus Ratio): ${teacherReport.focusRatio}٪`);
  console.log(`✓ وضعیت هشدار افت تحصیلی (isStruggling): ${teacherReport.isStruggling ? "⚠️ هشدار فعال" : "✅ وضعیت مطلوب"}`);

  // ارزیابی وضعیت تکلیف در داشبورد معلم
  console.log(`✓ فهرست تکالیف استودیو دانش‌آموز (${teacherReport.assignments.length} تکلیف):`);
  const currentAssignmentReport = teacherReport.assignments.find((a) => a.id === assignment.id);
  if (!currentAssignmentReport) {
    throw new Error("تکلیف در گزارش دورسنجی معلم یافت نشد!");
  }

  console.log(`  - عنوان بسته: ${currentAssignmentReport.studyPackTitle}`);
  console.log(`  - حداقل نمره الزامی: ${currentAssignmentReport.minMasteryScore}٪`);
  console.log(`  - بالاترین نمره کسب‌شده: ${currentAssignmentReport.bestPercentage}٪`);
  console.log(`  - وضعیت قبولی در تکلیف: ${currentAssignmentReport.isCompleted ? "✅ قبولی و تکمیل شده" : "⏳ در حال انجام"}`);

  if (!currentAssignmentReport.isCompleted) {
    throw new Error("با وجود کسب نمره ۱۰۰٪، وضعیت تکلیف تکمیل نشده است!");
  }

  // نقشه حرارتی نقاط قوت و ضعف سرفصل‌ها
  console.log(`✓ نقشه حرارتی سرفصل‌ها (Topic Heatmap):`);
  teacherReport.topicHeatmap.forEach((item) => {
    console.log(`  - [${item.status}] مبحث: ${item.topicTag} | تسلط: ${item.masteryPercentage}٪ | زمان مطالعه: ${item.activeMinutes} دقیقه`);
  });

  // آخرین رویدادهای زنده
  console.log(`✓ لاگ‌های زنده رصد فعالیت معلم: ${teacherReport.recentLogs.length} ردیف در دسترس است.`);

  console.log("\n==========================================================================================");
  console.log("  ✅ FINAL CHECKPOINT VERIFIED: FULL END-TO-END CYCLE EXECUTED WITH ZERO ERRORS!        ");
  console.log("==========================================================================================\n");
}

verifyPhase5()
  .catch((err) => {
    console.error("❌ Phase 5 verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
