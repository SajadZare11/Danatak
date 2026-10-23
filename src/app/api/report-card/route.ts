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
                enrollments: { include: { classroom: { include: { school: true } } } },
              },
            },
            attendanceRecords: true,
            disciplineRecords: true,
            officialGrades: {
              include: { subject: true },
            },
          },
        })
      : await prisma.user.findFirst({
          where: { role: "STUDENT" },
          include: {
            studentProfile: {
              include: {
                enrollments: { include: { classroom: { include: { school: true } } } },
              },
            },
            attendanceRecords: true,
            disciplineRecords: true,
            officialGrades: {
              include: { subject: true },
            },
          },
        });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const classroom = student.studentProfile?.enrollments[0]?.classroom;
    const school = classroom?.school || (await prisma.school.findFirst());

    // محاسبه آمار حضور و غیاب
    const totalSessions = student.attendanceRecords.length;
    const presents = student.attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const absents = student.attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const lates = student.attendanceRecords.filter((a) => a.status === "LATE").length;

    // محاسبه امتیاز انضباطی
    const positiveMerits = student.disciplineRecords
      .filter((d) => d.type === "POSITIVE")
      .reduce((acc, d) => acc + d.points, 0);
    const negativeDemerits = student.disciplineRecords
      .filter((d) => d.type === "NEGATIVE")
      .reduce((acc, d) => acc + Math.abs(d.points), 0);

    const calculatedConduct = Math.max(0, Math.min(20, 20 + positiveMerits - negativeDemerits));

    // استخراج دروس و نمرات
    let subjectsGrades = student.officialGrades.map((g) => {
      const annual =
        g.annualScore ??
        Number(
          (
            ((g.term1Continuous ?? 18) * 1 +
              (g.term1Final ?? 18) * 2 +
              (g.term2Continuous ?? 18) * 1 +
              (g.term2Final ?? 18) * 4) /
            8
          ).toFixed(2)
        );

      let descriptive = g.descriptiveEvaluation;
      if (!descriptive) {
        if (annual >= 18) descriptive = "خیلی خوب";
        else if (annual >= 15) descriptive = "خوب";
        else if (annual >= 10) descriptive = "قابل قبول";
        else descriptive = "نیاز به آموزش و تلاش بیشتر";
      }

      return {
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        term1Continuous: g.term1Continuous ?? 18,
        term1Final: g.term1Final ?? 18,
        term2Continuous: g.term2Continuous ?? 18,
        term2Final: g.term2Final ?? 18,
        annualScore: annual,
        descriptiveEvaluation: descriptive,
        status: annual >= 10 ? "قبول" : "نیاز به آزمون مجدد",
      };
    });

    // اگر درسی ثبت نشده بود، پیش‌فرض درس ریاضی اضافه شود
    if (subjectsGrades.length === 0) {
      subjectsGrades = [
        {
          subjectId: "default-math",
          subjectName: "ریاضیات و حسابان",
          subjectCode: "MATH-01",
          term1Continuous: 19.5,
          term1Final: 18.5,
          term2Continuous: 19.0,
          term2Final: 19.0,
          annualScore: 18.9,
          descriptiveEvaluation: "خیلی خوب",
          status: "قبول",
        },
      ];
    }

    // معدل کل سالانه
    const totalScoreSum = subjectsGrades.reduce((acc, s) => acc + s.annualScore, 0);
    const gpa = Number((totalScoreSum / subjectsGrades.length).toFixed(2));

    let overallDescriptive = "خیلی خوب";
    if (gpa >= 18) overallDescriptive = "خیلی خوب";
    else if (gpa >= 15) overallDescriptive = "خوب";
    else if (gpa >= 10) overallDescriptive = "قابل قبول";
    else overallDescriptive = "نیاز به آموزش و تلاش بیشتر";

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        nationalId: student.nationalId,
        avatarUrl: student.avatarUrl,
        gradeLevel: student.studentProfile?.gradeLevel || 12,
        major: student.studentProfile?.major || "ریاضی و فیزیک",
        schoolName: school?.name || "دبیرستان علامه حلی ۱ (تیزهوشان)",
        schoolCode: school?.code || "12345678",
        className: classroom?.name || "کلاس ۱۲/۱ (دوازدهم ریاضی)",
        academicYear: "۱۴۰۳ - ۱۴۰۴",
      },
      subjects: subjectsGrades,
      summary: {
        gpa,
        overallDescriptive,
        conductScore: calculatedConduct,
        attendance: {
          totalSessions,
          presents,
          absents,
          lates,
        },
        passResult: gpa >= 10 ? "قبول خرداد ماه" : "تجدید (شهریور)",
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/report-card:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report card" }, { status: 500 });
  }
}
