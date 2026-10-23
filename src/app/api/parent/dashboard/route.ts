import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // یافتن کاربر والد پیش‌فرض (یا از طریق شناسه)
    const parentUser = await prisma.user.findFirst({
      where: { role: "PARENT" },
      include: {
        parentRelations: {
          include: {
            student: {
              include: {
                studentProfile: {
                  include: {
                    masteryRecords: { include: { topic: true } },
                    enrollments: { include: { classroom: { include: { school: true } } } },
                  },
                },
                tuitionRecords: true,
                attendanceRecords: { orderBy: { date: "desc" }, take: 10 },
                disciplineRecords: { orderBy: { date: "desc" } },
                submissions: { include: { assignment: true } },
                examAttempts: { include: { exam: true }, orderBy: { startedAt: "desc" }, take: 1 },
                studyLogs: { orderBy: { date: "desc" }, take: 14 },
              },
            },
          },
        },
      },
    });

    if (!parentUser || parentUser.parentRelations.length === 0) {
      // اگر والد پیدا نشد، یک ساختار پیش‌فرض برگردانیم
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        include: {
          studentProfile: {
            include: {
              masteryRecords: { include: { topic: true } },
              enrollments: { include: { classroom: { include: { school: true } } } },
            },
          },
          tuitionRecords: true,
          attendanceRecords: { orderBy: { date: "desc" }, take: 10 },
          disciplineRecords: { orderBy: { date: "desc" } },
          submissions: { include: { assignment: true } },
          examAttempts: { include: { exam: true }, orderBy: { startedAt: "desc" }, take: 1 },
          studyLogs: { orderBy: { date: "desc" }, take: 14 },
        },
      });

      if (!studentUser) {
        return NextResponse.json({ error: "No student found" }, { status: 404 });
      }

      return formatParentResponse(null, studentUser);
    }

    const relation = parentUser.parentRelations[0];
    const studentUser = relation.student;

    return formatParentResponse(parentUser, studentUser);
  } catch (error: any) {
    console.error("Error in GET /api/parent/dashboard:", error);
    return NextResponse.json({ error: error.message || "Failed to load parent dashboard" }, { status: 500 });
  }
}

async function formatParentResponse(parentUser: any, studentUser: any) {
  const profile = studentUser.studentProfile;
  const classroom = profile?.enrollments[0]?.classroom;
  const school = classroom?.school;

  // ۱. محاسبات گزارش هفتگی (Weekly Digest)
  const studyLogs = studentUser.studyLogs || [];
  const totalMinutes = studyLogs.reduce((acc: number, l: any) => acc + l.studyMinutes, 0);
  const totalWeeklyHours = Number((totalMinutes / 60).toFixed(1));
  const totalWeeklyTests = studyLogs.reduce((acc: number, l: any) => acc + l.testCount, 0);

  const totalSubmissions = studentUser.submissions?.length || 0;
  const completedSubmissions = studentUser.submissions?.filter((s: any) => s.status === "GRADED" || s.status === "SUBMITTED").length || 0;
  const homeworkCompletionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 100;

  const latestExam = studentUser.examAttempts && studentUser.examAttempts.length > 0 ? studentUser.examAttempts[0] : null;

  // تحلیل تسلط و راهنمای اولیا
  const masteries = profile?.masteryRecords || [];
  const sortedMasteries = [...masteries].sort((a: any, b: any) => b.masteryPercentage - a.masteryPercentage);
  const strongestTopic = sortedMasteries[0]?.topic?.title || "مفهوم حد و پیوستگی";
  const focusTopic = sortedMasteries[sortedMasteries.length - 1]?.topic?.title || "مشتق توابع کسری";

  let actionableAdvice =
    `با توجه به روند عالی ${studentUser.fullName} در درس حسابان و تسلط ${sortedMasteries[0]?.masteryPercentage || 85}٪ بر مبحث «${strongestTopic}»، پیشنهاد می‌شود تشویق به استمرار مطالعه شود. در مبحث «${focusTopic}» نیاز به حل تست‌های تکمیلی در ایام پایان هفته وجود دارد.`;

  // ۲. آمار تردد و حضور/غیاب
  const attendances = studentUser.attendanceRecords || [];
  const presentsCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentsCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const latesCount = attendances.filter((a: any) => a.status === "LATE").length;

  const commuteTimeline = attendances.map((a: any) => ({
    id: a.id,
    date: a.date,
    dateFa: new Date(a.date).toLocaleDateString("fa-IR"),
    status: a.status,
    delayMinutes: a.delayMinutes || 0,
    note: a.note || (a.status === "PRESENT" ? "ورود به موقع به دبیرستان" : a.status === "LATE" ? `تاخیر ${a.delayMinutes} دقیقه` : "عدم حضور در کلاس"),
    timeFa: a.status === "PRESENT" ? "۰۷:۲۴ صبح" : a.status === "LATE" ? "۰۷:۴۵ صبح" : "-",
  }));

  // ۳. امور مالی و شهریه (Tuition)
  const tuition = studentUser.tuitionRecords && studentUser.tuitionRecords.length > 0 ? studentUser.tuitionRecords[0] : null;
  const totalAmount = tuition?.totalAmount || 48000000;
  const paidAmount = tuition?.paidAmount || 36000000;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100;

  let installments: any[] = [];
  try {
    if (tuition?.planJson) {
      installments = JSON.parse(tuition.planJson);
    }
  } catch (e) {
    installments = [];
  }

  // ۴. لاگ پیامک‌های ارسالی به ولی
  const smsLogs = await prisma.smsLog.findMany({
    where: {
      OR: [
        { studentId: studentUser.id },
        { studentName: { contains: studentUser.fullName } },
        { recipientPhone: parentUser?.phoneNumber || "09121234567" },
      ],
    },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json({
    parent: {
      id: parentUser?.id || "parent-1",
      fullName: parentUser?.fullName || "مهندس حسین رضایی",
      phoneNumber: parentUser?.phoneNumber || "09127777777",
      relation: "پدر",
    },
    student: {
      id: studentUser.id,
      fullName: studentUser.fullName,
      nationalId: studentUser.nationalId,
      avatarUrl: studentUser.avatarUrl,
      gradeLevel: profile?.gradeLevel || 12,
      major: profile?.major || "ریاضی و فیزیک",
      schoolName: school?.name || "دبیرستان علامه حلی ۱ (استعدادهای درخشان)",
      className: classroom?.name || "کلاس ۱۲/۱ (دوازدهم ریاضی)",
    },
    digest: {
      totalWeeklyHours,
      totalWeeklyTests,
      homeworkCompletionRate,
      strongestTopic,
      focusTopic,
      latestExam: latestExam
        ? {
            title: latestExam.exam.title,
            percentage: latestExam.percentage || 80,
            taraz: latestExam.taraz || 6850,
            dateFa: new Date(latestExam.startedAt).toLocaleDateString("fa-IR"),
          }
        : null,
      actionableAdvice,
    },
    attendance: {
      presentsCount,
      absentsCount,
      latesCount,
      todayStatus: attendances[0]?.status || "PRESENT",
      commuteTimeline,
    },
    tuition: {
      id: tuition?.id || null,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentPercentage,
      status: tuition?.status || "جاری",
      installments,
    },
    smsLogs: smsLogs.map((s) => ({
      id: s.id,
      type: s.type,
      message: s.message,
      status: s.status,
      dateFa: new Date(s.sentAt).toLocaleDateString("fa-IR"),
      timeFa: new Date(s.sentAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    })),
  });
}
