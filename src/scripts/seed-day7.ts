import { prisma } from "../lib/prisma";

async function seedDay7() {
  console.log("Seeding Day 7: Zero-Cheat Online Exam...");

  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: { include: { classrooms: true } } },
  });
  if (!teacher || !teacher.teacherProfile) throw new Error("Teacher not found");

  const classroom = teacher.teacherProfile.classrooms[0];
  if (!classroom) throw new Error("Classroom not found");

  const questions = await prisma.question.findMany({
    where: { type: "MULTIPLE_CHOICE" },
    take: 5,
  });
  if (questions.length === 0) throw new Error("Questions not found");

  const questionIds = questions.map((q) => q.id);

  // ایجاد یا به‌روزرسانی آزمون نمونه روز ۷
  const exam = await prisma.exam.upsert({
    where: {
      id: "exam-sample-day7",
    },
    update: {
      title: "آزمون تستی جامع فصل مشتق و حد (شبیه‌ساز کنکور سراسری)",
      description: "آزمون آنلاین ضدتقلب با قفل تمام‌صفحه اجباری، واترمارک شناور کدملی، نمره منفی ۱/۳ و تراز سنجش",
      classroomId: classroom.id,
      teacherId: teacher.id,
      topicId: questions[0]?.topicId || null,
      startTime: new Date(),
      durationMinutes: 45,
      isSequential: false,
      enableAntiCheat: true,
      maxTabSwitches: 3,
      questionsJson: JSON.stringify(questionIds),
    },
    create: {
      id: "exam-sample-day7",
      title: "آزمون تستی جامع فصل مشتق و حد (شبیه‌ساز کنکور سراسری)",
      description: "آزمون آنلاین ضدتقلب با قفل تمام‌صفحه اجباری، واترمارک شناور کدملی، نمره منفی ۱/۳ و تراز سنجش",
      classroomId: classroom.id,
      teacherId: teacher.id,
      topicId: questions[0]?.topicId || null,
      startTime: new Date(),
      durationMinutes: 45,
      isSequential: false,
      enableAntiCheat: true,
      maxTabSwitches: 3,
      questionsJson: JSON.stringify(questionIds),
    },
  });

  console.log(`✓ Seeded Exam successfully: ${exam.id} (${exam.title}) with ${questionIds.length} questions.`);
}

seedDay7()
  .catch((e) => {
    console.error("Day 7 seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
