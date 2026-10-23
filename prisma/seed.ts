import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 شروع تزریق داده‌های بومی مدارس ایران (Seeding)...");

  // پاک‌سازی دیتای قبلی برای اطمینان از تمیز بودن
  await prisma.tuitionRecord.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.disciplineRecord.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topicMastery.deleteMany();
  await prisma.prerequisiteEdge.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.textbook.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.school.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.parentStudentRelation.deleteMany();
  await prisma.user.deleteMany();

  // ۱. ایجاد مدرسه
  const school = await prisma.school.create({
    data: {
      name: "دبیرستان علامه حلی ۱ (استعدادهای درخشان - تیزهوشان)",
      type: "تیزهوشان",
      code: "12345678",
      city: "تهران",
    },
  });

  // ۲. ایجاد کاربران نقش‌های ۵‌گانه
  // معلم ریاضی
  const teacherUser = await prisma.user.create({
    data: {
      nationalId: "0011223344",
      fullName: "استاد احسان محمدی",
      phoneNumber: "09121111111",
      role: "TEACHER",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ehsan",
      teacherProfile: {
        create: {
          specialty: "ریاضی و حسابان کنکور و المپیاد",
          schoolName: school.name,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // دانش‌آموز ۱ (علی رضایی - دوازدهم ریاضی)
  const studentUser1 = await prisma.user.create({
    data: {
      nationalId: "0022334455",
      fullName: "علی رضایی",
      phoneNumber: "09122222222",
      role: "STUDENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
      studentProfile: {
        create: {
          gradeLevel: 12,
          major: "ریاضی و فیزیک",
          schoolName: school.name,
          learningStyle: "تحلیلی و دیداری (تمرین‌محور)",
          academicStrengths: "تسلط عالی بر هندسه و مفهوم حد",
          academicWeaknesses: "خطای محاسباتی در مشتق توابع کسری و زنجیره‌ای",
          privateTeacherNotes: "دانش‌آموز بسیار مستعد با پتانسیل رتبه دو رقمی کنکور؛ در شرایط آزمون‌های زمان‌دار دچار اضطراب محاسباتی می‌شود.",
          currentStreakDays: 14,
          totalXP: 1420,
        },
      },
    },
    include: { studentProfile: true },
  });

  // دانش‌آموز ۲ (سارا علوی)
  const studentUser2 = await prisma.user.create({
    data: {
      nationalId: "0033445566",
      fullName: "سارا علوی",
      phoneNumber: "09123333333",
      role: "STUDENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
      studentProfile: {
        create: {
          gradeLevel: 12,
          major: "ریاضی و فیزیک",
          schoolName: school.name,
          learningStyle: "مفهومی و کلامی",
          currentStreakDays: 8,
          totalXP: 950,
        },
      },
    },
    include: { studentProfile: true },
  });

  // مدیر مدرسه
  const principalUser = await prisma.user.create({
    data: {
      nationalId: "0099887766",
      fullName: "دکتر مسعود حسینی (مدیریت دبیرستان)",
      phoneNumber: "09129999999",
      role: "PRINCIPAL",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hosseini",
    },
  });

  // مشاور مدرسه
  const counselorUser = await prisma.user.create({
    data: {
      nationalId: "0088776655",
      fullName: "خانم مریم صابری (مشاور ارشد تحصیلی)",
      phoneNumber: "09128888888",
      role: "COUNSELOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Saberi",
    },
  });

  // ولی دانش‌آموز (پدر علی رضایی)
  const parentUser = await prisma.user.create({
    data: {
      nationalId: "0077665544",
      fullName: "مهندس حسین رضایی (ولی علی)",
      phoneNumber: "09127777777",
      role: "PARENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ParentRezaei",
    },
  });

  // پیوند والد و دانش‌آموز
  await prisma.parentStudentRelation.create({
    data: {
      parentId: parentUser.id,
      studentId: studentUser1.id,
      relation: "پدر",
    },
  });

  // ۳. ایجاد کلاس درس
  const classroom = await prisma.classroom.create({
    data: {
      name: "کلاس ۱۲/۱ (دوازدهم ریاضی الف)",
      gradeLevel: 12,
      major: "ریاضی و فیزیک",
      schoolId: school.id,
      teacherId: teacherUser.teacherProfile!.id,
    },
  });

  // ثبت‌نام دانش‌آموزان در کلاس
  await prisma.enrollment.createMany({
    data: [
      { classroomId: classroom.id, studentId: studentUser1.studentProfile!.id },
      { classroomId: classroom.id, studentId: studentUser2.studentProfile!.id },
    ],
  });

  // ۴. تعریف دروس، کتاب‌ها و درختواره مباحث
  const mathSubject = await prisma.subject.create({
    data: {
      name: "ریاضیات و حسابان",
      code: "MATH-01",
      color: "#4f46e5",
    },
  });

  const physicsSubject = await prisma.subject.create({
    data: {
      name: "فیزیک",
      code: "PHYS-01",
      color: "#0891b2",
    },
  });

  // کتاب‌های پایه ۱۰، ۱۱، ۱۲ ریاضی
  const bookGrade10 = await prisma.textbook.create({
    data: {
      title: "ریاضی ۱ (پایه دهم)",
      gradeLevel: 10,
      major: "ریاضی و تجربی",
      subjectId: mathSubject.id,
    },
  });

  const bookGrade11 = await prisma.textbook.create({
    data: {
      title: "حسابان ۱ (پایه یازدهم)",
      gradeLevel: 11,
      major: "ریاضی",
      subjectId: mathSubject.id,
    },
  });

  const bookGrade12 = await prisma.textbook.create({
    data: {
      title: "حسابان ۲ و ریاضی ۳ (پایه دوازدهم)",
      gradeLevel: 12,
      major: "ریاضی",
      subjectId: mathSubject.id,
    },
  });

  // سرفصل‌های دهم: مبحث تابع و دامنه
  const topicG10Functions = await prisma.topic.create({
    data: {
      title: "مفهوم تابع، دامنه و برد",
      textbookId: bookGrade10.id,
      orderIndex: 1,
    },
  });

  // سرفصل‌های یازدهم: حد و پیوستگی
  const topicG11Limits = await prisma.topic.create({
    data: {
      title: "حد و پیوستگی توابع کسری",
      textbookId: bookGrade11.id,
      orderIndex: 1,
    },
  });

  // سرفصل‌های دوازدهم: فصل مشتق
  const topicG12DerivativeChapter = await prisma.topic.create({
    data: {
      title: "فصل ۳: مشتق و محاسبات مشتق",
      textbookId: bookGrade12.id,
      orderIndex: 1,
    },
  });

  // زیرمباحث فصل مشتق دوازدهم
  const topicG12DefDerivative = await prisma.topic.create({
    data: {
      title: "تعریف مشتق و شیب خط مماس",
      textbookId: bookGrade12.id,
      parentId: topicG12DerivativeChapter.id,
      orderIndex: 1,
    },
  });

  const topicG12FractionalDerivative = await prisma.topic.create({
    data: {
      title: "مشتق توابع کسری و جبری",
      textbookId: bookGrade12.id,
      parentId: topicG12DerivativeChapter.id,
      orderIndex: 2,
    },
  });

  const topicG12ChainRule = await prisma.topic.create({
    data: {
      title: "قاعده زنجیره‌ای و مشتق توابع مرکب",
      textbookId: bookGrade12.id,
      parentId: topicG12DerivativeChapter.id,
      orderIndex: 3,
    },
  });

  const topicG12Optimization = await prisma.topic.create({
    data: {
      title: "کاربرد مشتق در بهینه‌سازی و نقاط بحرانی",
      textbookId: bookGrade12.id,
      parentId: topicG12DerivativeChapter.id,
      orderIndex: 4,
    },
  });

  // ۵. ایجاد گراف پیوسته پیش‌نیازها (Cross-Grade Knowledge Graph)
  await prisma.prerequisiteEdge.createMany({
    data: [
      {
        sourceTopicId: topicG10Functions.id, // تابع دهم
        targetTopicId: topicG11Limits.id,    // حد یازدهم
        importance: 1.0,
      },
      {
        sourceTopicId: topicG11Limits.id,        // حد یازدهم
        targetTopicId: topicG12DefDerivative.id, // تعریف مشتق دوازدهم
        importance: 1.0,
      },
      {
        sourceTopicId: topicG12FractionalDerivative.id, // مشتق کسری
        targetTopicId: topicG12Optimization.id,         // بهینه‌سازی
        importance: 0.9,
      },
    ],
  });

  // ۶. ثبت رکوردهای تسلط موضوعی اولیه برای علی رضایی
  await prisma.topicMastery.createMany({
    data: [
      {
        studentProfileId: studentUser1.studentProfile!.id,
        topicId: topicG11Limits.id,
        masteryPercentage: 88.0,
        evaluatedBy: "TEACHER",
      },
      {
        studentProfileId: studentUser1.studentProfile!.id,
        topicId: topicG12DefDerivative.id,
        masteryPercentage: 80.0,
        evaluatedBy: "TEACHER",
      },
      {
        studentProfileId: studentUser1.studentProfile!.id,
        topicId: topicG12FractionalDerivative.id,
        masteryPercentage: 55.0, // مبحث نیازمند تکلیف جبرانی
        evaluatedBy: "TEACHER",
      },
      {
        studentProfileId: studentUser1.studentProfile!.id,
        topicId: topicG12ChainRule.id,
        masteryPercentage: 45.0, // مبحث بحرانی
        evaluatedBy: "TEACHER",
      },
      {
        studentProfileId: studentUser1.studentProfile!.id,
        topicId: topicG12Optimization.id,
        masteryPercentage: 35.0,
        evaluatedBy: "TEACHER",
      },
    ],
  });

  // ۷. تزریق سوالات نمونه با فرمول‌های ریاضی KaTeX
  const q1 = await prisma.question.create({
    data: {
      topicId: topicG12FractionalDerivative.id,
      authorId: teacherUser.id,
      content: "مشتق تابع $f(x) = \\frac{2x - 1}{x^2 + 1}$ در نقطه $x = 1$ کدام است؟",
      type: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      isPublic: true,
      tags: "نهایی, حسابان۲",
      explanation: "با استفاده از قاعده مشتق کسری: $f'(x) = \\frac{2(x^2+1) - 2x(2x-1)}{(x^2+1)^2}$. در $x=1$ داریم: $f'(1) = \\frac{2(2) - 2(1)}{4} = \\frac{1}{2}$.",
      options: {
        create: [
          { optionText: "$\\frac{1}{2}$", orderIndex: 1, isCorrect: true },
          { optionText: "$1$", orderIndex: 2, isCorrect: false },
          { optionText: "$-\\frac{1}{2}$", orderIndex: 3, isCorrect: false },
          { optionText: "$0$", orderIndex: 4, isCorrect: false },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      topicId: topicG12FractionalDerivative.id,
      authorId: teacherUser.id,
      content: "اگر $g(x) = \\frac{x^3}{x-1}$ باشد، معادله خط مماس بر منحنی در نقطه به طول $x = 2$ را بیابید.",
      type: "DESCRIPTIVE",
      difficulty: "HARD",
      isPublic: true,
      tags: "کنکور, تشریحی",
      explanation: "نقطه تماس $(2, 8)$ است. شیب خط مماس برابر $g'(2) = 4$ می‌باشد. معادله خط: $y - 8 = 4(x - 2) \\implies y = 4x$. (بارم: ۲ نمره)",
    },
  });

  const q3 = await prisma.question.create({
    data: {
      topicId: topicG12ChainRule.id,
      authorId: null, // بانک مرکزی
      content: "مشتق تابع $y = \\sin^3(2x)$ در نقطه $x = \\frac{\\pi}{6}$ برابر کدام گزینه است؟",
      type: "MULTIPLE_CHOICE",
      difficulty: "HARD",
      isPublic: true,
      tags: "کنکور سراسری, تیزهوشان",
      explanation: "قاعده زنجیره‌ای: $y' = 3\\sin^2(2x) \\cdot (2\\cos(2x))$. در $\\frac{\\pi}{6}$ مقدار $2x = \\frac{\\pi}{3}$ است.",
      options: {
        create: [
          { optionText: "$\\frac{9}{4}$", orderIndex: 1, isCorrect: true },
          { optionText: "$\\frac{3\\sqrt{3}}{2}$", orderIndex: 2, isCorrect: false },
          { optionText: "$\\frac{3}{4}$", orderIndex: 3, isCorrect: false },
          { optionText: "$3$", orderIndex: 4, isCorrect: false },
        ],
      },
    },
  });

  // سوالات تشخیصی پیش‌نیاز پایه دهم (مفهوم تابع و دامنه)
  await prisma.question.create({
    data: {
      topicId: topicG10Functions.id,
      authorId: null,
      content: "دامنه تابع کسری-رادیکالی $f(x) = \\frac{\\sqrt{x - 2}}{x - 5}$ کدام است؟",
      type: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      isPublic: true,
      tags: "پایه دهم, پیش‌نیاز",
      explanation: "زیر رادیکال زوج باید نامنفی و مخرج غیرصفر باشد: $x \\ge 2$ و $x \\ne 5 \\implies [2, 5) \\cup (5, +\\infty)$.",
      options: {
        create: [
          { optionText: "$[2, +\\infty) - \\{5\\}$", orderIndex: 1, isCorrect: true },
          { optionText: "$(2, 5)$", orderIndex: 2, isCorrect: false },
          { optionText: "$[2, 5]$", orderIndex: 3, isCorrect: false },
          { optionText: "$\\mathbb{R} - \\{5\\}$", orderIndex: 4, isCorrect: false },
        ],
      },
    },
  });

  // سوالات تشخیصی پیش‌نیاز پایه یازدهم (حد توابع کسری صفر صفرم)
  await prisma.question.create({
    data: {
      topicId: topicG11Limits.id,
      authorId: null,
      content: "حاصل حد کسری $\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$ برابر با کدام مقدار است؟",
      type: "MULTIPLE_CHOICE",
      difficulty: "EASY",
      isPublic: true,
      tags: "پایه یازدهم, پیش‌نیاز",
      explanation: "با رفع ابهام صفر صفرم از طریق تجزیه اتحاد مزدوج: $\\lim_{x \\to 3} \\frac{(x-3)(x+3)}{x-3} = 3 + 3 = 6$.",
      options: {
        create: [
          { optionText: "$6$", orderIndex: 1, isCorrect: true },
          { optionText: "$3$", orderIndex: 2, isCorrect: false },
          { optionText: "$0$", orderIndex: 3, isCorrect: false },
          { optionText: "تعریف‌نشده", orderIndex: 4, isCorrect: false },
        ],
      },
    },
  });

  // ۸. ایجاد یک تکلیف نمونه
  const assignment = await prisma.assignment.create({
    data: {
      title: "تکلیف تثبیتی شماره ۳: مشتق توابع جبری و کسری",
      description: "حل دقیق سوالات همراه با درج راه‌حل کامل در برگه یا ثبت کلید آنلاین",
      classroomId: classroom.id,
      teacherId: teacherUser.id,
      topicId: topicG12FractionalDerivative.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // ۳ روز بعد
      maxScore: 20.0,
      questionsJson: JSON.stringify([q1.id, q2.id, q3.id]),
    },
  });

  // ۹. ثبت رکوردهای انضباطی، حضور و غیاب و ساعت مطالعه
  await prisma.attendanceRecord.create({
    data: {
      classroomId: classroom.id,
      studentId: studentUser1.id,
      date: new Date(),
      status: "PRESENT",
      note: "حضور فعال در تدریس مبحث مشتق",
    },
  });

  await prisma.disciplineRecord.create({
    data: {
      studentId: studentUser1.id,
      type: "POSITIVE",
      title: "پاسخ صحیح به پرسش کلاسی المپیادی",
      points: 2,
      note: "ثبت توسط استاد محمدی در زنگ حسابان",
    },
  });

  await prisma.studyLog.createMany({
    data: [
      {
        studentId: studentUser1.id,
        subjectId: mathSubject.id,
        topicId: topicG12FractionalDerivative.id,
        studyMinutes: 110,
        testCount: 35,
        note: "تست‌های کنکور سراسری داخل و خارج ۹۸ تا ۱۴۰۲",
      },
      {
        studentId: studentUser1.id,
        subjectId: physicsSubject.id,
        studyMinutes: 90,
        testCount: 25,
        note: "مبحث حرکت بر خط راست با شتاب ثابت",
      },
    ],
  });

  // ۱۰. ثبت رکورد مالی و شهریه
  await prisma.tuitionRecord.create({
    data: {
      studentId: studentUser1.id,
      totalAmount: 38000000, // ۳۸ میلیون تومان
      paidAmount: 25000000,
      status: "جاری",
      planJson: JSON.stringify([
        { title: "پیش‌پرداخت ثبت‌نام", amount: 15000000, dueDate: "1403/06/15", status: "پرداخت‌شده" },
        { title: "قسط اول (آبان)", amount: 10000000, dueDate: "1403/08/15", status: "پرداخت‌شده" },
        { title: "قسط دوم (دی)", amount: 13000000, dueDate: "1403/10/15", status: "در انتظار پرداخت" },
      ]),
    },
  });

  console.log("✅ تمامی داده‌های بومی با موفقیت تزریق شدند!");
  console.log(`- مدرسه: ${school.name}`);
  console.log(`- معلم: ${teacherUser.fullName} (${teacherUser.nationalId})`);
  console.log(`- دانش‌آموز: ${studentUser1.fullName} (${studentUser1.nationalId})`);
  console.log(`- مدیر: ${principalUser.fullName}`);
  console.log(`- مشاور: ${counselorUser.fullName}`);
  console.log(`- ولی: ${parentUser.fullName}`);
}

main()
  .catch((e) => {
    console.error("❌ خطا در اجرای seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
