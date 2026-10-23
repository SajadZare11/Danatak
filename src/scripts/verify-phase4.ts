import { PrismaClient } from "@prisma/client";
import { TelemetryAnalyticsService } from "../lib/study-studio/telemetryAnalytics";

const prisma = new PrismaClient();

async function verifyPhase4() {
  console.log("=======================================================================");
  console.log("  PHASE 4 VERIFICATION: ACTIVE FOCUS TRACKER & TELEMETRY INTEGRATION  ");
  console.log("=======================================================================\n");

  // 1. Locate Test Student & Test Pack
  console.log("--- 1. Locating Test Student and Study Pack ---");
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: {
      studentProfile: {
        include: {
          masteryRecords: {
            include: { topic: true },
          },
        },
      },
    },
  });

  if (!student) {
    throw new Error("دانش‌آموز تستی در دیتابیس یافت نشد!");
  }
  console.log(`✓ دانش‌آموز آزمایشی: ${student.fullName} (ID: ${student.id})`);

  const studyPack = await prisma.studyPack.findFirst();
  if (!studyPack) {
    throw new Error("بسته مطالعه آزمایشی یافت نشد!");
  }
  console.log(`✓ بسته مطالعه هدف: ${studyPack.title} (مبحث: ${studyPack.topicTag})`);

  // 2. Simulate Active Focus Tracker Heartbeat with Active & Idle Periods
  console.log("\n--- 2. Simulating Active Focus Tracker Heartbeats ---");
  
  // Heartbeat 1: High Focus Session (60s active, 5s idle)
  const log1 = await prisma.studyTelemetryLog.create({
    data: {
      studentId: student.id,
      studyPackId: studyPack.id,
      topicTag: studyPack.topicTag,
      eventType: "focus_heartbeat",
      activeDurationSeconds: 60,
      idleDurationSeconds: 5,
      metadataJson: JSON.stringify({
        source: "VerificationScript",
        mode: "active_interaction",
        pageHidden: false,
      }),
    },
  });
  console.log(`✓ لاگ دورسنجی اول ثبت شد: ۶۰ ثانیه فعال، ۵ ثانیه غیرفعال (ID: ${log1.id})`);

  // Heartbeat 2: Idle Detection / Page Hidden (5s active, 45s idle)
  const log2 = await prisma.studyTelemetryLog.create({
    data: {
      studentId: student.id,
      studyPackId: studyPack.id,
      topicTag: studyPack.topicTag,
      eventType: "idle_detected",
      activeDurationSeconds: 5,
      idleDurationSeconds: 45,
      metadataJson: JSON.stringify({
        source: "VerificationScript",
        mode: "tab_hidden_or_inactive",
        pageHidden: true,
      }),
    },
  });
  console.log(`✓ لاگ دورسنجی دوم (عدم تمرکز / خروج از برگه) ثبت شد: ۵ ثانیه فعال، ۴۵ ثانیه غیرفعال (ID: ${log2.id})`);

  // 3. Test Integration with Legacy Activity Tracking (StudyLog)
  console.log("\n--- 3. Testing Integration with Student Activity Log (StudyLog) ---");
  const mathSubject = await prisma.subject.findFirst({
    where: { code: "MATH-01" },
  });

  if (mathSubject) {
    const studyLogEntry = await prisma.studyLog.create({
      data: {
        studentId: student.id,
        subjectId: mathSubject.id,
        studyMinutes: 2,
        testCount: 0,
        note: `مطالعه فعال در استودیوی هوشمند: ${studyPack.topicTag}`,
      },
    });
    console.log(`✓ ورود موفق به سیستم ردیابی زمان مطالعه (StudyLog ID: ${studyLogEntry.id}, Minutes: ${studyLogEntry.studyMinutes})`);
  }

  // 4. Test Topic Mastery Updating via Telemetry
  console.log("\n--- 4. Testing Topic Mastery Radar Update ---");
  if (student.studentProfile && student.studentProfile.masteryRecords.length > 0) {
    const record = student.studentProfile.masteryRecords[0];
    const prevScore = record.masteryPercentage;
    const newScore = Math.min(95, prevScore + 1);

    const updated = await prisma.topicMastery.update({
      where: { id: record.id },
      data: {
        masteryPercentage: newScore,
        lastEvaluatedAt: new Date(),
      },
    });
    console.log(`✓ به‌روزرسانی رادار تسلط سرفصل (${record.topic.title}): ${prevScore}٪ -> ${updated.masteryPercentage}٪`);
  }

  // 5. Test Telemetry Analytics Service (Report, Heatmap & Struggling Alert)
  console.log("\n--- 5. Testing TelemetryAnalyticsService.getStudentReport ---");
  const report = await TelemetryAnalyticsService.getStudentReport(student.id);

  console.log(`✓ نام دانش‌آموز: ${report.studentName}`);
  console.log(`✓ کل دقایق مطالعه مفید: ${report.totalActiveMinutes} دقیقه (${report.totalActiveSeconds} ثانیه)`);
  console.log(`✓ کل زمان غیرفعال / پرتی: ${Math.round(report.totalIdleSeconds / 60)} دقیقه (${report.totalIdleSeconds} ثانیه)`);
  console.log(`✓ نرخ تمرکز خالص (Focus Ratio): ${report.focusRatio}٪`);
  console.log(`✓ تعداد کارت‌های SM-2 مرور شده: ${report.cardsReviewedCount} (لغزش/افت: ${report.totalCardLapses})`);
  console.log(`✓ تعداد کوییزها: ${report.quizAttemptsCount} (میانگین نمره: ${report.avgQuizPercentage}٪)`);
  console.log(`✓ وضعیت افت تحصیلی (isStruggling): ${report.isStruggling ? "⚠️ هشدار فعال" : "✅ مطلوب"}`);

  if (report.isStruggling) {
    console.log("  دلایل ثبت هشدار افت تحصیلی:");
    report.strugglingReasons.forEach((r, idx) => console.log(`   ${idx + 1}. ${r}`));
  }

  console.log(`✓ نقشه حرارتی مباحث (Topic Heatmap): ${report.topicHeatmap.length} سرفصل`);
  report.topicHeatmap.forEach((item) => {
    console.log(`   - [${item.status}] ${item.topicTag}: تسلط ${item.masteryPercentage}٪ | ${item.activeMinutes} دقیقه مطالعه`);
  });

  console.log(`✓ آخرین لاگ‌های دورسنجی: ${report.recentLogs.length} ردیف بازیابی شد`);

  // Verify assertions
  if (typeof report.focusRatio !== "number" || report.focusRatio < 0 || report.focusRatio > 100) {
    throw new Error("محاسبه نرخ تمرکز خارج از بازه استاندارد است!");
  }
  if (!Array.isArray(report.topicHeatmap) || report.topicHeatmap.length === 0) {
    throw new Error("نقشه حرارتی سرفصل‌ها خالی است!");
  }
  if (!Array.isArray(report.recentLogs)) {
    throw new Error("لیست لاگ‌های اخیر دریافت نشد!");
  }

  console.log("\n=======================================================================");
  console.log("  ✅ PHASE 4 VERIFICATION COMPLETED SUCCESSFULLY WITH 0 ERRORS!        ");
  console.log("=======================================================================\n");
}

verifyPhase4()
  .catch((err) => {
    console.error("❌ Phase 4 verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
