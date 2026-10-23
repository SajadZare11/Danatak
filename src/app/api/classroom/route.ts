import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await prisma.virtualClassroomSession.findFirst({
      where: { status: "LIVE" },
      include: {
        attendees: { orderBy: { joinedAt: "asc" } },
        chatMessages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({
        success: true,
        session: null,
        message: "در حال حاضر هیچ کلاس زنده‌ای در حال برگزاری نیست.",
      });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("Classroom API GET error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت وضعیت کلاس آنلاین" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId = "live-session-calculus", payload } = body;

    // ۱. ارسال پیام در چت زنده
    if (action === "SEND_CHAT") {
      const { senderName, senderRole, message } = payload;
      if (!message || !message.trim()) {
        return NextResponse.json({ success: false, error: "متن پیام خالی است" }, { status: 400 });
      }

      const newMsg = await prisma.virtualClassroomChatMessage.create({
        data: {
          sessionId,
          senderName: senderName || "دانش‌آموز",
          senderRole: senderRole || "STUDENT",
          message,
        },
      });

      return NextResponse.json({ success: true, message: newMsg });
    }

    // ۲. دست بلند کردن دانش‌آموز (Hand Raise)
    if (action === "TOGGLE_HAND") {
      const { userId = "student-demo" } = payload;
      const attendee = await prisma.virtualClassroomAttendee.findFirst({
        where: { sessionId, userId },
      });

      if (attendee) {
        const updated = await prisma.virtualClassroomAttendee.update({
          where: { id: attendee.id },
          data: { isHandRaised: !attendee.isHandRaised },
        });
        return NextResponse.json({ success: true, attendee: updated });
      }
    }

    // ۳. فعال/غیرفعال کردن میکروفون
    if (action === "TOGGLE_MIC") {
      const { userId = "student-demo" } = payload;
      const attendee = await prisma.virtualClassroomAttendee.findFirst({
        where: { sessionId, userId },
      });

      if (attendee) {
        const updated = await prisma.virtualClassroomAttendee.update({
          where: { id: attendee.id },
          data: { isMicOn: !attendee.isMicOn },
        });
        return NextResponse.json({ success: true, attendee: updated });
      }
    }

    // ۴. تغییر اسلاید / صفحه کتاب درسی روی تخته
    if (action === "CHANGE_SLIDE") {
      const { slideKey } = payload;
      const updated = await prisma.virtualClassroomSession.update({
        where: { id: sessionId },
        data: { activeSlide: slideKey },
      });
      return NextResponse.json({ success: true, session: updated });
    }

    // ۵. تغییر وضعیت ضبط جلسه و ذخیره خودکار در کتابخانه دیجیتال
    if (action === "TOGGLE_RECORD") {
      const current = await prisma.virtualClassroomSession.findUnique({
        where: { id: sessionId },
      });

      const nextRecordingState = !current?.isRecording;
      const updated = await prisma.virtualClassroomSession.update({
        where: { id: sessionId },
        data: { isRecording: nextRecordingState },
      });

      // در صورت پایان ضبط، انتقال خودکار ویدیو به کتابخانه دیجیتال داناتک
      if (!nextRecordingState) {
        try {
          await prisma.digitalLibraryResource.create({
            data: {
              title: `ویدیو کامل ضبط‌شده: ${current?.title}`,
              category: "VIDEO",
              gradeLevel: 12,
              major: "ریاضی و فیزیک",
              subjectName: "حسابان ۲",
              fileUrl: "/api/video/calculus-live-recording.mp4",
              fileSize: "148 MB",
              authorName: current?.teacherName || "استاد احسان محمدی",
              description: "فیلم جلسه آنلاین، مباحث قضیه رول، اکسترمم‌های نسبی و تحلیل تست‌های آزمون سراسری",
            },
          });
        } catch (libErr) {
          console.error("Failed to auto-archive recording to library:", libErr);
        }
      }

      return NextResponse.json({
        success: true,
        isRecording: nextRecordingState,
        archivedToLibrary: !nextRecordingState,
      });
    }

    return NextResponse.json({ success: false, error: "اکشن نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    console.error("Classroom API POST error:", error);
    return NextResponse.json({ success: false, error: "خطا در پردازش عملیات کلاس آنلاین" }, { status: 500 });
  }
}
