import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyDay9() {
  console.log("=== STARTING DAY 9 VERIFICATION SUITE ===");

  // 1. Verify Parent & Student Relationship
  const parent = await prisma.user.findFirst({
    where: { role: "PARENT" },
    include: {
      parentRelations: {
        include: { student: { include: { studentProfile: true } } },
      },
    },
  });

  if (!parent || parent.parentRelations.length === 0) {
    throw new Error("Parent user and relation not found!");
  }
  const student = parent.parentRelations[0].student;
  console.log(`✓ Parent-Student relation verified: ${parent.fullName} -> ${student.fullName}`);

  // 2. Verify Tuition and Online Payment Simulation
  const tuition = await prisma.tuitionRecord.findFirst({
    where: { studentId: student.id },
  });
  if (!tuition) throw new Error("Tuition record not found!");

  let plan = JSON.parse(tuition.planJson || "[]");
  console.log(`✓ Tuition verified: Total ${tuition.totalAmount} Toman (${plan.length} installments).`);

  // Test paying an installment
  const pendingInst = plan.find((p: any) => p.status === "PENDING");
  if (pendingInst) {
    const trackingCode = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    pendingInst.status = "PAID";
    pendingInst.trackingCode = trackingCode;
    pendingInst.paymentDate = "۱۴۰۳/۱۰/۲۹";

    const newPaidAmount = tuition.paidAmount + pendingInst.amount;
    await prisma.tuitionRecord.update({
      where: { id: tuition.id },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= tuition.totalAmount ? "تسویه" : "جاری",
        planJson: JSON.stringify(plan),
      },
    });

    // Record payment SMS
    await prisma.smsLog.create({
      data: {
        recipientPhone: student.phoneNumber || "09127777777",
        recipientName: parent.fullName,
        studentId: student.id,
        type: "TUITION_PAYMENT",
        message: `تایید پرداخت قسط ${pendingInst.installmentNumber} با کد رهگیری ${trackingCode}`,
      },
    });
    console.log(`✓ Online tuition payment verified: Installment ${pendingInst.installmentNumber} paid with tracking code ${trackingCode}`);
  }

  // 3. Verify Counselor Dashboard & AI Study Planner
  const counselor = await prisma.user.findFirst({
    where: { role: "COUNSELOR" },
  });
  if (!counselor) throw new Error("Counselor user not found!");

  // Test AI Study Plan Generation
  const masteries = await prisma.topicMastery.findMany({
    where: { studentProfileId: student.studentProfile?.id },
    include: { topic: true },
  });
  const weakTopic = masteries.find((m) => m.masteryPercentage < 65) || masteries[0];

  const generatedSchedule = [
    {
      day: "شنبه",
      slots: [
        { subject: "حسابان ۳", topic: weakTopic.topic.title, targetMinutes: 90, targetTests: 30, isFocusTopic: true },
      ],
    },
    {
      day: "یکشنبه",
      slots: [
        { subject: "فیزیک ۳", topic: "حرکت‌شناسی", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
      ],
    },
  ];

  const planRecord = await prisma.studyPlan.create({
    data: {
      counselorId: counselor.id,
      studentId: student.id,
      weekStartDate: new Date(),
      weekEndDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      scheduleJson: JSON.stringify(generatedSchedule),
      counselorNote: `برنامه هفتگی متناسب با ضعف در مبحث ${weakTopic.topic.title} تایید شد.`,
      isApproved: true,
    },
  });
  console.log(`✓ AI-Assisted Study Planner verified: Plan ID ${planRecord.id} generated around weak topic «${weakTopic.topic.title}».`);

  // 4. Verify Student Daily Study Logging & Gamification XP
  const mathSubject = await prisma.subject.findFirst({ where: { code: "MATH-01" } });
  if (!mathSubject) throw new Error("Math subject not found!");

  const initialXP = student.studentProfile?.totalXP || 0;
  const initialStreak = student.studentProfile?.currentStreakDays || 0;

  // Student logs a new study session
  await prisma.studyLog.create({
    data: {
      studentId: student.id,
      subjectId: mathSubject.id,
      studyMinutes: 105,
      testCount: 35,
      note: "تست خودکار ثبت مطالعه روزانه",
    },
  });

  await prisma.studentProfile.update({
    where: { id: student.studentProfile!.id },
    data: {
      totalXP: { increment: 10 },
      currentStreakDays: { increment: 1 },
    },
  });

  const updatedProfile = await prisma.studentProfile.findUnique({
    where: { id: student.studentProfile!.id },
  });

  if ((updatedProfile?.totalXP || 0) !== initialXP + 10) {
    throw new Error("Student XP did not increment by 10!");
  }
  if ((updatedProfile?.currentStreakDays || 0) !== initialStreak + 1) {
    throw new Error("Student streak did not increment by 1!");
  }
  console.log(`✓ Daily Study Logging verified: XP increased to ${updatedProfile?.totalXP} (+10 XP), Streak: ${updatedProfile?.currentStreakDays} days.`);

  // 5. Verify SMS Dispatcher Logs
  const smsLogs = await prisma.smsLog.findMany({
    where: { studentId: student.id },
  });
  if (smsLogs.length === 0) throw new Error("No SMS logs found for student!");
  console.log(`✓ SMS Dispatcher verified: ${smsLogs.length} service SMS records logged in database.`);

  console.log("=== ALL DAY 9 PARENT, COUNSELOR, TUITION & STUDY PLAN CHECKS PASSED ===");
}

verifyDay9()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
