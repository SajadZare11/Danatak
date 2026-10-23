import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      studyPackId,
      topicTag = "عمومی",
      activeDurationSeconds = 0,
      idleDurationSeconds = 0,
      eventType = "active_heartbeat",
    } = body;

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      targetStudentId = defaultStudent?.id;
    }

    if (!targetStudentId) {
      return NextResponse.json(
        { success: false, error: "کاربر دانش‌آموز یافت نشد." },
        { status: 400 }
      );
    }

    // ۱. ثبت رویداد در لاگ دورسنجی
    await prisma.studyTelemetryLog.create({
      data: {
        studentId: targetStudentId,
        studyPackId: studyPackId || null,
        topicTag,
        eventType,
        activeDurationSeconds: Number(activeDurationSeconds) || 0,
        idleDurationSeconds: Number(idleDurationSeconds) || 0,
        metadataJson: JSON.stringify({
          source: "ActiveFocusTracker",
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // ۲. اتصال مستقیم به سیستم رهگیری فعالیت‌های دانش‌آموز (StudyLog)
    // هر زمان که دانش‌آموز حداقل ۶۰ ثانیه مطالعه فعال در استودیو داشته باشد
    if (activeDurationSeconds >= 30) {
      const mathSubject = await prisma.subject.findFirst({
        where: { code: "MATH-01" },
      });

      if (mathSubject) {
        const addedMinutes = Math.max(1, Math.round(activeDurationSeconds / 60));

        await prisma.studyLog.create({
          data: {
            studentId: targetStudentId,
            subjectId: mathSubject.id,
            studyMinutes: addedMinutes,
            testCount: 0,
            note: `مطالعه فعال در استودیوی هوشمند: ${topicTag}`,
          },
        });
      }
    }

    // ۳. به‌روزرسانی رادار تسلط سرفصل (TopicMastery) در پورتفولیو
    const studentWithProfile = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: {
        studentProfile: {
          include: {
            masteryRecords: {
              include: { topic: true },
            },
          },
        },
      },
    });

    if (studentWithProfile?.studentProfile) {
      // یافتن رکورد مبحث مشابه
      const matchedRecord = studentWithProfile.studentProfile.masteryRecords.find(
        (m) =>
          m.topic.title.includes(topicTag) ||
          topicTag.includes(m.topic.title)
      );

      if (matchedRecord) {
        // ارتقای جزئی تسلط بر اثر مداومت مطالعه (تا سقف ۹۵٪)
        const newPercentage = Math.min(95, Math.round(matchedRecord.masteryPercentage + 0.5));
        await prisma.topicMastery.update({
          where: { id: matchedRecord.id },
          data: {
            masteryPercentage: newPercentage,
            lastEvaluatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      loggedActive: activeDurationSeconds,
      loggedIdle: idleDurationSeconds,
    });
  } catch (error: any) {
    console.error("Error logging telemetry heartbeat:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت ضربان قلب دورسنجی", details: error?.message },
      { status: 500 }
    );
  }
}
