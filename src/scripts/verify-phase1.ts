import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyPhase1() {
  console.log("=== VERIFYING AI STUDY STUDIO & TELEMETRY SCHEMA (PHASE 1) ===");

  // 1. Fetch teacher and student
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });

  if (!teacher || !student) {
    throw new Error("Teacher or Student user not found!");
  }
  console.log(`✓ Users verified: Teacher=${teacher.fullName} (${teacher.id}), Student=${student.fullName} (${student.id})`);

  // 2. Create a test StudyPack
  const testPack = await prisma.studyPack.create({
    data: {
      title: "بسته مفهومی مشتق و کاربردها (شبیه‌ساز Gizmo / StudyFetch)",
      description: "تحلیل اکسترمم‌های نسبی، عطف و نقاط بحرانی حسابان ۳",
      creatorId: teacher.id,
      sourceType: "TEXT",
      rawContent: "مشتق تابع در نقاط بحرانی برابر صفر است یا وجود ندارد...",
      summaryJson: JSON.stringify({
        summary: "مفاهیم کلیدی مشتق و کاربرد آن در بهینه‌سازی و رسم نمودار تابع.",
        cheatSheet: [
          "نقطه بحرانی: f'(c) = 0 یا مشتق ناموجود",
          "آزمون مشتق اول: تغییر علامت از مثبت به منفی نشان‌دهنده ماکزیمم نسبی است",
        ],
        glossary: [
          { term: "نقطه بحرانی", definition: "نقطه‌ای در دامنه تابع که مشتق در آن صفر یا تعریف‌نشده است." },
        ],
      }),
      mindMapJson: JSON.stringify({
        nodes: [
          { id: "1", label: "مفهوم مشتق", category: "پایه" },
          { id: "2", label: "نقاط بحرانی", category: "کاربرد" },
          { id: "3", label: "اکسترمم‌های نسبی", category: "نتیجه" },
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", label: "منجر به" },
          { id: "e2-3", source: "2", target: "3", label: "تعیین" },
        ],
      }),
      topicTag: "مشتق و کاربردها",
      gradeLevel: 12,
      isPublic: true,
    },
  });
  console.log(`✓ StudyPack created: ID=${testPack.id}, Title="${testPack.title}"`);

  // 3. Create a Flashcard
  const card = await prisma.studyFlashcard.create({
    data: {
      studyPackId: testPack.id,
      front: "شرط لازم برای وجود اکسترمم نسبی در یک نقطه مشتق‌پذیر چیست؟",
      back: "برابر صفر بودن مشتق اول: $f'(x_0) = 0$ (قضیه فرما)",
      hint: "به شیب خط مماس افقی توجه کنید.",
      topicTag: "مشتق و کاربردها",
      difficulty: "MEDIUM",
      orderIndex: 1,
    },
  });
  console.log(`✓ StudyFlashcard created: ID=${card.id}`);

  // 4. Create StudentCardProgress (SM-2 State linked via studentId)
  const progress = await prisma.studentCardProgress.create({
    data: {
      studentId: student.id,
      flashcardId: card.id,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      lastRating: 3, // Good
      nextReviewDate: new Date(Date.now() + 24 * 3600 * 1000),
      lastReviewedAt: new Date(),
      reviewCount: 1,
    },
  });
  console.log(`✓ StudentCardProgress (SM-2) created: studentId=${progress.studentId}, EF=${progress.easinessFactor}, Interval=${progress.interval}d`);

  // 5. Create StudyQuiz and Question
  const quiz = await prisma.studyQuiz.create({
    data: {
      studyPackId: testPack.id,
      title: "کوییز تشخیصی مشتق و نقاط بحرانی",
      description: "آزمون تطبیقی ۴ گزینه‌ای با بازخورد مفهومی بلوم",
      timeLimitMinutes: 10,
    },
  });

  const quizQuestion = await prisma.studyQuizQuestion.create({
    data: {
      quizId: quiz.id,
      questionText: "اگر $f(x) = x^3 - 3x + 1$ باشد، طول نقاط بحرانی تابع کدام است؟",
      type: "MULTIPLE_CHOICE",
      optionsJson: JSON.stringify(["$x = 0$", "$x = \\pm 1$", "$x = 3$", "$x = \\pm \\sqrt{3}$"]),
      correctAnswer: "$x = \\pm 1$",
      explanation: "مشتق تابع برابر $f'(x) = 3x^2 - 3$ است. با قرار دادن $f'(x) = 0$ داریم $x^2 = 1 \\implies x = \\pm 1$.",
      bloomLevel: "APPLY",
      topicTag: "مشتق و کاربردها",
      orderIndex: 1,
    },
  });
  console.log(`✓ StudyQuiz and StudyQuizQuestion created: QuizID=${quiz.id}, QuestionID=${quizQuestion.id}`);

  // 6. Create StudyQuizAttempt linked to student
  const attempt = await prisma.studyQuizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId: student.id,
      score: 1.0,
      maxScore: 1.0,
      percentage: 100.0,
      answersJson: JSON.stringify({
        [quizQuestion.id]: { studentAnswer: "$x = \\pm 1$", isCorrect: true, timeSpentMs: 14500 },
      }),
      timeSpentSeconds: 15,
      activeTimeSeconds: 14,
      idleTimeSeconds: 1,
      completedAt: new Date(),
    },
  });
  console.log(`✓ StudyQuizAttempt created: Student=${attempt.studentId}, Score=${attempt.score}/${attempt.maxScore}, ActiveTime=${attempt.activeTimeSeconds}s`);

  // 7. Create StudyTelemetryLog
  const telemetry = await prisma.studyTelemetryLog.create({
    data: {
      studentId: student.id,
      studyPackId: testPack.id,
      eventType: "quiz_attempt_completed",
      topicTag: "مشتق و کاربردها",
      activeDurationSeconds: 14,
      idleDurationSeconds: 1,
      metadataJson: JSON.stringify({ attemptId: attempt.id, score: 100, bloomLevel: "APPLY" }),
    },
  });
  console.log(`✓ StudyTelemetryLog created: ID=${telemetry.id}, Event=${telemetry.eventType}`);

  // 8. Create StudyPackAssignment (Teacher toolkit)
  const classroom = await prisma.classroom.findFirst();
  const assignment = await prisma.studyPackAssignment.create({
    data: {
      studyPackId: testPack.id,
      teacherId: teacher.id,
      classroomId: classroom?.id,
      studentId: student.id,
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      minMasteryScore: 85.0,
      instructions: "لطفاً فلش‌کارت‌ها را مرور کرده و به تسلط ۸۵٪ برسید.",
    },
  });
  console.log(`✓ StudyPackAssignment created: ID=${assignment.id}, MinMastery=${assignment.minMasteryScore}%`);

  // 9. Query back relations via User to prove foreign key linkage
  const studentWithRelations = await prisma.user.findUnique({
    where: { id: student.id },
    include: {
      cardProgresses: true,
      studyQuizAttempts: true,
      studyTelemetryLogs: true,
      studentStudyPackAssignments: true,
    },
  });

  if (
    !studentWithRelations ||
    studentWithRelations.cardProgresses.length === 0 ||
    studentWithRelations.studyQuizAttempts.length === 0 ||
    studentWithRelations.studyTelemetryLogs.length === 0
  ) {
    throw new Error("Relation check failed on student User object!");
  }

  console.log(`✓ FOREIGN KEY LINKAGE CONFIRMED: Student "${studentWithRelations.fullName}" successfully linked to:`);
  console.log(`   - ${studentWithRelations.cardProgresses.length} Card Progress records`);
  console.log(`   - ${studentWithRelations.studyQuizAttempts.length} Quiz Attempt records`);
  console.log(`   - ${studentWithRelations.studyTelemetryLogs.length} Telemetry Log records`);
  console.log(`   - ${studentWithRelations.studentStudyPackAssignments.length} Study Pack Assignments`);

  console.log("\n=== ALL PHASE 1 DATABASE CHECKS PASSED WITH 100% SUCCESS ===");
}

verifyPhase1()
  .catch((e) => {
    console.error("PHASE 1 VERIFICATION FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
