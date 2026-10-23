import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: دریافت لیست حضور و غیاب برای یک کلاس و تاریخ مشخص
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!classroomId) {
      // اگر کلاسی مشخص نشده بود، اولین کلاس را برمی‌گردانیم
      const firstClass = await prisma.classroom.findFirst();
      if (!firstClass) {
        return NextResponse.json({ error: "No classroom found" }, { status: 404 });
      }
      return NextResponse.redirect(new URL(`/api/attendance?classroomId=${firstClass.id}`, req.url));
    }

    // تاریخ انتخابی (یا امروز)
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // دریافت دانش‌آموزان ثبت‌نام‌شده در کلاس
    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { student: { user: { fullName: "asc" } } },
    });

    // دریافت سوابق حضور و غیاب امروز این کلاس
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: {
        classroomId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // تلفیق دانش‌آموزان با وضعیت حضورشان
    const studentsWithAttendance = enrollments.map((enr) => {
      const record = todayRecords.find((r) => r.studentId === enr.student.user.id);
      return {
        id: enr.student.user.id,
        studentProfileId: enr.student.id,
        fullName: enr.student.user.fullName,
        nationalId: enr.student.user.nationalId,
        avatarUrl: enr.student.user.avatarUrl,
        status: record ? record.status : "NOT_MARKED", // PRESENT, ABSENT, LATE, NOT_MARKED
        delayMinutes: record?.delayMinutes || 0,
        note: record?.note || "",
        recordId: record?.id || null,
      };
    });

    // آمار کلاسی
    const totalStudents = studentsWithAttendance.length;
    const presentCount = studentsWithAttendance.filter((s) => s.status === "PRESENT").length;
    const absentCount = studentsWithAttendance.filter((s) => s.status === "ABSENT").length;
    const lateCount = studentsWithAttendance.filter((s) => s.status === "LATE").length;
    const notMarkedCount = studentsWithAttendance.filter((s) => s.status === "NOT_MARKED").length;
    const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

    // تاریخچه جلسات اخیر کلاس (۷ روز اخیر)
    const recentRecords = await prisma.attendanceRecord.findMany({
      where: { classroomId },
      orderBy: { date: "desc" },
      take: 30,
    });

    // گروه‌بندی تاریخچه بر اساس تاریخ
    const historyMap = new Map<string, { date: string; present: number; absent: number; late: number }>();
    for (const r of recentRecords) {
      const dKey = r.date.toISOString().split("T")[0];
      if (!historyMap.has(dKey)) {
        historyMap.set(dKey, { date: dKey, present: 0, absent: 0, late: 0 });
      }
      const entry = historyMap.get(dKey)!;
      if (r.status === "PRESENT") entry.present++;
      else if (r.status === "ABSENT") entry.absent++;
      else if (r.status === "LATE") entry.late++;
    }

    return NextResponse.json({
      classroomId,
      date: startOfDay.toISOString(),
      stats: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        notMarkedCount,
        attendanceRate,
      },
      students: studentsWithAttendance,
      history: Array.from(historyMap.values()).slice(0, 7),
    });
  } catch (error: any) {
    console.error("Error in GET /api/attendance:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST: ثبت و ذخیره حضور و غیاب کلاسی (تکی یا گروهی)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classroomId, date, records } = body as {
      classroomId: string;
      date?: string;
      records: Array<{
        studentId: string;
        status: "PRESENT" | "ABSENT" | "LATE";
        delayMinutes?: number;
        note?: string;
      }>;
    };

    if (!classroomId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing classroomId or records array" }, { status: 400 });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // برای هر دانش‌آموز رکورد ثبت یا به‌روزرسانی می‌شود
    for (const rec of records) {
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          classroomId,
          studentId: rec.studentId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existing) {
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status: rec.status,
            delayMinutes: rec.delayMinutes || 0,
            note: rec.note || "",
            date: targetDate,
          },
        });
      } else {
        await prisma.attendanceRecord.create({
          data: {
            classroomId,
            studentId: rec.studentId,
            status: rec.status,
            delayMinutes: rec.delayMinutes || 0,
            note: rec.note || "",
            date: targetDate,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `حضور و غیاب ${records.length} دانش‌آموز با موفقیت ذخیره شد.`,
      updatedCount: records.length,
    });
  } catch (error: any) {
    console.error("Error in POST /api/attendance:", error);
    return NextResponse.json({ error: error.message || "Failed to save attendance" }, { status: 500 });
  }
}
