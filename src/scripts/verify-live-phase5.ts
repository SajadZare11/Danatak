import { prisma } from "../lib/prisma";
import { AILessonRecapService } from "../lib/live/aiRecapService";

async function main() {
  console.log("=== شروع بررسی و اعتبارسنجی فاز ۵ کلاس آنلاین زنده ===");

  // ۱. پیدا کردن جلسه کلاس
  const session = await prisma.liveClassSession.findFirst({
    include: {
      hostTeacher: true,
      classroom: true,
      chats: { include: { sender: true } },
      quizzes: true,
      participants: { include: { student: true } },
    },
  });

  if (!session) {
    throw new Error("هیچ جلسه کلاسی برای بررسی فاز ۵ یافت نشد.");
  }
  console.log(`[PASS] جلسه کلاس انتخاب شد: ${session.title} (${session.id})`);

  // ۲. آزمون سرویس استخراج هوشمند تدریس (AI Lesson Recap)
  console.log("در حال اجرای سرویس خلاصه‌ساز هوشمند تدریس با فرمول‌های KaTeX...");
  const chatsContext = session.chats.map((c) => ({
    senderName: c.sender?.fullName || "شرکت‌کننده",
    messageText: c.messageText,
    isQuestion: Boolean(c.isQuestion),
    isTeacher: Boolean(c.isTeacher),
  }));

  const quizzesContext = session.quizzes.map((q) => {
    let totalResponses = 0;
    try {
      const resp = q.responsesJson ? JSON.parse(q.responsesJson) : [];
      totalResponses = resp.length;
    } catch (e) {
      totalResponses = 0;
    }
    return {
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      totalResponses,
    };
  });

  const recap = await AILessonRecapService.generateRecap({
    title: session.title,
    subjectTitle: session.subjectTitle,
    classroomName: session.classroom?.name || "کلاس مجازی دوازدهم",
    teacherName: session.hostTeacher?.fullName || "استاد احسان محمدی",
    durationMinutes: session.durationMinutes || 60,
    chats: chatsContext,
    quizzes: quizzesContext,
  });

  if (!recap.summary || recap.summary.length < 20) {
    throw new Error("خلاصه هوشمند تولیدشده نامعتبر یا خالی است.");
  }
  if (!recap.keyTakeaways || recap.keyTakeaways.length === 0) {
    throw new Error("نکات کلیدی در خلاصه هوشمند تولید نشده است.");
  }
  if (!recap.formulasAndTheorems || recap.formulasAndTheorems.length === 0) {
    throw new Error("فرمول‌های KaTeX در خلاصه تدریس استخراج نشده است.");
  }

  console.log(`[PASS] خلاصه هوشمند تدریس استخراج شد: ${recap.summary.slice(0, 80)}...`);
  console.log(`[PASS] فرمول‌های KaTeX استخراج شده (${recap.formulasAndTheorems.length} فرمول):`);
  recap.formulasAndTheorems.forEach((f) => {
    console.log(`       - ${f.title}: ${f.formula}`);
  });

  // ۳. آزمون ذخیره‌سازی خلاصه هوشمند در دیتابیس
  console.log("در حال ذخیره‌سازی خلاصه هوشمند در پایگاه داده...");
  const updatedSession = await prisma.liveClassSession.update({
    where: { id: session.id },
    data: {
      aiRecapJson: JSON.stringify(recap),
    },
  });

  if (!updatedSession.aiRecapJson) {
    throw new Error("ذخیره aiRecapJson در پایگاه داده با خطا مواجه شد.");
  }
  console.log("[PASS] خلاصه هوشمند در فیلد aiRecapJson جلسه با موفقیت ذخیره شد 💾");

  // ۴. آزمون آمادگی برای آرشیو و چاپ PDF
  console.log("در حال بررسی آمادگی داده‌ها برای نمایش در صفحه آرشیو و خروجی PDF...");
  const archiveSession = await prisma.liveClassSession.findUnique({
    where: { id: session.id },
    include: {
      participants: { include: { student: true } },
      quizzes: true,
      classroom: true,
      hostTeacher: true,
    },
  });

  if (!archiveSession?.aiRecapJson) {
    throw new Error("اطلاعات آرشیو فاقد خلاصه است.");
  }
  const parsedArchiveRecap = JSON.parse(archiveSession.aiRecapJson);
  if (!parsedArchiveRecap.suggestedHomework || parsedArchiveRecap.suggestedHomework.length === 0) {
    throw new Error("تکالیف پیشنهادی برای دانش‌آموزان در آرشیو یافت نشد.");
  }

  console.log(`[PASS] داده‌های تکالیف و کارنامه حضور برای چاپ PDF تایید شد (${archiveSession.participants.length} شرکت‌کننده، ${archiveSession.quizzes.length} کوییز) 📄`);

  console.log("\n========================================================");
  console.log("✅ تمامی آزمون‌های فاز ۵ (خلاصه‌ساز AI با Gemini، فرمول‌های KaTeX و آرشیو PDF) با موفقیت ۱۰۰٪ پاس شدند!");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ خطا در اعتبارسنجی فاز ۵:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
