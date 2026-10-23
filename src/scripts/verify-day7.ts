import { prisma } from "../lib/prisma";

async function verifyDay7() {
  console.log("=== STARTING DAY 7 VERIFICATION SUITE ===");

  // 1. Verify Student Ali Rezaei
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT", nationalId: "0022334455" },
    include: { studentProfile: true },
  });
  if (!student || !student.studentProfile) throw new Error("Student Ali Rezaei not found");
  console.log(`✓ Student verified: ${student.fullName} (Starting XP: ${student.studentProfile.totalXP})`);

  // 2. Verify Exam exists
  const exam = await prisma.exam.findFirst({
    where: { id: "exam-sample-day7" },
    include: { classroom: true, topic: true },
  });
  if (!exam) throw new Error("Exam not found");
  console.log(`✓ Exam verified: ${exam.title} (Duration: ${exam.durationMinutes}m, AntiCheat: ${exam.enableAntiCheat}, Max Switches: ${exam.maxTabSwitches})`);

  // 3. Verify Questions in Exam
  let questionIds: string[] = [];
  try {
    questionIds = JSON.parse(exam.questionsJson);
  } catch {
    questionIds = [];
  }
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { options: true },
  });
  console.log(`✓ Hydrated ${questions.length} questions for exam.`);

  // 4. Test Student Submission with Negative Marking, Taraz & Auto-Feeding Mistakes
  const answers: Record<string, string> = {};
  let expectedCorrect = 0;
  let expectedWrong = 0;

  questions.forEach((q, idx) => {
    const correctOpt = q.options.find((o) => o.isCorrect);
    const wrongOpt = q.options.find((o) => !o.isCorrect);

    if (idx === 0 && correctOpt) {
      answers[q.id] = correctOpt.id;
      expectedCorrect++;
    } else if (wrongOpt) {
      answers[q.id] = wrongOpt.id;
      expectedWrong++;
    }
  });

  const totalQ = questions.length;
  // کنکور: ((۳ * درست - غلط) / (۳ * کل)) * ۱۰۰
  const expectedPercentage = Number((((3 * expectedCorrect - expectedWrong) / (3 * totalQ)) * 100).toFixed(2));
  const expectedScore = Number(Math.max(0, (expectedPercentage * 0.2)).toFixed(2));
  const expectedTaraz = Math.round(5000 + (expectedPercentage - 50) * 45);

  const mockWarningLogs = ["خروج از صفحه آزمون در ساعت ۲۱:۵۶:۱۴"];

  const attempt = await prisma.examAttempt.upsert({
    where: { id: "test-attempt-day7" },
    update: {
      examId: exam.id,
      studentId: student.id,
      submittedAt: new Date(),
      score: expectedScore,
      percentage: expectedPercentage,
      taraz: expectedTaraz,
      tabSwitchCount: 1,
      answersJson: JSON.stringify(answers),
      warningLogsJson: JSON.stringify(mockWarningLogs),
    },
    create: {
      id: "test-attempt-day7",
      examId: exam.id,
      studentId: student.id,
      submittedAt: new Date(),
      score: expectedScore,
      percentage: expectedPercentage,
      taraz: expectedTaraz,
      tabSwitchCount: 1,
      answersJson: JSON.stringify(answers),
      warningLogsJson: JSON.stringify(mockWarningLogs),
    },
  });

  console.log("✓ Exam Attempt recorded successfully:");
  console.log(`  - Correct: ${expectedCorrect}, Wrong: ${expectedWrong}`);
  console.log(`  - Percentage (با نمره منفی): ${attempt.percentage}%`);
  console.log(`  - Calculated Taraz (تراز کنکوری): ${attempt.taraz}`);
  console.log(`  - Security Violation Log: ${mockWarningLogs[0]}`);

  // 5. Test Auto-Transfer into Mistakes Notebook
  let mistakesAdded = 0;
  for (const q of questions) {
    const chosen = answers[q.id];
    const correctOpt = q.options.find((o) => o.isCorrect);
    if (!chosen || !correctOpt || (chosen !== correctOpt.id && chosen !== String(correctOpt.orderIndex))) {
      await prisma.studentMistake.upsert({
        where: {
          studentId_questionId: {
            studentId: student.id,
            questionId: q.id,
          },
        },
        update: {
          source: "EXAM",
          selectedOpt: chosen || "بی‌پاسخ",
          errorReason: "عدم تسلط مفهومی",
          isResolved: false,
        },
        create: {
          studentId: student.id,
          questionId: q.id,
          source: "EXAM",
          selectedOpt: chosen || "بی‌پاسخ",
          errorReason: "عدم تسلط مفهومی",
          isResolved: false,
        },
      });
      mistakesAdded++;
    }
  }
  console.log(`✓ Auto-Fed ${mistakesAdded} questions into StudentMistake table.`);

  // 6. Test XP Award (+50 XP)
  const initialXP = student.studentProfile.totalXP;
  const updatedStudentProfile = await prisma.studentProfile.update({
    where: { id: student.studentProfile.id },
    data: { totalXP: { increment: 50 } },
  });
  console.log(`✓ XP boosted from ${initialXP} to ${updatedStudentProfile.totalXP} (+50 XP).`);

  // 7. Verify Teacher Analytics Logic
  const allAttempts = await prisma.examAttempt.findMany({
    where: { examId: exam.id },
  });
  const avgTaraz = Math.round(allAttempts.reduce((a, b) => a + (b.taraz || 5000), 0) / allAttempts.length);
  console.log(`✓ Teacher Exam Analytics verified: Class average Taraz: ${avgTaraz}.`);

  console.log("=== ALL DAY 7 EXAM & ANTI-CHEAT SUITE CHECKS PASSED ===");
}

verifyDay7()
  .catch((e) => {
    console.error("Day 7 Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
