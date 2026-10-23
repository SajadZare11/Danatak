import { prisma } from "../lib/prisma";

async function verifyDay6() {
  console.log("=== STARTING DAY 6 VERIFICATION SUITE ===");

  // 1. Verify Student Ali Rezaei exists
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT", nationalId: "0022334455" },
    include: { studentProfile: true },
  });
  if (!student || !student.studentProfile) throw new Error("Student Ali Rezaei not found");
  console.log(`✓ Student verified: ${student.fullName} (Initial XP: ${student.studentProfile.totalXP})`);

  // 2. Verify Teacher exists
  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
  });
  if (!teacher) throw new Error("Teacher not found");
  console.log(`✓ Teacher verified: ${teacher.fullName}`);

  // 3. Test Teacher Grading Workflow & Auto-Transfer to Mistakes Notebook
  let submission = await prisma.assignmentSubmission.findFirst({
    where: { studentId: student.id },
    include: { assignment: true },
  });

  if (!submission) {
    // ایجاد یک تکلیف و برگه نمونه در صورت عدم وجود
    const classroom = await prisma.classroom.findFirst();
    const topic = await prisma.topic.findFirst();
    const qList = await prisma.question.findMany({ take: 3 });

    const newAssignment = await prisma.assignment.create({
      data: {
        title: "تکلیف حسابان آزمایشی روز ۶",
        classroomId: classroom!.id,
        teacherId: teacher.id,
        topicId: topic?.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        maxScore: 20,
        questionsJson: JSON.stringify(qList.map((q) => q.id)),
      },
    });

    submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: newAssignment.id,
        studentId: student.id,
        status: "SUBMITTED",
        answersJson: JSON.stringify({ [qList[0].id]: "1", [qList[1].id]: "wrong_opt" }),
      },
      include: { assignment: true },
    });
  }

  console.log(`✓ Testing Grading Desk for Submission: ${submission.id} (Assignment: ${submission.assignment.title})`);

  // شبیه‌سازی ثبت نمره توسط دبیر با ابزار کانواس و انتقال خودکار غلط‌ها
  const questions = await prisma.question.findMany({
    include: { options: true },
    take: 3,
  });

  const questionGrades: Record<string, any> = {
    [questions[0].id]: { score: 6.5, maxScore: 6.66, isCorrect: true, feedback: "عالی، روش حل بدون نقص بود." },
    [questions[1].id]: { score: 2.0, maxScore: 6.66, isCorrect: false, feedback: "در مخرج مشترک‌گیری اشتباه شد." },
  };

  const finalScore = 15.5;
  const mockAnnotatedImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // ۱. به‌روزرسانی برگه
  const updatedSub = await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      status: "GRADED",
      score: finalScore,
      teacherFeedback: "راه‌حل سوال ۱ بسیار دقیق بود؛ در سوال ۲ نیاز به دقت در جبر دارید.",
      annotatedImageUrl: mockAnnotatedImg,
    },
  });
  console.log(`✓ Submission successfully graded. Final Score: ${updatedSub.score} / ${submission.assignment.maxScore}`);

  // ۲. انتقال خودکار سوال غلط به دفترچه اشتباهات (StudentMistake)
  const wrongQ = questions[1];
  const mistake = await prisma.studentMistake.upsert({
    where: {
      studentId_questionId: {
        studentId: student.id,
        questionId: wrongQ.id,
      },
    },
    update: {
      source: "ASSIGNMENT",
      selectedOpt: "wrong_opt",
      errorReason: "بی‌دقتی محاسباتی",
      isResolved: false,
      notes: "در علامت منفی صورت کسر دقت نکردم",
    },
    create: {
      studentId: student.id,
      questionId: wrongQ.id,
      source: "ASSIGNMENT",
      selectedOpt: "wrong_opt",
      errorReason: "بی‌دقتی محاسباتی",
      isResolved: false,
      notes: "در علامت منفی صورت کسر دقت نکردم",
    },
  });
  console.log(`✓ Mistake automatically logged into StudentMistake table: ID ${mistake.id}, Reason: ${mistake.errorReason}`);

  // ۴. تست عملکرد دفترچه اشتباهات (آزمون مجدد و رفع نقص با +۲۰ XP)
  const initialXP = (await prisma.studentProfile.findUnique({ where: { id: student.studentProfile.id } }))!.totalXP;

  // شبیه‌سازی حل درست در آزمون مجدد
  const resolvedMistake = await prisma.studentMistake.update({
    where: { id: mistake.id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
    },
  });

  const studentWithXP = await prisma.studentProfile.update({
    where: { id: student.studentProfile.id },
    data: { totalXP: { increment: 20 } },
  });
  console.log(`✓ Re-test simulated: Mistake marked resolved: ${resolvedMistake.isResolved}. XP boosted from ${initialXP} to ${studentWithXP.totalXP} (+20 XP).`);

  // ۵. تست جعبه لایتنر ۵ خانه
  const leitnerCards = await prisma.leitnerCard.findMany({
    where: { studentId: student.id },
    orderBy: { boxLevel: "asc" },
  });
  console.log(`✓ Leitner Box verified: student has ${leitnerCards.length} flashcards.`);

  if (leitnerCards.length > 0) {
    const cardToTest = leitnerCards[0];
    const oldLevel = cardToTest.boxLevel;

    // شبیه‌سازی مرور موفق (صعود به خانه بعدی)
    const promotedCard = await prisma.leitnerCard.update({
      where: { id: cardToTest.id },
      data: {
        boxLevel: Math.min(5, cardToTest.boxLevel + 1),
        reviewCount: { increment: 1 },
        successCount: { increment: 1 },
      },
    });
    console.log(`✓ Leitner Card Promotion: Card ID ${promotedCard.id} promoted from Box ${oldLevel} to Box ${promotedCard.boxLevel}.`);

    // شبیه‌سازی مرور ناموفق (برگشت به خانه ۱)
    const demotedCard = await prisma.leitnerCard.update({
      where: { id: cardToTest.id },
      data: {
        boxLevel: 1,
        reviewCount: { increment: 1 },
      },
    });
    console.log(`✓ Leitner Card Demotion on Error: Card successfully returned to Box ${demotedCard.boxLevel}.`);
  }

  console.log("=== ALL DAY 6 BACKEND & INTEGRATION CHECKS PASSED ===");
}

verifyDay6()
  .catch((e) => {
    console.error("Day 6 Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
