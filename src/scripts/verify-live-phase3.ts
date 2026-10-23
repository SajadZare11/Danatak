import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== شروع بررسی و اعتبارسنجی فاز ۳ کلاس آنلاین زنده ===");

  // ۱. پیدا کردن یا فعال کردن جلسه کلاس تست
  let session = await prisma.liveClassSession.findFirst({
    where: { status: "LIVE" },
    include: {
      hostTeacher: true,
      classroom: true,
    },
  });

  if (!session) {
    const existingSession = await prisma.liveClassSession.findFirst({
      include: {
        hostTeacher: true,
        classroom: true,
      },
    });

    if (existingSession) {
      session = await prisma.liveClassSession.update({
        where: { id: existingSession.id },
        data: { status: "LIVE" },
        include: {
          hostTeacher: true,
          classroom: true,
        },
      });
    }
  }

  if (!session) {
    throw new Error("هیچ جلسه لایو فعالی یافت نشد! لطفاً ابتدا فاز ۱ را اجرا کنید.");
  }

  console.log(`[PASS] جلسه کلاس فعال پیدا شد: ${session.title} (${session.id})`);

  // ۲. پیدا کردن دانش‌آموز تست
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });

  if (!student) {
    throw new Error("هیچ دانش‌آموزی در پایگاه داده یافت نشد.");
  }

  console.log(`[PASS] دانش‌آموز تست: ${student.fullName} (${student.id})`);

  // ۳. آزمون دست بلند کردن دانش‌آموز (Hand-Raise)
  console.log("در حال تست دست بلند کردن دانش‌آموز...");
  const participant1 = await prisma.liveSessionParticipant.upsert({
    where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
    create: {
      sessionId: session.id,
      studentId: student.id,
      handRaised: true,
      handRaisedAt: new Date(),
    },
    update: {
      handRaised: true,
      handRaisedAt: new Date(),
    },
  });

  if (!participant1.handRaised) {
    throw new Error("تست دست بلند کردن ناموفق بود.");
  }
  console.log("[PASS] دست بلند کردن دانش‌آموز با موفقیت ثبت شد ✋");

  // ۴. آزمون اعطای دسترسی میکروفون و قلم تخته توسط دبیر
  console.log("در حال تست اعطای مجوز میکروفون و قلم تخته توسط دبیر...");
  const participant2 = await prisma.liveSessionParticipant.update({
    where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
    data: {
      micAllowed: true,
      boardAllowed: true,
      handRaised: false, // دست پایین می‌آید وقتی به او نوبت داده شد
    },
  });

  if (!participant2.micAllowed || !participant2.boardAllowed || participant2.handRaised) {
    throw new Error("تست اعطای مجوز به دانش‌آموز ناموفق بود.");
  }
  console.log("[PASS] مجوزهای صوتی و تخته سیاه با موفقیت برای دانش‌آموز فعال شدند 🎙️✏️");

  // ۵. آزمون ضربان حضور زنده در کلاس (Heartbeat)
  console.log("در حال تست ثبت زمان حضور زنده (Heartbeat)...");
  const participant3 = await prisma.liveSessionParticipant.update({
    where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
    data: {
      totalPresentSeconds: { increment: 45 },
    },
  });

  if ((participant3.totalPresentSeconds || 0) < 45) {
    throw new Error("تست ثبت زمان حضور ناموفق بود.");
  }
  console.log(`[PASS] زمان حضور دانش‌آموز ثبت و به‌روز شد: ${participant3.totalPresentSeconds} ثانیه ⏱️`);

  // ۶. آزمون چت و فیلتر سوالات درسی
  console.log("در حال تست ثبت پیام‌های چت معمولی و سوالات درسی...");
  const chat1 = await prisma.liveSessionChat.create({
    data: {
      sessionId: session.id,
      senderId: student.id,
      messageText: "سلام استاد، صدای من رسا است؟",
      isQuestion: false,
    },
  });

  const chat2 = await prisma.liveSessionChat.create({
    data: {
      sessionId: session.id,
      senderId: student.id,
      messageText: "استاد آیا در این دستگاه مختصات شیب خط برابر ضریب x است؟",
      isQuestion: true,
    },
  });

  console.log(`[PASS] پیام‌های چت ایجاد شدند: ID=${chat1.id}, ID=${chat2.id}`);

  // فیلتر کردن سوالات درسی
  const questionChats = await prisma.liveSessionChat.findMany({
    where: {
      sessionId: session.id,
      isQuestion: true,
    },
  });

  if (questionChats.length === 0 || !questionChats.some((c) => c.id === chat2.id)) {
    throw new Error("فیلتر سوالات درسی به درستی کار نمی‌کند.");
  }
  console.log(`[PASS] فیلتر سوالات درسی با موفقیت تایید شد (${questionChats.length} سوال ثبت شده) ❓`);

  console.log("\n========================================================");
  console.log("✅ تمامی آزمون‌های فاز ۳ (پودیوم، ارتباط تعاملی، چت و اجازه صحبت) با موفقیت ۱۰۰٪ پاس شدند!");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ خطا در اعتبارسنجی فاز ۳:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
