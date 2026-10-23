import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    let student = studentId
      ? await prisma.user.findUnique({
          where: { id: studentId },
          include: {
            studentProfile: {
              include: {
                masteryRecords: { include: { topic: true } },
                enrollments: { include: { classroom: true } },
              },
            },
            studyPlansReceived: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : await prisma.user.findFirst({
          where: { role: "STUDENT" },
          include: {
            studentProfile: {
              include: {
                masteryRecords: { include: { topic: true } },
                enrollments: { include: { classroom: true } },
              },
            },
            studyPlansReceived: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const masteries = student.studentProfile?.masteryRecords || [];
    const weakTopics = masteries
      .filter((m) => m.masteryPercentage < 65)
      .map((m) => ({ id: m.topicId, title: m.topic.title, percentage: m.masteryPercentage }));

    const plan = student.studyPlansReceived && student.studyPlansReceived.length > 0 ? student.studyPlansReceived[0] : null;

    let schedule = [];
    try {
      if (plan?.scheduleJson) {
        schedule = JSON.parse(plan.scheduleJson);
      }
    } catch {
      schedule = [];
    }

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        nationalId: student.nationalId,
        avatarUrl: student.avatarUrl,
        gradeLevel: student.studentProfile?.gradeLevel || 12,
        major: student.studentProfile?.major || "ریاضی و فیزیک",
        className: student.studentProfile?.enrollments[0]?.classroom?.name || "کلاس ۱۲/۱",
      },
      weakTopics,
      plan: plan
        ? {
            id: plan.id,
            isApproved: plan.isApproved,
            counselorNote: plan.counselorNote,
            createdAtFa: new Date(plan.createdAt).toLocaleDateString("fa-IR"),
            schedule,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error in GET /api/counselor/plan:", error);
    return NextResponse.json({ error: error.message || "Failed to load study plan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, action, schedule, counselorNote } = body as {
      studentId: string;
      action?: "GENERATE_AI" | "SAVE";
      schedule?: any[];
      counselorNote?: string;
    };

    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            masteryRecords: { include: { topic: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const counselor = await prisma.user.findFirst({
      where: { role: "COUNSELOR" },
    });
    const counselorId = counselor?.id || student.id;

    let finalSchedule = schedule || [];
    let finalNote = counselorNote || "";

    if (action === "GENERATE_AI") {
      // تدوین هوشمند بر اساس نقاط ضعف رادار تسلط
      const masteries = student.studentProfile?.masteryRecords || [];
      const weakTopics = masteries.filter((m) => m.masteryPercentage < 65);
      const topWeakTopic = weakTopics[0]?.topic?.title || "مشتق توابع کسری";

      finalSchedule = [
        {
          day: "شنبه",
          dateFa: "شنبه",
          slots: [
            { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "حسابان و ریاضی ۳", topic: `${topWeakTopic} (تمرین جبرانی)`, targetMinutes: 90, targetTests: 30, isFocusTopic: true },
            { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "فیزیک ۳", topic: "حرکت‌شناسی و سرعت متغیر", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
          ],
        },
        {
          day: "یکشنبه",
          dateFa: "یکشنبه",
          slots: [
            { time: "۱۶:۰۰ - ۱۷:۱۵", subject: "هندسه ۳", topic: "ماتریس و ضرب ماتریس‌ها", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
            { time: "۱۷:۴۵ - ۱۹:۰۰", subject: "شیمی ۳", topic: "مسائل استوکیومتری و آنتالپی", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
          ],
        },
        {
          day: "دوشنبه",
          dateFa: "دوشنبه",
          slots: [
            { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "حسابان و ریاضی ۳", topic: "تست‌های زمان‌دار مبحث مشتق", targetMinutes: 90, targetTests: 35, isFocusTopic: true },
            { time: "۱۸:۰۰ - ۱۹:۰۰", subject: "ادبیات فارسی ۳", topic: "قرابت و دستور زبان", targetMinutes: 60, targetTests: 25, isFocusTopic: false },
          ],
        },
        {
          day: "سه‌شنبه",
          dateFa: "سه‌شنبه",
          slots: [
            { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "فیزیک ۳", topic: "تست‌های دینامیک و اصطکاک", targetMinutes: 90, targetTests: 25, isFocusTopic: false },
            { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "ریاضیات پایه", topic: "مرور جعبه لایتنر و نکات حفظی", targetMinutes: 75, targetTests: 20, isFocusTopic: true },
          ],
        },
        {
          day: "چهارشنبه",
          dateFa: "چهارشنبه",
          slots: [
            { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "گسسته و جبر", topic: "گراف و نظریه اعداد", targetMinutes: 90, targetTests: 25, isFocusTopic: false },
            { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "زبان انگلیسی ۳", topic: "کلوزتست و ریدینگ کنکور", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
          ],
        },
        {
          day: "پنجشنبه",
          dateFa: "پنجشنبه",
          slots: [
            { time: "۰۸:۳۰ - ۱۱:۳۰", subject: "آزمون شبیه‌ساز کنکور", topic: "دفترچه تخصصی ریاضی فیزیک", targetMinutes: 180, targetTests: 80, isFocusTopic: false },
            { time: "۱۶:۰۰ - ۱۸:۰۰", subject: "تحلیل آزمون و غلط‌ها", topic: "ورود اشتباهات به دفترچه هوشمند", targetMinutes: 120, targetTests: 0, isFocusTopic: true },
          ],
        },
        {
          day: "جمعه",
          dateFa: "جمعه",
          slots: [
            { time: "۱۰:۰۰ - ۱۱:۳۰", subject: "جمع‌بندی هفتگی", topic: "مرور فلش‌کارت‌های دوره‌ای", targetMinutes: 90, targetTests: 25, isFocusTopic: false },
            { time: "عصر جمعه", subject: "استراحت و خانواده", topic: "تجدید قوا برای هفته آینده", targetMinutes: 60, targetTests: 0, isFocusTopic: false },
          ],
        },
      ];

      finalNote = `برنامه هوشمند هفتگی بر اساس ضعف در مبحث «${topWeakTopic}» تنظیم شد. حتماً سهم تست‌های روزانه را ثبت کن. موفق باشی!`;
    }

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const savedPlan = await prisma.studyPlan.create({
      data: {
        counselorId,
        studentId: student.id,
        weekStartDate: startOfWeek,
        weekEndDate: endOfWeek,
        scheduleJson: JSON.stringify(finalSchedule),
        counselorNote: finalNote,
        isApproved: true,
      },
    });

    // ثبت لاگ پیامک به ولی و دانش‌آموز
    await prisma.smsLog.create({
      data: {
        recipientPhone: student.phoneNumber || "09122222222",
        recipientName: student.fullName,
        studentId: student.id,
        type: "STUDY_PLAN_READY",
        message: `دبیرستان علامه حلی ۱: برنامه هفتگی مطالعاتی شما توسط مشاور ارشد (خانم صابری) تایید و در میز کار دانش‌آموز بارگذاری گردید.`,
        status: "DELIVERED",
        providerRef: `MAGFA-${Math.floor(10000 + Math.random() * 90000)}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "برنامه مطالعاتی هفتگی با موفقیت ثبت، تایید و به کارتابل دانش‌آموز ارسال گردید.",
      plan: {
        id: savedPlan.id,
        isApproved: savedPlan.isApproved,
        counselorNote: savedPlan.counselorNote,
        schedule: finalSchedule,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/counselor/plan:", error);
    return NextResponse.json({ error: error.message || "Failed to process study plan" }, { status: 500 });
  }
}
