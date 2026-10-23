import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const teacherId = searchParams.get("teacherId");
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status"); // SCHEDULED, LIVE, ENDED

    const where: any = {};
    if (status) where.status = status;
    if (classroomId) where.classroomId = classroomId;
    if (teacherId) where.hostTeacherId = teacherId;

    // اگر برای دانش‌آموز فیلتر شده باشد، جلسات مربوط به کلاس‌های ثبت‌نامی او را بازیابی می‌کنیم
    if (studentId) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: studentId },
        include: { enrollments: true },
      });
      const classroomIds = studentProfile?.enrollments.map((e) => e.classroomId) || [];

      where.classroomId = { in: classroomIds };
    }

    const sessions = await prisma.liveClassSession.findMany({
      where,
      include: {
        hostTeacher: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
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
        _count: {
          select: {
            participants: true,
            chats: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // ابتدا کلاس‌های LIVE و SCHEDULED
        { scheduledStartTime: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست جلسات کلاس آنلاین", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      classroomId,
      hostTeacherId,
      title,
      subjectTitle = "حسابان و ریاضی ۳",
      scheduledStartTime,
      isInstant = false,
    } = body;

    let targetTeacherId = hostTeacherId;
    if (!targetTeacherId) {
      const defaultTeacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
      targetTeacherId = defaultTeacher?.id;
    }

    if (!targetTeacherId) {
      return NextResponse.json(
        { success: false, error: "شناسه دبیر برگزارکننده یافت نشد." },
        { status: 400 }
      );
    }

    let targetClassroomId = classroomId;
    if (!targetClassroomId) {
      const defaultClass = await prisma.classroom.findFirst();
      targetClassroomId = defaultClass?.id;
    }

    if (!targetClassroomId) {
      return NextResponse.json(
        { success: false, error: "شناسه کلاس درس الزامی است." },
        { status: 400 }
      );
    }

    const now = new Date();
    const isLiveNow = Boolean(isInstant);

    const session = await prisma.liveClassSession.create({
      data: {
        classroomId: targetClassroomId,
        hostTeacherId: targetTeacherId,
        title: title || `کلاس آنلاین: ${subjectTitle}`,
        subjectTitle,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : now,
        actualStartTime: isLiveNow ? now : null,
        status: isLiveNow ? "LIVE" : "SCHEDULED",
      },
      include: {
        hostTeacher: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        classroom: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isLiveNow
        ? "کلاس آنلاین فوری با موفقیت ایجاد و آغاز شد."
        : "جلسه کلاس آنلاین زمان‌بندی شد.",
      session,
    });
  } catch (error: any) {
    console.error("Error creating live session:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد جلسه کلاس آنلاین", details: error?.message },
      { status: 500 }
    );
  }
}
