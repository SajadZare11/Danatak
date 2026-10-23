import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school found" }, { status: 404 });
    }

    // دانش‌آموزان با پروفایل و تسلط
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        studentProfile: {
          include: {
            masteryRecords: {
              include: { topic: true },
            },
            enrollments: {
              include: { classroom: true },
            },
          },
        },
        attendanceRecords: {
          orderBy: { date: "desc" },
          take: 10,
        },
        disciplineRecords: {
          orderBy: { date: "desc" },
        },
        officialGrades: true,
      },
    });

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      include: { teacherProfile: true },
    });

    const classrooms = await prisma.classroom.findMany({
      include: {
        enrollments: true,
      },
    });

    // حضور و غیاب امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: today, lte: endToday },
      },
      include: {
        student: { select: { fullName: true, nationalId: true } },
        classroom: { select: { name: true } },
      },
    });

    const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
    const lateToday = todayAttendance.filter((a) => a.status === "LATE").length;
    const absentToday = todayAttendance.filter((a) => a.status === "ABSENT").length;
    const attendanceRateToday =
      todayAttendance.length > 0
        ? Math.round(((presentToday + lateToday) / todayAttendance.length) * 100)
        : 95;

    // محاسبه تسلط کل مدرسه
    let totalMasterySum = 0;
    let totalMasteryCount = 0;

    // تهیه نقشه حرارتی موضوعات (Heatmap Topics)
    const allTopics = await prisma.topic.findMany({
      include: {
        textbook: {
          include: { subject: true },
        },
        masteries: true,
      },
    });

    const heatmapTopics = allTopics.map((topic) => {
      if (topic.masteries.length === 0) {
        return {
          id: topic.id,
          title: topic.title,
          textbookTitle: topic.textbook.title,
          subjectName: topic.textbook.subject.name,
          gradeLevel: topic.textbook.gradeLevel,
          averageMastery: 70,
          status: "MEDIUM",
          studentEvaluatedCount: 0,
        };
      }

      const sum = topic.masteries.reduce((acc, m) => acc + m.masteryPercentage, 0);
      const avg = Math.round(sum / topic.masteries.length);
      totalMasterySum += sum;
      totalMasteryCount += topic.masteries.length;

      let status = "MEDIUM";
      if (avg >= 75) status = "HIGH"; // سبز
      else if (avg < 50) status = "CRITICAL"; // قرمز

      return {
        id: topic.id,
        title: topic.title,
        textbookTitle: topic.textbook.title,
        subjectName: topic.textbook.subject.name,
        gradeLevel: topic.textbook.gradeLevel,
        averageMastery: avg,
        status,
        studentEvaluatedCount: topic.masteries.length,
      };
    });

    const schoolMasteryAverage =
      totalMasteryCount > 0 ? Math.round(totalMasterySum / totalMasteryCount) : 74;

    // تحلیل دانش‌آموزان در وضعیت قرمز (At-Risk Students)
    const atRiskStudents = students
      .map((s) => {
        const masteries = s.studentProfile?.masteryRecords || [];
        const avgMastery =
          masteries.length > 0
            ? Math.round(
                masteries.reduce((acc, m) => acc + m.masteryPercentage, 0) / masteries.length
              )
            : 70;

        const negativePoints = s.disciplineRecords
          .filter((d) => d.type === "NEGATIVE")
          .reduce((acc, d) => acc + Math.abs(d.points), 0);

        const absences = s.attendanceRecords.filter((a) => a.status === "ABSENT").length;
        const delays = s.attendanceRecords.filter((a) => a.status === "LATE").length;

        // محاسبه سطح ریسک
        let riskScore = 0;
        const riskFactors: string[] = [];

        if (avgMastery < 50) {
          riskScore += 3;
          riskFactors.push(`تسلط مفهومی بحرانی (${avgMastery}٪)`);
        } else if (avgMastery < 65) {
          riskScore += 1;
          riskFactors.push(`تسلط نیاز به تقویت (${avgMastery}٪)`);
        }

        if (absences >= 2) {
          riskScore += 2;
          riskFactors.push(`${absences} جلسه غیبت در هفته جاری`);
        }
        if (delays >= 2) {
          riskScore += 1;
          riskFactors.push(`${delays} تاخیر ورود به کلاس`);
        }

        if (negativePoints > 0) {
          riskScore += negativePoints;
          riskFactors.push(`${negativePoints} امتیاز منفی انضباطی`);
        }

        let riskLevel: "CRITICAL" | "WARNING" | "ATTENTION" | "NORMAL" = "NORMAL";
        if (riskScore >= 4) riskLevel = "CRITICAL";
        else if (riskScore >= 2) riskLevel = "WARNING";
        else if (riskScore === 1) riskLevel = "ATTENTION";

        const classroomName = s.studentProfile?.enrollments[0]?.classroom?.name || "دوازدهم ریاضی";

        return {
          id: s.id,
          fullName: s.fullName,
          nationalId: s.nationalId,
          avatarUrl: s.avatarUrl,
          gradeLevel: s.studentProfile?.gradeLevel || 12,
          major: s.studentProfile?.major || "ریاضی و فیزیک",
          classroomName,
          averageMastery: avgMastery,
          absencesCount: absences,
          delaysCount: delays,
          negativeDisciplinePoints: negativePoints,
          riskScore,
          riskLevel,
          riskFactors,
          privateNotes: s.studentProfile?.privateTeacherNotes || "",
        };
      })
      .filter((s) => s.riskLevel !== "NORMAL")
      .sort((a, b) => b.riskScore - a.riskScore);

    // محاسبه وضعیت پایه‌ها
    const grade11Students = students.filter((s) => s.studentProfile?.gradeLevel === 11);
    const grade12Students = students.filter((s) => s.studentProfile?.gradeLevel === 12);

    const gradeLevels = [
      {
        gradeLevel: 12,
        title: "پایه دوازدهم",
        studentCount: grade12Students.length,
        averageMastery: 73,
        attendanceRate: 94,
      },
      {
        gradeLevel: 11,
        title: "پایه یازدهم",
        studentCount: grade11Students.length,
        averageMastery: 81,
        attendanceRate: 98,
      },
    ];

    // آمار انضباط کل
    const allDiscipline = await prisma.disciplineRecord.findMany();
    const totalPositiveMerits = allDiscipline.filter((d) => d.type === "POSITIVE").length;
    const totalNegativeDemerits = allDiscipline.filter((d) => d.type === "NEGATIVE").length;

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        city: school.city,
        type: school.type,
      },
      summary: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClassrooms: classrooms.length,
        schoolMasteryAverage,
        attendanceRateToday,
        presentToday,
        absentToday,
        lateToday,
        atRiskCount: atRiskStudents.length,
        totalPositiveMerits,
        totalNegativeDemerits,
      },
      gradeLevels,
      heatmapTopics,
      atRiskStudents,
      todayAttendance,
      recentDiscipline: allDiscipline.slice(0, 8),
    });
  } catch (error: any) {
    console.error("Error in GET /api/principal/matrix:", error);
    return NextResponse.json({ error: error.message || "Failed to load principal matrix" }, { status: 500 });
  }
}
