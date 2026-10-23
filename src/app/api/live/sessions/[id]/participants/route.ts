import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const participants = await prisma.liveSessionParticipant.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            nationalId: true,
          },
        },
      },
      orderBy: [
        { handRaised: "desc" }, // ابتدا کسانی که دست بلند کرده‌اند
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      participants,
    });
  } catch (error: any) {
    console.error("Error fetching live session participants:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست حاضرین کلاس", details: error?.message },
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
    const body = await req.json();
    const { action, studentId, micAllowed, boardAllowed, addedSeconds = 15 } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "شناسه دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    // ۱. اکشن دست بلند کردن دانش‌آموز (Hand-Raise)
    if (action === "toggle_hand") {
      const existing = await prisma.liveSessionParticipant.findUnique({
        where: {
          sessionId_studentId: { sessionId, studentId },
        },
      });

      const newHandState = !existing?.handRaised;
      const updated = await prisma.liveSessionParticipant.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        create: {
          sessionId,
          studentId,
          handRaised: true,
          handRaisedAt: new Date(),
        },
        update: {
          handRaised: newHandState,
          handRaisedAt: newHandState ? new Date() : null,
        },
      });

      return NextResponse.json({
        success: true,
        handRaised: updated.handRaised,
        message: updated.handRaised ? "دست شما برای اجازه صحبت بلند شد ✋" : "دست پایین آمد",
        participant: updated,
      });
    }

    // ۲. اکشن فعال‌سازی / بستن میکروفون دانش‌آموز توسط دبیر (Teacher Permission)
    if (action === "set_mic") {
      const updated = await prisma.liveSessionParticipant.update({
        where: { sessionId_studentId: { sessionId, studentId } },
        data: {
          micAllowed: Boolean(micAllowed),
          // اگر میکروفون باز شد، دست پایین می‌آید
          ...(micAllowed ? { handRaised: false, handRaisedAt: null } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        message: micAllowed ? "دسترسی میکروفون به دانش‌آموز اعطا شد 🎙️" : "میکروفون بسته شد",
        participant: updated,
      });
    }

    // ۳. اکشن اعطای قلم نوری تخته‌سیاه به دانش‌آموز (Whiteboard Permission)
    if (action === "set_board") {
      const updated = await prisma.liveSessionParticipant.update({
        where: { sessionId_studentId: { sessionId, studentId } },
        data: {
          boardAllowed: Boolean(boardAllowed),
        },
      });

      return NextResponse.json({
        success: true,
        message: boardAllowed ? "قلم تخته‌سیاه به دانش‌آموز تحویل داده شد ✏️" : "دسترسی نوشتن تخته پس گرفته شد",
        participant: updated,
      });
    }

    // ۴. ضربان حضور زنده در کلاس (Live Attendance Heartbeat)
    if (action === "heartbeat") {
      const updated = await prisma.liveSessionParticipant.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        create: {
          sessionId,
          studentId,
          joinedAt: new Date(),
          totalPresentSeconds: Number(addedSeconds) || 15,
        },
        update: {
          totalPresentSeconds: { increment: Number(addedSeconds) || 15 },
        },
      });

      return NextResponse.json({
        success: true,
        totalPresentSeconds: updated.totalPresentSeconds,
      });
    }

    return NextResponse.json(
      { success: false, error: "اکشن نامعتبر است." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error managing live session participant:", error);
    return NextResponse.json(
      { success: false, error: "خطا در مدیریت شرکت‌کننده کلاس", details: error?.message },
      { status: 500 }
    );
  }
}
