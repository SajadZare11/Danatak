import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDay8() {
  console.log("🌱 Starting Day 8 Seeding: Attendance, Discipline, Official Grades & Multi-Student Cohort...");

  const school = await prisma.school.findFirst();
  if (!school) {
    console.error("School not found! Run base seed first.");
    return;
  }

  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: true },
  });

  const class12 = await prisma.classroom.findFirst({
    where: { gradeLevel: 12 },
  });

  const mathSubject = await prisma.subject.findFirst({
    where: { code: "MATH-01" },
  });

  const physicsSubject = await prisma.subject.findFirst({
    where: { code: "PHYS-01" },
  });

  if (!class12 || !teacher || !mathSubject) {
    console.error("Core prerequisites missing!");
    return;
  }

  // 1. Create Class 11/1 (یازدهم ریاضی) if not exists
  let class11 = await prisma.classroom.findFirst({
    where: { name: "کلاس ۱۱/۱ (یازدهم ریاضی الف)" },
  });
  if (!class11) {
    class11 = await prisma.classroom.create({
      data: {
        name: "کلاس ۱۱/۱ (یازدهم ریاضی الف)",
        gradeLevel: 11,
        major: "ریاضی و فیزیک",
        schoolId: school.id,
        teacherId: teacher.teacherProfile?.id,
      },
    });
    console.log("✓ Created Class 11/1");
  }

  // 2. Add Student 3: محمد کاظمی (At-Risk student)
  let student3 = await prisma.user.findUnique({
    where: { nationalId: "0044556677" },
    include: { studentProfile: true },
  });
  if (!student3) {
    student3 = await prisma.user.create({
      data: {
        nationalId: "0044556677",
        fullName: "محمد کاظمی",
        phoneNumber: "09124444444",
        role: "STUDENT",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammad",
        studentProfile: {
          create: {
            gradeLevel: 12,
            major: "ریاضی و فیزیک",
            schoolName: school.name,
            learningStyle: "حرکتی و عملی",
            academicStrengths: "هندسه شهودی",
            academicWeaknesses: "افت شدید در حسابان و مشتق، ضعف پایه محاسبات، عدم تحویل تکالیف",
            privateTeacherNotes: "دانش‌آموز در آستانه وضعیت قرمز بحرانی (At-Risk)؛ نیاز به جلسه فوری با مشاور و اولیا.",
            currentStreakDays: 1,
            totalXP: 420,
          },
        },
      },
      include: { studentProfile: true },
    });
    // Enroll in Class 12
    await prisma.enrollment.create({
      data: {
        classroomId: class12.id,
        studentId: student3.studentProfile!.id,
      },
    });
    console.log("✓ Created Student 3: محمد کاظمی (At-Risk)");
  }

  // 3. Add Student 4: نیما شریفی (Moderate student)
  let student4 = await prisma.user.findUnique({
    where: { nationalId: "0055667788" },
    include: { studentProfile: true },
  });
  if (!student4) {
    student4 = await prisma.user.create({
      data: {
        nationalId: "0055667788",
        fullName: "نیما شریفی",
        phoneNumber: "09125555555",
        role: "STUDENT",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nima",
        studentProfile: {
          create: {
            gradeLevel: 12,
            major: "ریاضی و فیزیک",
            schoolName: school.name,
            learningStyle: "بصری",
            academicStrengths: "تسلط بر تابع و مثلثات",
            academicWeaknesses: "مدیریت زمان در آزمون‌های تستی",
            privateTeacherNotes: "روند یادگیری رو به رشد دارد و با تمرین بیشتر به سطح برتر می‌رسد.",
            currentStreakDays: 6,
            totalXP: 820,
          },
        },
      },
      include: { studentProfile: true },
    });
    await prisma.enrollment.create({
      data: {
        classroomId: class12.id,
        studentId: student4.studentProfile!.id,
      },
    });
    console.log("✓ Created Student 4: نیما شریفی");
  }

  // 4. Add Student 5: امیرحسین مرادی (Class 11 top student)
  let student5 = await prisma.user.findUnique({
    where: { nationalId: "0066778899" },
    include: { studentProfile: true },
  });
  if (!student5) {
    student5 = await prisma.user.create({
      data: {
        nationalId: "0066778899",
        fullName: "امیرحسین مرادی",
        phoneNumber: "09126666666",
        role: "STUDENT",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amirhossein",
        studentProfile: {
          create: {
            gradeLevel: 11,
            major: "ریاضی و فیزیک",
            schoolName: school.name,
            learningStyle: "تحلیلی و پژوهش‌محور",
            academicStrengths: "استدلال منطقی و المپیاد ریاضی",
            academicWeaknesses: "سرعت نوشتن تشریحی",
            privateTeacherNotes: "عضو تیم المپیاد ریاضی دبیرستان، انضباط عالی.",
            currentStreakDays: 21,
            totalXP: 2150,
          },
        },
      },
      include: { studentProfile: true },
    });
    await prisma.enrollment.create({
      data: {
        classroomId: class11.id,
        studentId: student5.studentProfile!.id,
      },
    });
    console.log("✓ Created Student 5: امیرحسین مرادی (Grade 11)");
  }

  // Get all students of Class 12
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });

  // 5. Seed Attendance Records for Today and Past 2 Days
  const today = new Date();
  today.setHours(8, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Clear existing attendance records to ensure clean seed
  await prisma.attendanceRecord.deleteMany();

  for (const s of allStudents) {
    const isAtRisk = s.fullName === "محمد کاظمی";
    const isGrade11 = s.studentProfile?.gradeLevel === 11;
    const targetClassId = isGrade11 ? class11.id : class12.id;

    // Today's attendance
    await prisma.attendanceRecord.create({
      data: {
        classroomId: targetClassId,
        studentId: s.id,
        date: today,
        status: isAtRisk ? "ABSENT" : "PRESENT",
        delayMinutes: isAtRisk ? 0 : 0,
        note: isAtRisk ? "غیبت غیرموجه - تماس اولیه با ولی برقرار نشد" : "حاضر در کلاس",
      },
    });

    // Yesterday's attendance
    await prisma.attendanceRecord.create({
      data: {
        classroomId: targetClassId,
        studentId: s.id,
        date: yesterday,
        status: isAtRisk ? "LATE" : "PRESENT",
        delayMinutes: isAtRisk ? 25 : 0,
        note: isAtRisk ? "۲۵ دقیقه تاخیر در زنگ اول" : "حاضر",
      },
    });

    // Two days ago attendance
    await prisma.attendanceRecord.create({
      data: {
        classroomId: targetClassId,
        studentId: s.id,
        date: twoDaysAgo,
        status: "PRESENT",
        delayMinutes: 0,
        note: "حاضر",
      },
    });
  }
  console.log("✓ Seeded realistic Attendance records for all students across 3 days");

  // 6. Seed Discipline Records (Positive & Negative Merits)
  await prisma.disciplineRecord.deleteMany();

  const ali = allStudents.find((s) => s.fullName === "علی رضایی");
  const mohammad = allStudents.find((s) => s.fullName === "محمد کاظمی");
  const amir = allStudents.find((s) => s.fullName === "امیرحسین مرادی");
  const sara = allStudents.find((s) => s.fullName === "سارا علوی");

  if (ali) {
    await prisma.disciplineRecord.create({
      data: {
        studentId: ali.id,
        date: new Date(),
        type: "POSITIVE",
        title: "مشارکت فعال و حل مسائل دشوار پای تخته",
        points: 2,
        recordedBy: "استاد احسان محمدی (دبیر ریاضی)",
        note: "ارائه راه‌حل خلاقانه و کوتاه‌تر برای اثبات قضیه مشتق توابع کسری.",
      },
    });
    await prisma.disciplineRecord.create({
      data: {
        studentId: ali.id,
        date: yesterday,
        type: "POSITIVE",
        title: "همکاری در اداره کلاس و رفع اشکال همکلاسی‌ها",
        points: 1,
        recordedBy: "استاد احسان محمدی",
        note: "کمک موثر در گروه درسی.",
      },
    });
  }

  if (sara) {
    await prisma.disciplineRecord.create({
      data: {
        studentId: sara.id,
        date: yesterday,
        type: "POSITIVE",
        title: "کسب نمره کامل در آزمون کلاسی",
        points: 2,
        recordedBy: "استاد احسان محمدی",
        note: "پاسخگویی دقیق به تمامی سوالات تشریحی حد و پیوستگی.",
      },
    });
  }

  if (amir) {
    await prisma.disciplineRecord.create({
      data: {
        studentId: amir.id,
        date: new Date(),
        type: "POSITIVE",
        title: "رعایت کامل نظم و اخلاق اسلامی و مدال المپیاد",
        points: 3,
        recordedBy: "دکتر مسعود حسینی (مدیریت دبیرستان)",
        note: "افتخارآفرینی در مرحله استانی المپیاد و الگو برای سایر دانش‌آموزان.",
      },
    });
  }

  if (mohammad) {
    await prisma.disciplineRecord.create({
      data: {
        studentId: mohammad.id,
        date: today,
        type: "NEGATIVE",
        title: "عدم انجام تکالیف و غیبت مکرر",
        points: -2,
        recordedBy: "معاونت آموزشی دبیرستان",
        note: "عدم تحویل ۳ تکلیف متوالی و تاخیرهای مکرر در زنگ اول.",
      },
    });
    await prisma.disciplineRecord.create({
      data: {
        studentId: mohammad.id,
        date: yesterday,
        type: "NEGATIVE",
        title: "بی‌نظمی در کلاس و استفاده غیرمجاز از تلفن همراه",
        points: -1,
        recordedBy: "استاد احسان محمدی",
        note: "تذکر شفاهی دوم ثبت شد.",
      },
    });
  }
  console.log("✓ Seeded realistic Discipline records (Positive/Negative Merits)");

  // 7. Seed Official Grades for Sida Export & Report Cards
  await prisma.officialGrade.deleteMany();

  const gradePresets = [
    {
      studentName: "علی رضایی",
      term1Cont: 19.5,
      term1Fin: 18.5,
      term2Cont: 19.0,
      term2Fin: 19.0,
      annual: 18.9,
      descriptive: "خیلی خوب",
      conduct: 20.0,
      unexcused: 0,
    },
    {
      studentName: "سارا علوی",
      term1Cont: 19.0,
      term1Fin: 19.5,
      term2Cont: 19.5,
      term2Fin: 19.5,
      annual: 19.4,
      descriptive: "خیلی خوب",
      conduct: 20.0,
      unexcused: 0,
    },
    {
      studentName: "محمد کاظمی",
      term1Cont: 9.5,
      term1Fin: 8.0,
      term2Cont: 10.0,
      term2Fin: 9.0,
      annual: 8.9,
      descriptive: "نیاز به آموزش و تلاش بیشتر",
      conduct: 17.0,
      unexcused: 3,
    },
    {
      studentName: "نیما شریفی",
      term1Cont: 15.0,
      term1Fin: 14.5,
      term2Cont: 16.0,
      term2Fin: 15.5,
      annual: 15.2,
      descriptive: "خوب",
      conduct: 19.5,
      unexcused: 0,
    },
    {
      studentName: "امیرحسین مرادی",
      term1Cont: 20.0,
      term1Fin: 20.0,
      term2Cont: 20.0,
      term2Fin: 20.0,
      annual: 20.0,
      descriptive: "خیلی خوب",
      conduct: 20.0,
      unexcused: 0,
    },
  ];

  for (const preset of gradePresets) {
    const student = allStudents.find((s) => s.fullName === preset.studentName);
    if (!student) continue;

    const isGrade11 = student.studentProfile?.gradeLevel === 11;
    const classId = isGrade11 ? class11.id : class12.id;

    // Math Official Grade
    await prisma.officialGrade.create({
      data: {
        studentId: student.id,
        classroomId: classId,
        subjectId: mathSubject.id,
        term1Continuous: preset.term1Cont,
        term1Final: preset.term1Fin,
        term2Continuous: preset.term2Cont,
        term2Final: preset.term2Fin,
        annualScore: preset.annual,
        descriptiveEvaluation: preset.descriptive,
        conductScore: preset.conduct,
        unexcusedAbsences: preset.unexcused,
      },
    });

    // Physics Official Grade if available
    if (physicsSubject) {
      await prisma.officialGrade.create({
        data: {
          studentId: student.id,
          classroomId: classId,
          subjectId: physicsSubject.id,
          term1Continuous: Math.min(20, preset.term1Cont + 0.5),
          term1Final: Math.min(20, preset.term1Fin + 0.5),
          term2Continuous: Math.min(20, preset.term2Cont + 0.5),
          term2Final: Math.min(20, preset.term2Fin + 0.5),
          annualScore: Math.min(20, preset.annual + 0.5),
          descriptiveEvaluation: preset.descriptive,
          conductScore: preset.conduct,
          unexcusedAbsences: preset.unexcused,
        },
      });
    }
  }
  console.log("✓ Seeded Official Grades for Sida Export & Report Cards");

  // 8. Seed Topic Masteries for new students to generate realistic school heatmap
  const topics = await prisma.topic.findMany();
  for (const s of allStudents) {
    if (!s.studentProfile) continue;
    const isAtRisk = s.fullName === "محمد کاظمی";
    const isTop = s.fullName === "امیرحسین مرادی" || s.fullName === "علی رضایی" || s.fullName === "سارا علوی";

    for (const topic of topics) {
      const existing = await prisma.topicMastery.findUnique({
        where: {
          studentProfileId_topicId: {
            studentProfileId: s.studentProfile.id,
            topicId: topic.id,
          },
        },
      });

      const percentage = isAtRisk
        ? Math.floor(Math.random() * 25) + 30 // 30-55%
        : isTop
        ? Math.floor(Math.random() * 15) + 85 // 85-100%
        : Math.floor(Math.random() * 20) + 65; // 65-85%

      if (!existing) {
        await prisma.topicMastery.create({
          data: {
            studentProfileId: s.studentProfile.id,
            topicId: topic.id,
            masteryPercentage: percentage,
            evaluatedBy: "TEACHER",
          },
        });
      }
    }
  }
  console.log("✓ Seeded Topic Masteries for Heatmap analysis across students");

  console.log("=== DAY 8 SEEDING COMPLETED SUCCESSFULLY ===");
}

seedDay8()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
