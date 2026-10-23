import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      submissionId,
      finalScore,
      teacherFeedback,
      annotatedImageUrl,
      questionGrades,
    } = body;

    if (!submissionId || finalScore === undefined) {
      return NextResponse.json({ error: "اطلاعات ارسالی برای ثبت نمره ناقص است" }, { status: 400 });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "برگه مورد نظر یافت نشد" }, { status: 404 });
    }

    // ۱. به‌روزرسانی نمره و بازخورد برگه
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: "GRADED",
        score: Number(finalScore),
        teacherFeedback: teacherFeedback || null,
        annotatedImageUrl: annotatedImageUrl || null,
      },
    });

    // ۲. ثبت خودکار غلط‌ها در دفترچه اشتباهات هوشمند دانش‌آموز (Endoora Mistakes Notebook)
    let mistakesAdded = 0;
    if (questionGrades && typeof questionGrades === "object") {
      for (const [qId, qInfo] of Object.entries(questionGrades as Record<string, any>)) {
        const isWrong = qInfo.isCorrect === false || (qInfo.maxScore && qInfo.score < qInfo.maxScore);

        if (isWrong) {
          // استخراج گزینه یا پاسخ ارسال‌شده دانش‌آموز از JSON پاسخ‌ها
          let chosenOpt = null;
          if (submission.answersJson) {
            try {
              const parsed = JSON.parse(submission.answersJson);
              chosenOpt = parsed[qId] || null;
            } catch {
              chosenOpt = null;
            }
          }

          await prisma.studentMistake.upsert({
            where: {
              studentId_questionId: {
                studentId: submission.studentId,
                questionId: qId,
              },
            },
            update: {
              source: "ASSIGNMENT",
              selectedOpt: typeof chosenOpt === "string" ? chosenOpt : JSON.stringify(chosenOpt),
              isResolved: false,
              notes: qInfo.feedback || null,
            },
            create: {
              studentId: submission.studentId,
              questionId: qId,
              source: "ASSIGNMENT",
              selectedOpt: typeof chosenOpt === "string" ? chosenOpt : JSON.stringify(chosenOpt),
              errorReason: "عدم تسلط مفهومی",
              isResolved: false,
              notes: qInfo.feedback || null,
            },
          });
          mistakesAdded++;
        }
      }
    }

    // ۳. به‌روزرسانی رادار تسلط (Topic Mastery) در صورت انتساب به مبحث
    let updatedMastery = null;
    if (submission.assignment.topicId && submission.student.studentProfile) {
      const masteryPct = Math.min(
        100,
        Math.max(0, Math.round((Number(finalScore) / submission.assignment.maxScore) * 100))
      );

      updatedMastery = await prisma.topicMastery.upsert({
        where: {
          studentProfileId_topicId: {
            studentProfileId: submission.student.studentProfile.id,
            topicId: submission.assignment.topicId,
          },
        },
        update: {
          masteryPercentage: masteryPct,
          evaluatedBy: "TEACHER",
          lastEvaluatedAt: new Date(),
        },
        create: {
          studentProfileId: submission.student.studentProfile.id,
          topicId: submission.assignment.topicId,
          masteryPercentage: masteryPct,
          evaluatedBy: "TEACHER",
          lastEvaluatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      mistakesAdded,
      updatedMastery,
      message: `برگه با نمره ${finalScore} با موفقیت تصحیح شد. ${mistakesAdded} سوال به دفترچه اشتباهات دانش‌آموز انتقال یافت.`,
    });
  } catch (error) {
    console.error("Teacher Grade POST error:", error);
    return NextResponse.json({ error: "خطا در ثبت نمره و تصحیح برگه" }, { status: 500 });
  }
}
