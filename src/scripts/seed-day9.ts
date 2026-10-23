import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDay9() {
  console.log("🌱 Starting Day 9 Seeding: Tuition, Study Logs, AI Study Plan & SMS Logs...");

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });

  const counselor = await prisma.user.findFirst({
    where: { role: "COUNSELOR" },
  });

  const mathSubject = await prisma.subject.findFirst({
    where: { code: "MATH-01" },
  });

  const physicsSubject = await prisma.subject.findFirst({
    where: { code: "PHYS-01" },
  });

  const ali = students.find((s) => s.fullName === "علی رضایی");
  const mohammad = students.find((s) => s.fullName === "محمد کاظمی");
  const sara = students.find((s) => s.fullName === "سارا علوی");

  if (!ali || !counselor || !mathSubject) {
    console.error("Prerequisites missing for Day 9 seed!");
    return;
  }

  // 1. Seed Tuition Records (شهریه و اقساط)
  await prisma.tuitionRecord.deleteMany();

  const tuitionPlans = [
    {
      studentId: ali.id,
      totalAmount: 48000000, // ۴۸ میلیون تومان شهریه مصوب
      paidAmount: 36000000,
      status: "جاری",
      plan: [
        {
          installmentNumber: 1,
          title: "پیش‌پرداخت ثبت‌نام (شهریور)",
          amount: 16000000,
          dueDate: "۱۴۰۳/۰۶/۱۵",
          status: "PAID",
          trackingCode: "TRX-881290",
          paymentDate: "۱۴۰۳/۰۶/۱۴",
        },
        {
          installmentNumber: 2,
          title: "چک صیادی قسط اول (آبان)",
          amount: 10000000,
          dueDate: "۱۴۰۳/۰۸/۳۰",
          status: "PAID",
          trackingCode: "CHK-449102",
          paymentDate: "۱۴۰۳/۰۸/۲۹",
        },
        {
          installmentNumber: 3,
          title: "چک صیادی قسط دوم (دی)",
          amount: 10000000,
          dueDate: "۱۴۰۳/۱۰/۳۰",
          status: "PAID",
          trackingCode: "CHK-449103",
          paymentDate: "۱۴۰۳/۱۰/۲۸",
        },
        {
          installmentNumber: 4,
          title: "چک صیادی قسط نهایی (اسفند)",
          amount: 12000000,
          dueDate: "۱۴۰۳/۱۲/۱۵",
          status: "PENDING",
          trackingCode: "CHK-449104",
          paymentDate: null,
        },
      ],
    },
    {
      studentId: sara.id,
      totalAmount: 48000000,
      paidAmount: 48000000,
      status: "تسویه",
      plan: [
        {
          installmentNumber: 1,
          title: "پرداخت یکجای سالانه با تخفیف استعداد درخشان",
          amount: 48000000,
          dueDate: "۱۴۰۳/۰۶/۲۰",
          status: "PAID",
          trackingCode: "TRX-994101",
          paymentDate: "۱۴۰۳/۰۶/۱۹",
        },
      ],
    },
    {
      studentId: mohammad.id,
      totalAmount: 48000000,
      paidAmount: 16000000,
      status: "معوق",
      plan: [
        {
          installmentNumber: 1,
          title: "پیش‌پرداخت ثبت‌نام",
          amount: 16000000,
          dueDate: "۱۴۰۳/۰۶/۱۵",
          status: "PAID",
          trackingCode: "TRX-771120",
          paymentDate: "۱۴۰۳/۰۶/۱۵",
        },
        {
          installmentNumber: 2,
          title: "چک صیادی قسط اول (آبان)",
          amount: 16000000,
          dueDate: "۱۴۰۳/۰۸/۳۰",
          status: "OVERDUE", // معوق
          trackingCode: "CHK-119902",
          paymentDate: null,
        },
        {
          installmentNumber: 3,
          title: "چک صیادی قسط دوم (بهمن)",
          amount: 16000000,
          dueDate: "۱۴۰۳/۱۱/۳۰",
          status: "PENDING",
          trackingCode: "CHK-119903",
          paymentDate: null,
        },
      ],
    },
  ];

  for (const tp of tuitionPlans) {
    await prisma.tuitionRecord.create({
      data: {
        studentId: tp.studentId,
        totalAmount: tp.totalAmount,
        paidAmount: tp.paidAmount,
        status: tp.status,
        planJson: JSON.stringify(tp.plan),
      },
    });
  }
  console.log("✓ Seeded realistic Tuition records with installment schedules");

  // 2. Seed Student Study Logs (گزارش مطالعه روزانه و تست)
  await prisma.studyLog.deleteMany();

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - i);

    // Ali's study logs
    await prisma.studyLog.create({
      data: {
        studentId: ali.id,
        subjectId: mathSubject.id,
        date: logDate,
        studyMinutes: 90 + (i % 3) * 20, // 90 to 130 mins
        testCount: 25 + (i % 4) * 5, // 25 to 40 tests
        note: `مطالعه مبحث حسابان و تست‌های جامع نهایی سال‌های گذشته (روز ${7 - i})`,
      },
    });

    if (physicsSubject) {
      await prisma.studyLog.create({
        data: {
          studentId: ali.id,
          subjectId: physicsSubject.id,
          date: logDate,
          studyMinutes: 60 + (i % 2) * 20,
          testCount: 15 + (i % 3) * 5,
          note: "مرور نکات فیزیک و تست‌های الکتریسیته ساکن",
        },
      });
    }

    // Sara's study logs
    await prisma.studyLog.create({
      data: {
        studentId: sara.id,
        subjectId: mathSubject.id,
        date: logDate,
        studyMinutes: 80 + (i % 2) * 30,
        testCount: 20 + (i % 3) * 10,
        note: "حل تمرین کتاب درسی و تست‌های طبقه‌بندی شده",
      },
    });
  }
  console.log("✓ Seeded 7-day realistic Study Logs (hours & test counts) for students");

  // 3. Seed AI-Assisted Weekly Study Plan (برنامه مطالعاتی هفتگی مشاور)
  await prisma.studyPlan.deleteMany();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const weeklySchedule = [
    {
      day: "شنبه",
      dateFa: "شنبه",
      slots: [
        { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "حسابان و ریاضی ۳", topic: "مشتق توابع کسری و زنجیره‌ای (جبران ضعف)", targetMinutes: 90, targetTests: 25, isFocusTopic: true },
        { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "فیزیک ۳", topic: "حرکت‌شناسی و سرعت متوسط", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
      ],
    },
    {
      day: "یکشنبه",
      dateFa: "یکشنبه",
      slots: [
        { time: "۱۶:۰۰ - ۱۷:۱۵", subject: "هندسه ۳", topic: "ماتریس و اعمال روی آن", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
        { time: "۱۷:۴۵ - ۱۹:۰۰", subject: "شیمی ۳", topic: "ترمودینامیک و آنتالپی واکنش", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
      ],
    },
    {
      day: "دوشنبه",
      dateFa: "دوشنبه",
      slots: [
        { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "حسابان و ریاضی ۳", topic: "کاربرد مشتق و اکسترمم‌های نسبی", targetMinutes: 90, targetTests: 30, isFocusTopic: true },
        { time: "۱۸:۰۰ - ۱۹:۰۰", subject: "ادبیات فارسی ۳", topic: "آرایه‌های ادبی و قرابت معنایی", targetMinutes: 60, targetTests: 25, isFocusTopic: false },
      ],
    },
    {
      day: "سه‌شنبه",
      dateFa: "سه‌شنبه",
      slots: [
        { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "فیزیک ۳", topic: "دینامیک و قوانین نیوتون", targetMinutes: 90, targetTests: 25, isFocusTopic: false },
        { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "حسابان و ریاضی ۳", topic: "مرور نکات لایتنر و بازآزمایی اشتباهات", targetMinutes: 75, targetTests: 20, isFocusTopic: true },
      ],
    },
    {
      day: "چهارشنبه",
      dateFa: "چهارشنبه",
      slots: [
        { time: "۱۶:۰۰ - ۱۷:۳۰", subject: "گسسته و جبر", topic: "نظریه گراف و مبانی ترکیبیات", targetMinutes: 90, targetTests: 25, isFocusTopic: false },
        { time: "۱۸:۰۰ - ۱۹:۱۵", subject: "زبان انگلیسی ۳", topic: "واژگان تخصصی و درک مطلب", targetMinutes: 75, targetTests: 20, isFocusTopic: false },
      ],
    },
    {
      day: "پنجشنبه",
      dateFa: "پنجشنبه",
      slots: [
        { time: "۰۹:۰۰ - ۱۱:۰۰", subject: "آزمون شبیه‌ساز کنکور", topic: "جامع دروس اختصاصی دوازدهم ریاضی", targetMinutes: 120, targetTests: 60, isFocusTopic: false },
        { time: "۱۶:۰۰ - ۱۸:۰۰", subject: "تحلیل آزمون و رفع اشکال", topic: "بررسی گزینه‌های دامدار و ثبت در دفترچه اشتباهات", targetMinutes: 120, targetTests: 0, isFocusTopic: true },
      ],
    },
    {
      day: "جمعه",
      dateFa: "جمعه",
      slots: [
        { time: "۱۰:۰۰ - ۱۱:۳۰", subject: "جمع‌بندی هفتگی", topic: "مرور کارت‌های لایتنر خانه ۴ و ۵", targetMinutes: 90, targetTests: 30, isFocusTopic: false },
        { time: "استراحت و ورزش", subject: "برنامه‌ریزی هفته بعد", topic: "جلسه کوتاه بررسی عملکرد با اولیا", targetMinutes: 60, targetTests: 0, isFocusTopic: false },
      ],
    },
  ];

  await prisma.studyPlan.create({
    data: {
      counselorId: counselor.id,
      studentId: ali.id,
      weekStartDate: startOfWeek,
      weekEndDate: endOfWeek,
      scheduleJson: JSON.stringify(weeklySchedule),
      counselorNote:
        "علی عزیز، تمرکز ویژه این هفته روی رفع نقاط ضعف شناسایی‌شده در رادار تسلط فصل مشتق (توابع کسری) قرار داده شده است. روز پنج‌شنبه حتماً تحلیل آزمون را دقیق انجام بده. موفق باشی!",
      isApproved: true,
    },
  });
  console.log("✓ Seeded AI-Assisted Weekly Study Plan with tailored focus topics");

  // 4. Seed Service SMS Dispatcher Logs (پیامک‌های هوشمند)
  await prisma.smsLog.deleteMany();

  const smsLogs = [
    {
      recipientPhone: "09127777777", // ولی علی رضایی
      recipientName: "مهندس حسین رضایی (ولی علی)",
      studentId: ali.id,
      type: "WEEKLY_DIGEST",
      message:
        "دبیرستان علامه حلی ۱: گزارش هفتگی علی رضایی؛ مجموع ساعات مطالعه: ۱۸.۵ ساعت، تکالیف تکمیل‌شده: ۱۰۰٪، تسلط بر مشتق: ۸۵٪. وضعیت آموزشی مطلوب است. مشاهده جزئیات: https://helli1.sch.ir/p/ali",
      status: "DELIVERED",
      providerRef: "MAGFA-99201",
      sentAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    {
      recipientPhone: "09127777777",
      recipientName: "مهندس حسین رضایی",
      studentId: ali.id,
      type: "COMMUTE_ALERT",
      message:
        "دبیرستان علامه حلی ۱: فرزند شما علی رضایی در ساعت ۰۷:۲۴ صبح وارد مدرسه شد و در کلاس ۱۲/۱ حضور یافت.",
      status: "DELIVERED",
      providerRef: "MAGFA-99202",
      sentAt: new Date(Date.now() - 5 * 3600 * 1000),
    },
    {
      recipientPhone: "09124444444",
      recipientName: "ولی محترم محمد کاظمی",
      studentId: mohammad.id,
      type: "ABSENCE_ALERT",
      message:
        "هشدار فوری دبیرستان علامه حلی ۱: دانش‌آموز محمد کاظمی امروز در زنگ اول غایب بوده است. لطفاً جهت اطلاع از علت غیبت با معاونت تماس حاصل فرمایید.",
      status: "DELIVERED",
      providerRef: "MAGFA-99203",
      sentAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
    {
      recipientPhone: "09124444444",
      recipientName: "ولی محترم محمد کاظمی",
      studentId: mohammad.id,
      type: "TUITION_REMINDER",
      message:
        "دبیرستان علامه حلی ۱: یادآوری؛ سررسید چک قسط دوم شهریه دانش‌آموز محمد کاظمی معوق شده است. جهت تسویه حساب به پنل مالی مراجعه نمایید.",
      status: "DELIVERED",
      providerRef: "MAGFA-99204",
      sentAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
    {
      recipientPhone: "09123333333",
      recipientName: "ولی محترم سارا علوی",
      studentId: sara.id,
      type: "GENERAL",
      message:
        "دبیرستان علامه حلی ۱: با سپاس از اولیای گرامی، شهریه سالانه دانش‌آموز سارا علوی به طور کامل تسویه گردید و کارنامه رسمی آماده مشاهده است.",
      status: "DELIVERED",
      providerRef: "MAGFA-99205",
      sentAt: new Date(Date.now() - 72 * 3600 * 1000),
    },
  ];

  for (const s of smsLogs) {
    await prisma.smsLog.create({
      data: s,
    });
  }
  console.log("✓ Seeded realistic SMS Logs across absence, commute, tuition and weekly digests");

  console.log("=== DAY 9 SEEDING COMPLETED SUCCESSFULLY ===");
}

seedDay9()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
