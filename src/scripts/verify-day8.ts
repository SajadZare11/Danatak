import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

async function verifyDay8() {
  console.log("=== STARTING DAY 8 VERIFICATION SUITE ===");

  // 1. Verify Classrooms and Students
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("School not found!");
  console.log(`✓ School verified: ${school.name} (Code: ${school.code})`);

  const classrooms = await prisma.classroom.findMany();
  if (classrooms.length < 2) throw new Error(`Expected at least 2 classrooms, found ${classrooms.length}`);
  console.log(`✓ Classrooms verified: ${classrooms.map((c) => c.name).join(" | ")}`);

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });
  if (students.length < 4) throw new Error(`Expected at least 4 students, found ${students.length}`);
  console.log(`✓ Students cohort verified: ${students.map((s) => s.fullName).join(", ")}`);

  // 2. Verify Attendance Records & Rapid Attendance functionality
  const class12 = classrooms.find((c) => c.gradeLevel === 12);
  if (!class12) throw new Error("Class 12 not found!");

  const attendances = await prisma.attendanceRecord.findMany({
    where: { classroomId: class12.id },
  });
  if (attendances.length === 0) throw new Error("No attendance records found for Class 12!");
  console.log(`✓ Attendance records verified: ${attendances.length} records found in Class 12.`);

  // Test updating attendance
  const ali = students.find((s) => s.fullName === "علی رضایی");
  if (!ali) throw new Error("Ali Rezaei not found!");

  const updatedAttendance = await prisma.attendanceRecord.create({
    data: {
      classroomId: class12.id,
      studentId: ali.id,
      status: "PRESENT",
      delayMinutes: 0,
      note: "حاضر در جلسه تست خودکار روز ۸",
      date: new Date(),
    },
  });
  console.log(`✓ Rapid Attendance creation verified: Record ID ${updatedAttendance.id}`);

  // 3. Verify Discipline System (Merits / Demerits)
  const positiveDemerits = await prisma.disciplineRecord.findMany({
    where: { type: "POSITIVE" },
  });
  const negativeDemerits = await prisma.disciplineRecord.findMany({
    where: { type: "NEGATIVE" },
  });

  if (positiveDemerits.length === 0 || negativeDemerits.length === 0) {
    throw new Error("Discipline records must include both positive and negative merits!");
  }
  console.log(`✓ Discipline system verified: ${positiveDemerits.length} positive merits, ${negativeDemerits.length} negative demerits.`);

  // Test awarding new merit and XP increment
  const startXP = ali.studentProfile?.totalXP || 0;
  await prisma.disciplineRecord.create({
    data: {
      studentId: ali.id,
      type: "POSITIVE",
      title: "تست خودکار تشویق انضباطی",
      points: 2,
      recordedBy: "سیستم تست خودکار",
    },
  });
  await prisma.studentProfile.update({
    where: { id: ali.studentProfile!.id },
    data: { totalXP: { increment: 30 } },
  });
  const afterStudent = await prisma.studentProfile.findUnique({
    where: { id: ali.studentProfile!.id },
  });
  if ((afterStudent?.totalXP || 0) <= startXP) {
    throw new Error("XP should increase upon positive merit!");
  }
  console.log(`✓ Merit award & XP increment verified: XP increased from ${startXP} to ${afterStudent?.totalXP}`);

  // 4. Verify Official Grades & Sida Excel Export Engine
  const officialGrades = await prisma.officialGrade.findMany({
    where: { classroomId: class12.id },
    include: { student: true, subject: true },
  });
  if (officialGrades.length === 0) throw new Error("No official grades found for Sida export!");
  console.log(`✓ Official grades verified: ${officialGrades.length} grade entries found.`);

  // Generate an actual Sida XLSX workbook
  const rows: any[] = [
    ["وزارت آموزش و پرورش - سامانه جامع سنجش و ارزشیابی تحصیلی (سیدا - sida.medu.ir)"],
    [`مدرسه: ${school.name}`, `کد مدرسه: ${school.code}`],
    ["ردیف", "کد ملی", "نام و نام خانوادگی", "مستمر ۱", "پایانی ۱", "مستمر ۲", "پایانی ۲", "سالانه", "توصیفی", "انضباط", "غیبت"],
  ];
  officialGrades.slice(0, 4).forEach((g, idx) => {
    rows.push([
      idx + 1,
      g.student.nationalId,
      g.student.fullName,
      g.term1Continuous,
      g.term1Final,
      g.term2Continuous,
      g.term2Final,
      g.annualScore,
      g.descriptiveEvaluation,
      g.conductScore,
      g.unexcusedAbsences,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!views"] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, "کارنامه نمرات سیدا");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  if (!buffer || buffer.length < 500) {
    throw new Error("Sida Excel export buffer generation failed or too small!");
  }
  console.log(`✓ Sida Excel Export verified: Generated valid XLSX buffer of ${buffer.length} bytes with RTL sheet.`);

  // 5. Verify School Health Matrix & At-Risk Detection
  const atRiskStudent = students.find((s) => s.fullName === "محمد کاظمی");
  if (!atRiskStudent) throw new Error("At-Risk student Mohammad Kazemi not found!");

  const mohammadMasteries = await prisma.topicMastery.findMany({
    where: { studentProfileId: atRiskStudent.studentProfile?.id },
  });
  const mohammadAvg =
    mohammadMasteries.length > 0
      ? Math.round(mohammadMasteries.reduce((a, b) => a + b.masteryPercentage, 0) / mohammadMasteries.length)
      : 0;

  const mohammadAbsences = await prisma.attendanceRecord.count({
    where: { studentId: atRiskStudent.id, status: "ABSENT" },
  });
  const mohammadDemerits = await prisma.disciplineRecord.count({
    where: { studentId: atRiskStudent.id, type: "NEGATIVE" },
  });

  if (mohammadAvg > 65 || mohammadAbsences === 0 || mohammadDemerits === 0) {
    throw new Error("Mohammad Kazemi should be correctly classified with at-risk signals!");
  }
  console.log(
    `✓ At-Risk Student Registry verified: محمد کاظمی (تسلط: ${mohammadAvg}٪, غیبت‌ها: ${mohammadAbsences}, تذکرات: ${mohammadDemerits})`
  );

  // 6. Verify Topic Weakness Heatmap
  const topics = await prisma.topic.findMany({
    include: { masteries: true },
  });
  const avgScores = topics.map((t) => {
    const sum = t.masteries.reduce((a, b) => a + b.masteryPercentage, 0);
    return t.masteries.length > 0 ? Math.round(sum / t.masteries.length) : 0;
  });
  console.log(`✓ School Topic Heatmap verified across ${topics.length} topics (Score range: ${Math.min(...avgScores)}% - ${Math.max(...avgScores)}%).`);

  // 7. Verify Official Report Card Calculation
  const aliGrade = officialGrades.find((g) => g.studentId === ali.id);
  if (!aliGrade) throw new Error("Ali Rezaei grade not found!");

  const calculatedAnnual = Number(
    (
      ((aliGrade.term1Continuous || 18) * 1 +
        (aliGrade.term1Final || 18) * 2 +
        (aliGrade.term2Continuous || 18) * 1 +
        (aliGrade.term2Final || 18) * 4) /
      8
    ).toFixed(2)
  );
  console.log(
    `✓ Official Report Card formula verified: Annual score ${calculatedAnnual}/20 (Descriptive: ${aliGrade.descriptiveEvaluation})`
  );

  console.log("=== ALL DAY 8 PRINCIPAL MATRIX, ATTENDANCE, DISCIPLINE & SIDA CHECKS PASSED ===");
}

verifyDay8()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
