import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const onlyQuestions = searchParams.get("onlyQuestions") === "true";

    const where: any = { sessionId };
    if (onlyQuestions) {
      where.isQuestion = true;
    }

    const chats = await prisma.liveSessionChat.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { sentAt: "asc" },
      take: 150,
    });

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error: any) {
    console.error("Error fetching live chats:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بارگذاری پیام‌های کلاس", details: error?.message },
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
    const { senderId, messageText, isQuestion = false } = body;

    if (!messageText || !messageText.trim()) {
      return NextResponse.json(
        { success: false, error: "متن پیام نمی‌تواند خالی باشد." },
        { status: 400 }
      );
    }

    let finalSenderId = senderId;
    if (!finalSenderId) {
      const defaultUser = await prisma.user.findFirst();
      finalSenderId = defaultUser?.id;
    }

    const sender = await prisma.user.findUnique({
      where: { id: finalSenderId },
      select: { role: true, fullName: true },
    });

    const isTeacher = sender?.role === "TEACHER" || sender?.role === "PRINCIPAL";

    const chat = await prisma.liveSessionChat.create({
      data: {
        sessionId,
        senderId: finalSenderId,
        messageText: messageText.trim(),
        isTeacher,
        isQuestion: Boolean(isQuestion),
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error: any) {
    console.error("Error sending live chat message:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ارسال پیام چت", details: error?.message },
      { status: 500 }
    );
  }
}
