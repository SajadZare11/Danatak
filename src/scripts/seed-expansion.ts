import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Danatak Expansion Suite (Schedule, Messages & Library)...");

  // ۱. دریافت کاربران و کلاس‌ها
  const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const studentUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const principalUser = await prisma.user.findFirst({ where: { role: "PRINCIPAL" } });
  const parentUser = await prisma.user.findFirst({ where: { role: "PARENT" } });
  const counselorUser = await prisma.user.findFirst({ where: { role: "COUNSELOR" } });

  const classroom = await prisma.classroom.findFirst();

  if (!classroom || !teacherUser || !studentUser || !principalUser) {
    console.error("Required seed data not found.");
    return;
  }

  // ۲. برنامه هفتگی شنبه تا چهارشنبه
  await prisma.timetablePeriod.deleteMany({ where: { classroomId: classroom.id } });

  const periodsData = [
    // شنبه (day 0)
    { dayOfWeek: 0, periodIndex: 1, startTime: "07:45", endTime: "09:15", subjectName: "حسابان ۲", teacherName: teacherUser.fullName, roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 0, periodIndex: 2, startTime: "09:30", endTime: "11:00", subjectName: "فیزیک ۳", teacherName: "استاد رضوی", roomNumber: "آزمایشگاه فیزیک" },
    { dayOfWeek: 0, periodIndex: 3, startTime: "11:15", endTime: "12:45", subjectName: "شیمی ۳", teacherName: "استاد جعفری", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 0, periodIndex: 4, startTime: "13:15", endTime: "14:30", subjectName: "هندسه ۳", teacherName: teacherUser.fullName, roomNumber: "کلاس ۲۰۱" },

    // یکشنبه (day 1)
    { dayOfWeek: 1, periodIndex: 1, startTime: "07:45", endTime: "09:15", subjectName: "فارسی و نگارش ۳", teacherName: "استاد کریمی", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 1, periodIndex: 2, startTime: "09:30", endTime: "11:00", subjectName: "حسابان ۲", teacherName: teacherUser.fullName, roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 1, periodIndex: 3, startTime: "11:15", endTime: "12:45", subjectName: "زبان انگلیسی ۳", teacherName: "استاد حسینی", roomNumber: "سایت زبان" },
    { dayOfWeek: 1, periodIndex: 4, startTime: "13:15", endTime: "14:30", subjectName: "دین و زندگی ۳", teacherName: "استاد اکبری", roomNumber: "کلاس ۲۰۱" },

    // دوشنبه (day 2)
    { dayOfWeek: 2, periodIndex: 1, startTime: "07:45", endTime: "09:15", subjectName: "فیزیک ۳", teacherName: "استاد رضوی", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 2, periodIndex: 2, startTime: "09:30", endTime: "11:00", subjectName: "ریاضیات گسسته", teacherName: "استاد نظری", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 2, periodIndex: 3, startTime: "11:15", endTime: "12:45", subjectName: "شیمی ۳", teacherName: "استاد جعفری", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 2, periodIndex: 4, startTime: "13:15", endTime: "14:30", subjectName: "کارگاه حل تست کنکور", teacherName: teacherUser.fullName, roomNumber: "آمفی‌تئاتر" },

    // سه‌شنبه (day 3)
    { dayOfWeek: 3, periodIndex: 1, startTime: "07:45", endTime: "09:15", subjectName: "حسابان ۲", teacherName: teacherUser.fullName, roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 3, periodIndex: 2, startTime: "09:30", endTime: "11:00", subjectName: "فیزیک ۳", teacherName: "استاد رضوی", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 3, periodIndex: 3, startTime: "11:15", endTime: "12:45", subjectName: "عربی زبان قرآن ۳", teacherName: "استاد موسوی", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 3, periodIndex: 4, startTime: "13:15", endTime: "14:30", subjectName: "هویت اجتماعی", teacherName: "استاد شفیعی", roomNumber: "کلاس ۲۰۱" },

    // چهارشنبه (day 4)
    { dayOfWeek: 4, periodIndex: 1, startTime: "07:45", endTime: "09:15", subjectName: "ریاضیات گسسته", teacherName: "استاد نظری", roomNumber: "کلاس ۲۰۱" },
    { dayOfWeek: 4, periodIndex: 2, startTime: "09:30", endTime: "11:00", subjectName: "شیمی ۳", teacherName: "استاد جعفری", roomNumber: "آزمایشگاه شیمی" },
    { dayOfWeek: 4, periodIndex: 3, startTime: "11:15", endTime: "12:45", subjectName: "تربیت بدنی و سلامت", teacherName: "استاد مرادی", roomNumber: "سالن ورزشی" },
    { dayOfWeek: 4, periodIndex: 4, startTime: "13:15", endTime: "14:30", subjectName: "مشاوره و هدایت کنکور", teacherName: counselorUser?.fullName || "خانم صابری", roomNumber: "سالن اجتماعات" },
  ];

  for (const p of periodsData) {
    await prisma.timetablePeriod.create({
      data: {
        classroomId: classroom.id,
        ...p,
      },
    });
  }
  console.log(`✓ Seeded ${periodsData.length} timetable periods for ${classroom.name}.`);

  // ۳. پیام‌های کانال اعلانات و رفع اشکال
  await prisma.channelMessage.deleteMany({});

  // اعلانات رسمی
  await prisma.channelMessage.create({
    data: {
      senderId: principalUser.id,
      type: "ANNOUNCEMENT",
      title: "برنامه برگزاری دومین مرحله آزمون جامع هماهنگ سمپاد",
      content: "با سلام و درود؛ به اطلاع کلیه دانش‌آموزان و اولیای گرامی می‌رساند مرحله دوم آزمون شبیه‌ساز کنکور سراسری روز پنج‌شنبه رأس ساعت ۸ صبح به صورت آنلاین در تالار آزمون داناتک برگزار می‌گردد. رعایت شرایط ضدتقلب و حضور به موقع الزامی است.",
      targetRole: "ALL",
      isPinned: true,
    },
  });

  await prisma.channelMessage.create({
    data: {
      senderId: principalUser.id,
      type: "ANNOUNCEMENT",
      title: "دعوت به مجمع عمومی اولیا و مربیان و تحویل کارنامه‌های تحلیلی دوره‌ای",
      content: "جلسه هم‌اندیشی اولیا و دبیران روز یکشنبه ساعت ۱۵ در سالن همایش‌های دبیرستان علامه حلی ۱ برگزار خواهد شد. کارنامه تحلیلی استاندارد A4 هر دانش‌آموز به همراه نمودارهای روان‌سنجی به والدین محترم تحویل داده می‌شود.",
      targetRole: "PARENT",
      isPinned: false,
    },
  });

  // تالار رفع اشکال (Q&A)
  const q1 = await prisma.channelMessage.create({
    data: {
      senderId: studentUser.id,
      type: "QA_QUESTION",
      title: "مشتق توابع کسری مثلثاتی با توان دوم",
      content: "سلام استاد محمدی وقتتون بخیر؛ در محاسبه مشتق تابع $f(x) = \\frac{\\sin^2(2x)}{x^2 + 1}$ در نقطه $x = 0$، مشتق صورت طبق قاعده زنجیره‌ای چگونه ساده می‌شود؟",
      subjectId: "MATH",
    },
  });

  await prisma.channelMessage.create({
    data: {
      senderId: teacherUser.id,
      type: "QA_ANSWER",
      parentId: q1.id,
      content: "درود بر علی رضایی عزیز؛ مشتق صورت $u = \\sin^2(2x)$ با قاعده زنجیره‌ای برابر است با $u' = 2\\sin(2x) \\cdot (2\\cos(2x)) = 2\\sin(4x)$. در نقطه $x=0$ مقدار $\\sin(0) = 0$ می‌شود، بنابراین مشتق کل تابع در مبدأ صفر است.",
      subjectId: "MATH",
    },
  });

  // پیام خصوصی
  if (parentUser) {
    await prisma.channelMessage.create({
      data: {
        senderId: parentUser.id,
        type: "PRIVATE_DM",
        title: "پیگیری وضعیت درسی علی در مبحث مشتق",
        content: "با سلام خدمت استاد محمدی گرامی؛ می‌خواستم جویای وضعیت تسلط علی در تکالیف هندسه و حسابان اخیر بشوم. با تشکر، حسین رضایی.",
        targetRole: "TEACHER",
      },
    });

    await prisma.channelMessage.create({
      data: {
        senderId: teacherUser.id,
        type: "PRIVATE_DM",
        title: "پاسخ به ولی دانش‌آموز علی رضایی",
        content: "سلام و احترام جناب مهندس رضایی؛ علی در مبحث مشتق به تسلط ۹۵٪ رسیده و تمام تکالیف لایتنر را در زمان مقرر تحویل داده است. وضعیت پیشرفت ایشان بسیار رضایت‌بخش است.",
        targetRole: "PARENT",
      },
    });
  }
  console.log("✓ Seeded announcements, Q&A threads and direct messages.");

  // ۴. مخزن کتابخانه دیجیتال و جزوه‌سرا
  await prisma.digitalLibraryResource.deleteMany({});

  const libraryItems = [
    {
      title: "کتاب درسی رسمی حسابان ۲ (پایه دوازدهم ریاضی)",
      category: "TEXTBOOK",
      gradeLevel: 12,
      major: "ریاضی",
      subjectName: "حسابان",
      fileUrl: "/docs/hesaban2-textbook.pdf",
      fileSize: "8.4 مگابایت",
      authorName: "وزارت آموزش و پرورش - چاپ جدید ۱۴۰۳",
      downloads: 142,
      description: "نسخه رسمی کتب درسی شامل تمام فصول: تابع، مثلثات، حد و پیوستگی، مشتق و کاربرد مشتق.",
    },
    {
      title: "جزوه جامع طلایی مشتق و کاربردهای هندسی (تست و تشریحی)",
      category: "TEACHER_NOTES",
      gradeLevel: 12,
      major: "ریاضی",
      subjectName: "حسابان",
      fileUrl: "/docs/derivative-master-notes.pdf",
      fileSize: "4.2 مگابایت",
      authorName: "استاد احسان محمدی (دبیرستان علامه حلی ۱)",
      downloads: 285,
      description: "خلاصه نکات تستی، دام‌های محاسباتی، قواعد مشتق‌گیری زنجیره‌ای و ۷۰ تست نشان‌دار کنکور سراسری.",
    },
    {
      title: "آرشیو سوالات امتحانات نهایی ادوار گذشته با کلید رسمی تصحیح",
      category: "PAST_EXAM",
      gradeLevel: 12,
      major: "ریاضی",
      subjectName: "حسابان",
      fileUrl: "/docs/final-exams-archive.pdf",
      fileSize: "6.1 مگابایت",
      authorName: "مرکز سنجش و پایش کیفیت آموزشی",
      downloads: 410,
      description: "مجموعه امتحانات نهایی خرداد، شهریور و دی‌ماه سال‌های ۱۴۰۰ الی ۱۴۰۳ با بارم‌بندی رسمی دبیرخانه.",
    },
    {
      title: "درسنامه چکیده فرمول‌های طلایی فیزیک ۳ (حرکت و دینامیک)",
      category: "TEACHER_NOTES",
      gradeLevel: 12,
      major: "ریاضی",
      subjectName: "فیزیک",
      fileUrl: "/docs/physics3-cheatsheet.pdf",
      fileSize: "3.5 مگابایت",
      authorName: "دپارتمان فیزیک سمپاد",
      downloads: 198,
      description: "فرمول‌نامه کامل حرکت بر خط راست، نمودار سرعت-زمان، قوانین نیوتن و تکانه به همراه مثال‌های تیپ‌بندی.",
    },
    {
      title: "دفترچه آزمون شبیه‌ساز کنکور سراسری تیرماه (پایه دوازدهم)",
      category: "PAST_EXAM",
      gradeLevel: 12,
      major: "ریاضی",
      subjectName: "جامع",
      fileUrl: "/docs/konkur-mock-exam.pdf",
      fileSize: "5.8 مگابایت",
      authorName: "آزمون‌های هماهنگ مدارس تیزهوشان",
      downloads: 320,
      description: "شامل ۱۰۰ تست دروس تخصصی (ریاضیات، فیزیک، شیمی) با جدول تراز سازمان سنجش.",
    },
  ];

  for (const item of libraryItems) {
    await prisma.digitalLibraryResource.create({ data: item });
  }
  console.log(`✓ Seeded ${libraryItems.length} digital library resources.`);

  console.log("✅ Danatak Expansion Suite seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
