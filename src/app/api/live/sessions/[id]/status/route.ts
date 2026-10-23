import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, whiteboardSnapshotJson, boardPdfUrl, aiRecapJson } = body;

    const existingSession = await prisma.liveClassSession.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        participants: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: "جلسه کلاس آنلاین یافت نشد." },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "LIVE" && !existingSession.actualStartTime) {
        updateData.actualStartTime = new Date();
      }
      if (status === "ENDED") {
        updateData.actualEndTime = new Date();
      }
    }

    if (whiteboardSnapshotJson !== undefined) {
      updateData.whiteboardSnapshotJson = whiteboardSnapshotJson;
    }
    if (boardPdfUrl !== undefined) {
      updateData.boardPdfUrl = boardPdfUrl;
    }
    if (aiRecapJson !== undefined) {
      updateData.aiRecapJson = aiRecapJson;
    }

    const updated = await prisma.liveClassSession.update({
      where: { id },
      data: updateData,
    });

    // پردازش هوشمند حضور و غیاب در صورت پایان جلسه (Automatic Attendance Calculation)
    let attendanceSummary: any = null;
    if (status === "ENDED") {
      const startTime = existingSession.actualStartTime || existingSession.createdAt;
      const endTime = updateData.actualEndTime || new Date();
      const actualDurationSec = Math.max(
        60,
        Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      );

      // معیار سنجش: زمان واقعی سپری‌شده، با سقف حداقل ۳۰۰ ثانیه برای محاسبه نسبت عادلانه
      const benchmarkDurationSec = Math.max(actualDurationSec, 180);

      const enrolledUsers: { id: string; fullName: string }[] = [];

      // استخراج دانش‌آموزان کلاس از طریق Enrollments
      existingSession.classroom?.enrollments?.forEach((en) => {
        if (en.student?.user) {
          enrolledUsers.push({
            id: en.student.user.id,
            fullName: en.student.user.fullName,
          });
        }
      });

      // افزودن هر شرکت‌کننده‌ای که خارج از ثبت‌نام وارد شده بود
      existingSession.participants?.forEach((p) => {
        if (!enrolledUsers.some((u) => u.id === p.studentId) && p.student) {
          enrolledUsers.push({
            id: p.student.id,
            fullName: p.student.fullName,
          });
        }
      });

      const recordsCreated: any[] = [];

      for (const enrolled of enrolledUsers) {
        const participant = existingSession.participants?.find(
          (p) => p.studentId === enrolled.id
        );

        const totalPresent = participant?.totalPresentSeconds || 0;
        const presenceRatio = totalPresent / benchmarkDurationSec;

        let attendanceStatus = "ABSENT";
        let delayMinutes = 0;

        // قانون حضور بالای ۷۰٪ کل جلسه
        if (presenceRatio >= 0.7) {
          attendanceStatus = "PRESENT";
        } else if (presenceRatio >= 0.3) {
          attendanceStatus = "LATE";
          delayMinutes = Math.max(
            1,
            Math.round((benchmarkDurationSec - totalPresent) / 60)
          );
        } else {
          attendanceStatus = "ABSENT";
        }

        // ۱. به‌روزرسانی جدول شرکت‌کنندگان کلاس لایو
        await prisma.liveSessionParticipant.upsert({
          where: { sessionId_studentId: { sessionId: id, studentId: enrolled.id } },
          create: {
            sessionId: id,
            studentId: enrolled.id,
            totalPresentSeconds: totalPresent,
            attendanceStatus,
          },
          update: {
            attendanceStatus,
          },
        });

        // ۲. ثبت در کارنامه حضور و غیاب رسمی مدرسه
        const attendanceRecord = await prisma.attendanceRecord.create({
          data: {
            classroomId: existingSession.classroomId,
            studentId: enrolled.id,
            date: new Date(),
            status: attendanceStatus,
            delayMinutes,
            note: `ثبت خودکار از کلاس آنلاین: «${existingSession.title}» - مدت حضور: ${Math.floor(
              totalPresent / 60
            )} دقیقه از ${Math.floor(benchmarkDurationSec / 60)} دقیقه (${Math.round(
              presenceRatio * 100
            )}٪)`,
          },
        });

        recordsCreated.push({
          studentId: enrolled.id,
          studentName: enrolled.fullName,
          totalPresentSeconds: totalPresent,
          presenceRatio: Math.round(presenceRatio * 100),
          status: attendanceStatus,
          delayMinutes,
        });
      }

      attendanceSummary = {
        totalEnrolled: enrolledUsers.length,
        presentCount: recordsCreated.filter((r) => r.status === "PRESENT").length,
        lateCount: recordsCreated.filter((r) => r.status === "LATE").length,
        absentCount: recordsCreated.filter((r) => r.status === "ABSENT").length,
        records: recordsCreated,
      };
    }

    return NextResponse.json({
      success: true,
      message: `وضعیت جلسه به ${status || "به‌روزرسانی شده"} تغییر یافت.`,
      session: updated,
      attendanceSummary,
    });
  } catch (error: any) {
    console.error("Error updating live session status:", error);
    return NextResponse.json(
      { success: false, error: "خطا در تغییر وضعیت جلسه کلاس آنلاین", details: error?.message },
      { status: 500 }
    );
  }
}
