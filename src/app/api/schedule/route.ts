import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");

    // واکشی کلاس‌ها
    const classrooms = await prisma.classroom.findMany({
      select: { id: true, name: true, gradeLevel: true, major: true },
    });

    const activeClassId = classroomId || classrooms[0]?.id;

    if (!activeClassId) {
      return NextResponse.json({ periods: [], classrooms: [] });
    }

    // واکشی برنامه هفتگی کلاس
    const periods = await prisma.timetablePeriod.findMany({
      where: { classroomId: activeClassId },
      orderBy: [{ dayOfWeek: "asc" }, { periodIndex: "asc" }],
    });

    // واکشی امتحانات آینده به عنوان رویدادهای تقویم
    const exams = await prisma.exam.findMany({
      where: { classroomId: activeClassId },
      select: {
        id: true,
        title: true,
        startTime: true,
        durationMinutes: true,
      },
      take: 5,
    });

    // واکشی تکالیف با مهلت تحویل
    const assignments = await prisma.assignment.findMany({
      where: { classroomId: activeClassId },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
      take: 5,
    });

    const upcomingEvents = [
      ...exams.map((ex) => ({
        id: ex.id,
        title: `آزمون: ${ex.title}`,
        date: ex.startTime,
        type: "EXAM",
      })),
      ...assignments.map((asg) => ({
        id: asg.id,
        title: `مهلت تحویل تکلیف: ${asg.title}`,
        date: asg.dueDate,
        type: "ASSIGNMENT",
      })),
      {
        id: "ev-1",
        title: "جلسه عمومی اولیا و مربیان و تحویل کارنامه",
        date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        type: "EVENT",
      },
      {
        id: "ev-2",
        title: "آزمون شبیه‌ساز کنکور سراسری مرحله دوم (سمپاد)",
        date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        type: "EXAM",
      },
    ];

    // محاسبه زنگ جاری (Live active period)
    const now = new Date();
    // در تقویم میلادی: شنبه = 6، یکشنبه = 0، دوشنبه = 1، سه‌شنبه = 2، چهارشنبه = 3
    const jsDay = now.getDay();
    let timetableDayOfWeek = -1;
    if (jsDay === 6) timetableDayOfWeek = 0; // شنبه
    else if (jsDay === 0) timetableDayOfWeek = 1; // یکشنبه
    else if (jsDay === 1) timetableDayOfWeek = 2; // دوشنبه
    else if (jsDay === 2) timetableDayOfWeek = 3; // سه‌شنبه
    else if (jsDay === 3) timetableDayOfWeek = 4; // چهارشنبه

    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const todaysPeriods = periods.filter((p) => p.dayOfWeek === timetableDayOfWeek);
    const activePeriod = todaysPeriods.find(
      (p) => currentTimeStr >= p.startTime && currentTimeStr <= p.endTime
    ) || (todaysPeriods.length > 0 ? todaysPeriods[0] : null);

    return NextResponse.json({
      classroom: classrooms.find((c) => c.id === activeClassId),
      classrooms,
      periods,
      activePeriod,
      timetableDayOfWeek,
      currentTimeStr,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Timetable API error:", error);
    return NextResponse.json(
      { error: "خطا در واکشی برنامه هفتگی و تقویم." },
      { status: 500 }
    );
  }
}
