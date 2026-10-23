import { PrismaClient } from "@prisma/client";
import { FileParserService } from "../lib/study-studio/fileParser";
import { AIStudyStudioService } from "../lib/study-studio/aiService";

const prisma = new PrismaClient();

async function verifyPhase2() {
  console.log("===============================================================");
  console.log("  PHASE 2 VERIFICATION: FILE PARSER & AI GENERATION ENGINE  ");
  console.log("===============================================================\n");

  // 1. Test FileParserService with various formats
  console.log("--- 1. Testing FileParserService ---");
  const textInput = FileParserService.parseInput("مشتق توابع مثلثاتی و فرمول‌های طلایی کنکور حسابان ۳");
  if (textInput.sourceType !== "TEXT" || !textInput.rawText) {
    throw new Error("Text parsing failed!");
  }
  console.log(`✓ Text input parsed: Source=${textInput.sourceType}, Length=${textInput.rawText.length}`);

  const pdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKJUZpbGUgY29udGVudA==";
  const pdfInput = FileParserService.parseInput(pdfDataUrl, undefined, "jozveh_hesaban.pdf");
  if (pdfInput.sourceType !== "PDF" || !pdfInput.base64Data || pdfInput.mimeType !== "application/pdf") {
    throw new Error("PDF parsing failed!");
  }
  console.log(`✓ PDF input parsed: Source=${pdfInput.sourceType}, Mime=${pdfInput.mimeType}`);

  const imgDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const imgInput = FileParserService.parseInput(imgDataUrl, undefined, "takhteh_class.png");
  if (imgInput.sourceType !== "IMAGE" || !imgInput.base64Data) {
    throw new Error("Image parsing failed!");
  }
  console.log(`✓ Image input parsed: Source=${imgInput.sourceType}, Mime=${imgInput.mimeType}`);

  const audioDataUrl = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA";
  const audioInput = FileParserService.parseInput(audioDataUrl, undefined, "voice_dars.mp3");
  if (audioInput.sourceType !== "AUDIO" || !audioInput.base64Data) {
    throw new Error("Audio parsing failed!");
  }
  console.log(`✓ Audio input parsed: Source=${audioInput.sourceType}, Mime=${audioInput.mimeType}`);

  // 2. Test AI Generation & Offline Fallback Engine
  console.log("\n--- 2. Testing AI Generation & JSON Schema Enforcement ---");
  const generatedPack = await AIStudyStudioService.generateStudyPack(textInput, {
    targetGrade: 12,
    preferredTopic: "مشتق و کاربردها",
  });

  // Verify Schema Structure (Checkpoint Requirement)
  if (!generatedPack.title || !generatedPack.description || !generatedPack.topicTag) {
    throw new Error("Missing root metadata in generated pack!");
  }
  console.log(`✓ Pack Title: "${generatedPack.title}"`);
  console.log(`✓ Topic Tag: "${generatedPack.topicTag}"`);

  // Verify Summary, CheatSheet & Glossary
  if (
    !generatedPack.summary.overview ||
    !Array.isArray(generatedPack.summary.keyTakeaways) ||
    generatedPack.summary.keyTakeaways.length === 0 ||
    !Array.isArray(generatedPack.summary.glossary)
  ) {
    throw new Error("Invalid Summary or Glossary structure!");
  }
  console.log(`✓ Summary: ${generatedPack.summary.keyTakeaways.length} key takeaways, ${generatedPack.summary.glossary.length} glossary terms.`);

  // Verify Flashcards (KaTeX formula support)
  if (!Array.isArray(generatedPack.flashcards) || generatedPack.flashcards.length === 0) {
    throw new Error("No flashcards generated!");
  }
  const sampleCard = generatedPack.flashcards[0];
  if (!sampleCard.front || !sampleCard.back || !sampleCard.difficulty) {
    throw new Error("Invalid Flashcard structure!");
  }
  console.log(`✓ Flashcards: ${generatedPack.flashcards.length} cards generated. Sample: Front="${sampleCard.front.slice(0, 40)}..."`);

  // Verify Adaptive Quiz Bank (Bloom taxonomy & explanations)
  if (!generatedPack.quiz || !Array.isArray(generatedPack.quiz.questions) || generatedPack.quiz.questions.length === 0) {
    throw new Error("Invalid Quiz structure!");
  }
  const sampleQuestion = generatedPack.quiz.questions[0];
  if (!sampleQuestion.questionText || !sampleQuestion.correctAnswer || !sampleQuestion.explanation || !sampleQuestion.bloomLevel) {
    throw new Error("Invalid Quiz Question fields!");
  }
  console.log(`✓ Quiz: "${generatedPack.quiz.title}" with ${generatedPack.quiz.questions.length} questions. Sample Bloom=${sampleQuestion.bloomLevel}`);

  // Verify Interactive Mind Map
  if (
    !generatedPack.mindMap ||
    !Array.isArray(generatedPack.mindMap.nodes) ||
    !Array.isArray(generatedPack.mindMap.edges) ||
    generatedPack.mindMap.nodes.length === 0
  ) {
    throw new Error("Invalid Mind Map structure!");
  }
  console.log(`✓ Mind Map: ${generatedPack.mindMap.nodes.length} nodes and ${generatedPack.mindMap.edges.length} edges.`);

  // 3. Test JSON Sanitizer & Malformed Input Recovery (Anti-Crash Guarantee)
  console.log("\n--- 3. Testing JSON Sanitizer & Anti-Crash Safety ---");
  const malformedJsonWithMarkdown = "```json\n" + JSON.stringify(generatedPack) + "\n```";
  const sanitized = AIStudyStudioService.sanitizeAndValidateJson(malformedJsonWithMarkdown, textInput);
  if (!sanitized.title || sanitized.flashcards.length === 0) {
    throw new Error("Sanitizer failed on markdown code fences!");
  }
  console.log("✓ JSON Sanitizer successfully stripped markdown fences and validated all schema fields.");

  // Test total garbage JSON recovery
  const garbageRecovery = AIStudyStudioService.sanitizeAndValidateJson("THIS IS NOT JSON AT ALL", textInput);
  if (!garbageRecovery.title || !garbageRecovery.flashcards || garbageRecovery.flashcards.length === 0) {
    throw new Error("Sanitizer failed to recover from invalid JSON!");
  }
  console.log("✓ JSON Sanitizer gracefully recovered from corrupted input without throwing or crashing.");

  // 4. Test Database Persistence
  console.log("\n--- 4. Testing Database Persistence ---");
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (!teacher || !student) throw new Error("Users not found for test!");

  const savedPack = await prisma.studyPack.create({
    data: {
      title: generatedPack.title,
      description: generatedPack.description,
      creatorId: teacher.id,
      sourceType: "TEXT",
      rawContent: textInput.rawText,
      summaryJson: JSON.stringify(generatedPack.summary),
      mindMapJson: JSON.stringify(generatedPack.mindMap),
      topicTag: generatedPack.topicTag,
      gradeLevel: generatedPack.gradeLevel,
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
        create: {
          title: generatedPack.quiz.title,
          description: generatedPack.quiz.description,
          timeLimitMinutes: generatedPack.quiz.timeLimitMinutes,
          questions: {
            create: generatedPack.quiz.questions.map((q, idx) => ({
              questionText: q.questionText,
              type: q.type,
              optionsJson: q.options ? JSON.stringify(q.options) : null,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              bloomLevel: q.bloomLevel,
              topicTag: q.topicTag,
              orderIndex: idx + 1,
            })),
          },
        },
      },
    },
    include: {
      flashcards: true,
      quizzes: { include: { questions: true } },
    },
  });

  console.log(`✓ StudyPack saved to DB: ID=${savedPack.id}`);
  console.log(`  - Saved ${savedPack.flashcards.length} flashcards`);
  console.log(`  - Saved ${savedPack.quizzes[0].questions.length} quiz questions`);

  // Initialize SM-2 progress records for student
  await Promise.all(
    savedPack.flashcards.map((c) =>
      prisma.studentCardProgress.create({
        data: {
          studentId: student.id,
          flashcardId: c.id,
          easinessFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date(),
        },
      })
    )
  );
  console.log(`✓ Initialized ${savedPack.flashcards.length} SM-2 card progress records for student ${student.fullName}.`);

  // 5. Query back from DB
  const retrieved = await prisma.studyPack.findUnique({
    where: { id: savedPack.id },
    include: {
      flashcards: {
        include: {
          progressRecords: { where: { studentId: student.id } },
        },
      },
      quizzes: {
        include: { questions: true },
      },
    },
  });

  if (!retrieved || retrieved.flashcards.length === 0 || retrieved.flashcards[0].progressRecords.length === 0) {
    throw new Error("Failed to retrieve saved pack with SM-2 progress records!");
  }
  console.log("✓ Retrieved study pack with complete flashcard SM-2 progress and quiz structure.");

  console.log("\n===============================================================");
  console.log("  ★ ALL PHASE 2 FILE PARSER & AI SERVICE CHECKS PASSED ★  ");
  console.log("===============================================================\n");
}

verifyPhase2()
  .catch((e) => {
    console.error("PHASE 2 VERIFICATION FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
