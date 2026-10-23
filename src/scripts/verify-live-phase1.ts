import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyLivePhase1() {
  console.log("==========================================================================================");
  console.log("  LIVE VIRTUAL CLASSROOM - PHASE 1 VERIFICATION: MODELS, SESSIONS & PARTICIPANTS        ");
  console.log("==========================================================================================\n");

  // ۱. شناسایی دبیر و دانش‌آموز آزمایشی
  console.log("--- 1. Locating Host Teacher and Test Student ---");
  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
  });
  if (!teacher) throw new Error("دبیر در پایگاه‌داده یافت نشد!");
  console.log(`✓ دبیر میزبان: ${teacher.fullName} (ID: ${teacher.id})`);

  const classroom = await prisma.classroom.findFirst();
  if (!classroom) throw new Error("کلاس درسی در پایگاه‌داده یافت نشد!");
  console.log(`✓ کلاس درس: ${classroom.name} (ID: ${classroom.id})`);

  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });
  if (!student) throw new Error("دانش‌آموز در پایگاه‌داده یافت نشد!");
  console.log(`✓ دانش‌آموز شرکت‌کننده: ${student.fullName} (ID: ${student.id})`);

  // ۲. ایجاد یک جلسه کلاس آنلاین زنده (Instant Live Session)
  console.log("\n--- 2. Creating Instant Live Class Session ---");
  const session = await prisma.liveClassSession.create({
    data: {
      classroomId: classroom.id,
      hostTeacherId: teacher.id,
      title: "تدریس آنلاین و حل مسئله حسابان: مشتق مراتب بالاتر",
      subjectTitle: "حسابان و ریاضی ۳",
      status: "LIVE",
      actualStartTime: new Date(),
    },
    include: {
      hostTeacher: true,
      classroom: true,
    },
  });

  console.log(`✓ جلسه زنده ایجاد شد: "${session.title}" (ID: ${session.id})`);
  console.log(`  - وضعیت: ${session.status}`);
  console.log(`  - دبیر: ${session.hostTeacher.fullName}`);
  console.log(`  - کلاس: ${session.classroom.name}`);
  console.log(`  - زمان آغاز: ${session.actualStartTime?.toLocaleTimeString("fa-IR")}`);

  // ۳. ورود دانش‌آموز به اتاق و ثبت در شرکت‌کنندگان (Participant Entry)
  console.log("\n--- 3. Student Entering Live Classroom ---");
  const participant = await prisma.liveSessionParticipant.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      joinedAt: new Date(),
      totalPresentSeconds: 300, // شبیه‌سازی ۵ دقیقه حضور اولیه
      handRaised: true,
      handRaisedAt: new Date(),
      micAllowed: false,
      boardAllowed: false,
      attendanceStatus: "PRESENT",
    },
    include: {
      student: true,
    },
  });

  console.log(`✓ دانش‌آموز وارد کلاس شد: ${participant.student.fullName}`);
  console.log(`  - وضعیت دست بلند کردن: ${participant.handRaised ? "✋ دست بالا برای سوال" : "دست پایین"}`);
  console.log(`  - ثانیه‌های حضور: ${participant.totalPresentSeconds} ثانیه`);

  // ۴. ارسال پیام در چت زنده کلاسی
  console.log("\n--- 4. Live Chat Message Exchange ---");
  const chatMsg = await prisma.liveSessionChat.create({
    data: {
      sessionId: session.id,
      senderId: student.id,
      messageText: "استاد سلام، آیا فرمول مشتق زنجیره‌ای در امتحان نهایی فردا بارم دارد؟",
      isTeacher: false,
      isQuestion: true,
    },
  });
  console.log(`✓ پیام چت ثبت شد: "${chatMsg.messageText}" (سوال درسی: ${chatMsg.isQuestion ? "بله" : "خیر"})`);

  // ۵. ایجاد کوئیز زنده کلاسی (Live Quiz)
  console.log("\n--- 5. In-Class Live Quiz Creation ---");
  const liveQuiz = await prisma.liveSessionQuiz.create({
    data: {
      sessionId: session.id,
      questionText: "مشتق دوم تابع f(x) = x^3 - 3x در نقطه x = 2 کدام است؟",
      optionsJson: JSON.stringify(["۶", "۱۲", "۰", "۳"]),
      correctAnswer: "2",
      explanation: "f'(x) = 3x^2 - 3 => f''(x) = 6x => f''(2) = 12",
      timeLimitSeconds: 60,
      status: "ACTIVE",
      responsesJson: JSON.stringify({ "1": 2, "2": 18, "3": 1, "4": 0 }),
    },
  });
  console.log(`✓ کوییز زنده پرتاب شد: "${liveQuiz.questionText}"`);
  console.log(`  - گزینه صحیح: ${liveQuiz.correctAnswer}`);
  console.log(`  - آمار پاسخ‌ها: ${liveQuiz.responsesJson}`);

  // ۶. استعلام کامل جلسه با تمامی وابستگی‌ها
  console.log("\n--- 6. Querying Full Live Session with Relations ---");
  const fullSession = await prisma.liveClassSession.findUnique({
    where: { id: session.id },
    include: {
      participants: { include: { student: true } },
      chats: true,
      quizzes: true,
    },
  });

  if (!fullSession) throw new Error("بازیابی جلسه با شکست مواجه شد!");
  if (fullSession.participants.length !== 1) throw new Error("تعداد شرکت‌کنندگان ناهماهنگ است!");
  if (fullSession.chats.length !== 1) throw new Error("تعداد چت‌ها ناهماهنگ است!");
  if (fullSession.quizzes.length !== 1) throw new Error("تعداد کوییزها ناهماهنگ است!");

  console.log(`✓ جلسه با موفقیت بازخوانی شد:`);
  console.log(`  - تعداد شرکت‌کنندگان: ${fullSession.participants.length}`);
  console.log(`  - تعداد پیام‌های چت: ${fullSession.chats.length}`);
  console.log(`  - تعداد کوییزها: ${fullSession.quizzes.length}`);

  // ۷. پایان کلاس (Ending Live Session)
  console.log("\n--- 7. Ending Live Session ---");
  const endedSession = await prisma.liveClassSession.update({
    where: { id: session.id },
    data: {
      status: "ENDED",
      actualEndTime: new Date(),
      whiteboardSnapshotJson: JSON.stringify({ slidesCount: 3, notesCount: 14 }),
    },
  });
  console.log(`✓ وضعیت جلسه به پایان تغییر یافت: ${endedSession.status}`);
  console.log(`  - زمان پایان: ${endedSession.actualEndTime?.toLocaleTimeString("fa-IR")}`);

  console.log("\n==========================================================================================");
  console.log("  ✅ PHASE 1 VERIFICATION COMPLETED WITH 100% SUCCESS (0 ERRORS)!                         ");
  console.log("==========================================================================================\n");
}

verifyLivePhase1()
  .catch((err) => {
    console.error("❌ Phase 1 verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
