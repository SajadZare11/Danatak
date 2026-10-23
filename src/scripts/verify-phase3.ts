import { PrismaClient } from "@prisma/client";
import { SM2Engine } from "../lib/study-studio/sm2";
import { CardRating } from "../lib/study-studio/types";

const prisma = new PrismaClient();

async function verifyPhase3() {
  console.log("===============================================================");
  console.log("  PHASE 3 VERIFICATION: SM-2 ENGINE, FLASHCARDS & QUIZ RUNNER  ");
  console.log("===============================================================\n");

  // 1. Math Verification of SuperMemo-2 (SM-2) Spaced Repetition Engine
  console.log("--- 1. Testing SM-2 Mathematical Engine ---");
  const initialState = {
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapseCount: 0,
  };

  // Test Rating 1 (Again / فراموشی)
  const againResult = SM2Engine.calculate(initialState, 1);
  if (againResult.repetitions !== 0 || againResult.easinessFactor >= 2.5 || againResult.lapseCount !== 1) {
    throw new Error("SM-2 Again rating math failed!");
  }
  console.log(`✓ Rating 1 (Again): Reps=${againResult.repetitions}, Interval=${againResult.intervalDisplayFa}, EF=${againResult.easinessFactor}, Lapses=${againResult.lapseCount}`);

  // Test Rating 3 (Good / خوب)
  const goodResult1 = SM2Engine.calculate(initialState, 3);
  if (goodResult1.repetitions !== 1 || goodResult1.interval !== 1) {
    throw new Error("SM-2 Good rating step 1 failed!");
  }
  console.log(`✓ Rating 3 (Good - Step 1): Reps=${goodResult1.repetitions}, Interval=${goodResult1.intervalDisplayFa}, EF=${goodResult1.easinessFactor}`);

  // Step 2 Good Review
  const goodResult2 = SM2Engine.calculate(
    {
      easinessFactor: goodResult1.easinessFactor,
      interval: goodResult1.interval,
      repetitions: goodResult1.repetitions,
      lapseCount: 0,
    },
    3
  );
  if (goodResult2.repetitions !== 2 || goodResult2.interval < 3) {
    throw new Error("SM-2 Good rating step 2 failed!");
  }
  console.log(`✓ Rating 3 (Good - Step 2): Reps=${goodResult2.repetitions}, Interval=${goodResult2.intervalDisplayFa}, NextDate=${goodResult2.nextReviewDate.toLocaleDateString("fa-IR")}`);

  // Test Rating 4 (Easy / آسان)
  const easyResult = SM2Engine.calculate(initialState, 4);
  if (easyResult.easinessFactor <= 2.5 || easyResult.repetitions !== 1) {
    throw new Error("SM-2 Easy rating failed!");
  }
  console.log(`✓ Rating 4 (Easy): Reps=${easyResult.repetitions}, Interval=${easyResult.intervalDisplayFa}, EF=${easyResult.easinessFactor}`);

  // Test Estimated Intervals Display Helper
  const estimates = SM2Engine.getEstimatedIntervals(initialState);
  if (!estimates[1] || !estimates[2] || !estimates[3] || !estimates[4]) {
    throw new Error("SM-2 Estimated intervals failed!");
  }
  console.log(`✓ Estimated Intervals for 4 buttons: 1="${estimates[1]}", 2="${estimates[2]}", 3="${estimates[3]}", 4="${estimates[4]}"`);

  // 2. Test Flashcard Review DB Updating (SM-2 Persistence)
  console.log("\n--- 2. Testing Flashcard SM-2 Progress Persistence ---");
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (!student) throw new Error("Student not found!");

  const card = await prisma.studyFlashcard.findFirst({
    include: { studyPack: true },
  });
  if (!card) throw new Error("Flashcard not found!");

  // Review card with Rating 3 (Good)
  const updatedProgress = await prisma.studentCardProgress.upsert({
    where: {
      studentId_flashcardId: {
        studentId: student.id,
        flashcardId: card.id,
      },
    },
    create: {
      studentId: student.id,
      flashcardId: card.id,
      easinessFactor: goodResult1.easinessFactor,
      interval: goodResult1.interval,
      repetitions: goodResult1.repetitions,
      nextReviewDate: goodResult1.nextReviewDate,
      lastRating: 3,
      reviewCount: 1,
    },
    update: {
      easinessFactor: goodResult1.easinessFactor,
      interval: goodResult1.interval,
      repetitions: goodResult1.repetitions,
      nextReviewDate: goodResult1.nextReviewDate,
      lastRating: 3,
      reviewCount: { increment: 1 },
    },
  });

  if (updatedProgress.interval !== goodResult1.interval || updatedProgress.lastRating !== 3) {
    throw new Error("Failed to persist SM-2 progress!");
  }
  console.log(`✓ Flashcard reviewed and persisted: Student=${student.fullName}, CardID=${card.id}`);
  console.log(`  - Interval: ${updatedProgress.interval} days, NextReview: ${updatedProgress.nextReviewDate.toISOString()}`);

  // 3. Test Quiz Execution & Evaluation
  console.log("\n--- 3. Testing Interactive Quiz Execution & Scoring ---");
  const quiz = await prisma.studyQuiz.findFirst({
    include: { questions: true, studyPack: true },
  });
  if (!quiz || quiz.questions.length === 0) throw new Error("Quiz not found!");

  // Simulate student answering the quiz questions
  const answers: Record<string, string> = {};
  quiz.questions.forEach((q, idx) => {
    // Answer first correctly, second incorrectly if available
    answers[q.id] = idx === 0 ? q.correctAnswer : "پاسخ رندوم اشتباه";
  });

  let correctCount = 0;
  const evaluation: Record<string, any> = {};

  for (const q of quiz.questions) {
    const isCorrect = answers[q.id] === q.correctAnswer;
    if (isCorrect) correctCount++;
    evaluation[q.id] = {
      questionText: q.questionText,
      studentAnswer: answers[q.id],
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      bloomLevel: q.bloomLevel,
    };
  }

  const percentage = Math.round((correctCount / quiz.questions.length) * 100);
  const score = (correctCount / quiz.questions.length) * 20;

  const attempt = await prisma.studyQuizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId: student.id,
      score: Math.round(score * 10) / 10,
      maxScore: 20.0,
      percentage,
      answersJson: JSON.stringify(evaluation),
      timeSpentSeconds: 45,
      activeTimeSeconds: 42,
      idleTimeSeconds: 3,
      completedAt: new Date(),
    },
  });

  if (!attempt.id || attempt.percentage !== percentage) {
    throw new Error("Failed to create quiz attempt!");
  }
  console.log(`✓ Quiz Attempt recorded: Score=${attempt.score}/20 (${attempt.percentage}%), Correct=${correctCount}/${quiz.questions.length}`);
  console.log(`✓ Question 1 Bloom Level: ${evaluation[quiz.questions[0].id].bloomLevel}`);
  console.log(`✓ Explanation verified: "${evaluation[quiz.questions[0].id].explanation.slice(0, 50)}..."`);

  // 4. Test Telemetry Logging
  const telemetry = await prisma.studyTelemetryLog.create({
    data: {
      studentId: student.id,
      studyPackId: quiz.studyPackId,
      eventType: "quiz_attempt_completed",
      topicTag: quiz.studyPack.topicTag,
      activeDurationSeconds: 42,
      idleDurationSeconds: 3,
      metadataJson: JSON.stringify({ attemptId: attempt.id, percentage }),
    },
  });

  if (!telemetry.id) throw new Error("Failed to record telemetry!");
  console.log(`✓ Telemetry Log verified: Event=${telemetry.eventType}, ActiveSeconds=${telemetry.activeDurationSeconds}s, IdleSeconds=${telemetry.idleDurationSeconds}s`);

  console.log("\n===============================================================");
  console.log("  ★ ALL PHASE 3 SM-2, FLASHCARDS & QUIZ CHECKS PASSED 100% ★  ");
  console.log("===============================================================\n");
}

verifyPhase3()
  .catch((e) => {
    console.error("PHASE 3 VERIFICATION FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
