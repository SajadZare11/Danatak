import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const session = await prisma.liveClassSession.findUnique({
      where: { id },
      include: {
        hostTeacher: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phoneNumber: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            major: true,
          },
        },
        participants: {
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
          orderBy: { joinedAt: "asc" },
        },
        chats: {
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
          take: 100,
        },
        quizzes: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "جلسه کلاس آنلاین یافت نشد." },
        { status: 404 }
      );
    }

    // اگر دانش‌آموز وارد کلاس شده باشد و هنوز ثبت نشده، او را به لیست شرکت‌کنندگان اضافه می‌کنیم
    if (studentId) {
      const existingParticipant = await prisma.liveSessionParticipant.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: id,
            studentId,
          },
        },
      });

      if (!existingParticipant) {
        await prisma.liveSessionParticipant.create({
          data: {
            sessionId: id,
            studentId,
            joinedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("Error fetching live session details:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت جزئیات کلاس آنلاین", details: error?.message },
      { status: 500 }
    );
  }
}
