import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AILessonRecapService } from "@/lib/live/aiRecapService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.liveClassSession.findUnique({
      where: { id: sessionId },
      include: {
        hostTeacher: true,
        classroom: true,
        chats: {
          include: { sender: true },
          orderBy: { sentAt: "asc" },
        },
        quizzes: {
          orderBy: { createdAt: "asc" },
        },
        participants: {
          include: { student: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "جلسه کلاس یافت نشد." },
        { status: 404 }
      );
    }

    // اگر از قبل خلاصه‌ای تولید شده، آن را برگردان
    if (session.aiRecapJson) {
      try {
        const recap = JSON.parse(session.aiRecapJson);
        return NextResponse.json({
          success: true,
          recap,
          fromCache: true,
        });
      } catch (e) {
        // در صورت خرابی JSON قبلی، مجدداً تولید می‌شود
      }
    }

    // آماده‌سازی داده‌های جلسه برای هوش مصنوعی
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

    const calculatedDurationMinutes =
      session.actualStartTime && session.actualEndTime
        ? Math.max(
            1,
            Math.round(
              (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 60000
            )
          )
        : 60;

    const recap = await AILessonRecapService.generateRecap({
      title: session.title,
      subjectTitle: session.subjectTitle,
      classroomName: session.classroom?.name || "کلاس مجازی",
      teacherName: session.hostTeacher?.fullName || "استاد",
      durationMinutes: calculatedDurationMinutes,
      chats: chatsContext,
      quizzes: quizzesContext,
    });

    // ذخیره در پایگاه داده
    await prisma.liveClassSession.update({
      where: { id: sessionId },
      data: {
        aiRecapJson: JSON.stringify(recap),
      },
    });

    return NextResponse.json({
      success: true,
      recap,
      fromCache: false,
    });
  } catch (error: any) {
    console.error("Error getting lesson recap:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت یا تولید خلاصه هوشمند تدریس", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.liveClassSession.findUnique({
      where: { id: sessionId },
      include: {
        hostTeacher: true,
        classroom: true,
        chats: {
          include: { sender: true },
          orderBy: { sentAt: "asc" },
        },
        quizzes: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "جلسه کلاس یافت نشد." },
        { status: 404 }
      );
    }

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

    const calculatedDurationMinutes =
      session.actualStartTime && session.actualEndTime
        ? Math.max(
            1,
            Math.round(
              (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 60000
            )
          )
        : 60;

    const recap = await AILessonRecapService.generateRecap({
      title: session.title,
      subjectTitle: session.subjectTitle,
      classroomName: session.classroom?.name || "کلاس مجازی",
      teacherName: session.hostTeacher?.fullName || "استاد",
      durationMinutes: calculatedDurationMinutes,
      chats: chatsContext,
      quizzes: quizzesContext,
    });

    await prisma.liveClassSession.update({
      where: { id: sessionId },
      data: {
        aiRecapJson: JSON.stringify(recap),
      },
    });

    return NextResponse.json({
      success: true,
      message: "خلاصه هوشمند تدریس با هوش مصنوعی مجدداً تولید و ذخیره شد.",
      recap,
    });
  } catch (error: any) {
    console.error("Error regenerating lesson recap:", error);
    return NextResponse.json(
      { success: false, error: "خطا در تولید مجدد خلاصه هوشمند تدریس", details: error?.message },
      { status: 500 }
    );
  }
}
