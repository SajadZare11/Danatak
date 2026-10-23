import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // ANNOUNCEMENT | QA | PRIVATE_DM | all

    // واکشی اعلانات رسمی مدرسه
    const announcements = await prisma.channelMessage.findMany({
      where: { type: "ANNOUNCEMENT" },
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
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    // واکشی پرسش و پاسخ‌های تالار رفع اشکال
    const questions = await prisma.channelMessage.findMany({
      where: { type: "QA_QUESTION" },
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
      orderBy: { createdAt: "desc" },
    });

    const answers = await prisma.channelMessage.findMany({
      where: { type: "QA_ANSWER" },
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
      orderBy: { createdAt: "asc" },
    });

    // الحاق پاسخ‌ها به هر پرسش
    const qaThreads = questions.map((q) => ({
      ...q,
      answers: answers.filter((a) => a.parentId === q.id),
    }));

    // واکشی پیام‌های خصوصی
    const privateDms = await prisma.channelMessage.findMany({
      where: { type: "PRIVATE_DM" },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      announcements,
      qaThreads,
      privateDms,
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "خطا در واکشی پیام‌ها و اعلانات." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, type, title, content, targetRole, subjectId, parentId, isPinned } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { error: "شناسه فرستنده و متن پیام الزامی است." },
        { status: 400 }
      );
    }

    const newMessage = await prisma.channelMessage.create({
      data: {
        senderId,
        type: type || "ANNOUNCEMENT",
        title: title || null,
        content,
        targetRole: targetRole || "ALL",
        subjectId: subjectId || null,
        parentId: parentId || null,
        isPinned: !!isPinned,
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
      message: newMessage,
    });
  } catch (error) {
    console.error("Post message API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت پیام جدید." },
      { status: 500 }
    );
  }
}
