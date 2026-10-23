import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting SMS Gateway seeding for Danatak...");

  // ۱. ایجاد یا به‌روزرسانی کیف‌پول پیامک
  await prisma.smsWallet.upsert({
    where: { id: "default-wallet" },
    update: {
      balanceToman: 2450000,
      smsRateToman: 120,
      totalSent: 1428,
      deliveryRate: 98.7,
      providerName: "KavehNegar Enterprise VIP",
      senderNumber: "10008899",
    },
    create: {
      id: "default-wallet",
      balanceToman: 2450000,
      smsRateToman: 120,
      totalSent: 1428,
      deliveryRate: 98.7,
      providerName: "KavehNegar Enterprise VIP",
      senderNumber: "10008899",
    },
  });

  // ۲. ایجاد قالب‌ها و الگوهای پیامک پیش‌فرض
  const templates = [
    {
      id: "tpl-absence",
      title: "هشدار غیبت زنده در کلاس",
      category: "ABSENCE_ALERT",
      templateBody: "اولیا گرامی؛ فرزند شما {studentName} در تاریخ {date} در زنگ {period} (درس {subject}) غیبت داشته است. لطفا جهت هماهنگی با معاونت تماس بگیرید. دبیرستان علامه حلی ۱",
      variables: JSON.stringify(["studentName", "date", "period", "subject"]),
      isActive: true,
    },
    {
      id: "tpl-grade-drop",
      title: "هشدار افت نمره و تراز آزمون",
      category: "GRADE_ALERT",
      templateBody: "اولیا محترم؛ نتیجه آزمون درس {subject} فرزند شما {studentName} ثبت گردید. نمره: {score} از ۲۰ (تراز: {taraz}). جهت دریافت برنامه جبرانی به سامانه داناتک مراجعه فرمایید.",
      variables: JSON.stringify(["studentName", "subject", "score", "taraz"]),
      isActive: true,
    },
    {
      id: "tpl-homework-due",
      title: "یادآوری مهلت تحویل تکلیف",
      category: "HOMEWORK_DUE",
      templateBody: "دانش‌آموز گرامی {studentName}؛ مهلت ارسال پاسخ تکلیف {assignmentTitle} تا ساعت {dueTime} امشب می‌باشد. دبیرستان علامه حلی ۱",
      variables: JSON.stringify(["studentName", "assignmentTitle", "dueTime"]),
      isActive: true,
    },
    {
      id: "tpl-tuition",
      title: "یادآوری سررسید قسط شهریه",
      category: "TUITION_REMINDER",
      templateBody: "اولیا گرامی؛ سررسید قسط {installmentTitle} شهریه فرزندتان {studentName} به مبلغ {amount} ریال نزدیک است. پرداخت آنلاین: danatak.ir/parent",
      variables: JSON.stringify(["installmentTitle", "studentName", "amount"]),
      isActive: true,
    },
    {
      id: "tpl-pta-meeting",
      title: "دعوت به مجمع اولیا و مربیان",
      category: "GENERAL",
      templateBody: "اولیا ارجمند دانش‌آموز {studentName}؛ مجمع عمومی اولیا و مربیان روز {day} مورخ {date} ساعت ۱۵ در تالار خواجه‌نصیر برگزار می‌گردد. حضور شما موجب امتنان است.",
      variables: JSON.stringify(["studentName", "day", "date"]),
      isActive: true,
    },
    {
      id: "tpl-praise",
      title: "پیامک تشویق و جهش تحصیلی",
      category: "DISCIPLINE",
      templateBody: "اولیا گرامی؛ فرزند شما {studentName} در درس {subject} موفق به کسب بالاترین تراز کلاسی گردید. با آرزوی تداوم درخشش - مدیریت دبیرستان علامه حلی ۱",
      variables: JSON.stringify(["studentName", "subject"]),
      isActive: true,
    },
  ];

  for (const tpl of templates) {
    await prisma.smsTemplate.upsert({
      where: { id: tpl.id },
      update: tpl,
      create: tpl,
    });
  }

  // ۳. ایجاد تاریخچه لاگ‌های پیامک ارسالی (Outbox Logs)
  const logs = [
    {
      id: "sms-log-01",
      senderId: "principal-demo",
      recipientPhone: "09121234567",
      recipientName: "مهندس حسین رضایی",
      recipientRole: "PARENT",
      studentId: "student-demo",
      studentName: "علی رضایی",
      type: "ABSENCE_ALERT",
      message: "اولیا گرامی؛ فرزند شما علی رضایی در تاریخ ۱۴۰۳/۰۸/۰۲ در زنگ ۳ (درس فیزیک ۳) غیبت داشته است. لطفا جهت هماهنگی با معاونت تماس بگیرید. دبیرستان علامه حلی ۱",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921441",
      sentAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
    {
      id: "sms-log-02",
      senderId: "teacher-demo",
      recipientPhone: "09121234567",
      recipientName: "مهندس حسین رضایی",
      recipientRole: "PARENT",
      studentId: "student-demo",
      studentName: "علی رضایی",
      type: "GRADE_ALERT",
      message: "اولیا محترم؛ نتیجه آزمون درس حسابان ۲ فرزند شما علی رضایی ثبت گردید. نمره: ۱۸.۵ از ۲۰ (تراز: ۶۷۲۰). جهت مشاهده تحلیل جزئی به سامانه داناتک مراجعه فرمایید.",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921442",
      sentAt: new Date(Date.now() - 3600 * 1000 * 18),
    },
    {
      id: "sms-log-03",
      senderId: "system",
      recipientPhone: "09129876543",
      recipientName: "آقای علیرضا باقری (ولی محمد)",
      recipientRole: "PARENT",
      studentId: "student-02",
      studentName: "محمد باقری",
      type: "HOMEWORK_DUE",
      message: "اولیا گرامی؛ فرزند شما محمد باقری تا این ساعت تکلیف هندسه ۳ (مبحث بیضی) را ارسال نکرده است. مهلت تا ساعت ۲۴ امشب. دبیرستان علامه حلی ۱",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921443",
      sentAt: new Date(Date.now() - 3600 * 1000 * 26),
    },
    {
      id: "sms-log-04",
      senderId: "system",
      recipientPhone: "09121234567",
      recipientName: "مهندس حسین رضایی",
      recipientRole: "PARENT",
      studentId: "student-demo",
      studentName: "علی رضایی",
      type: "TUITION_REMINDER",
      message: "اولیا گرامی؛ سررسید قسط دوم شهریه فرزندتان علی رضایی به مبلغ ۴۵,۰۰۰,۰۰۰ ریال تا ۳ روز آینده می‌باشد. پرداخت آنلاین در پرتال اولیا: danatak.ir/parent",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921444",
      sentAt: new Date(Date.now() - 3600 * 1000 * 48),
    },
    {
      id: "sms-log-05",
      senderId: "principal-demo",
      recipientPhone: "09125554433",
      recipientName: "دکتر مسعود شریفی (ولی سجاد)",
      recipientRole: "PARENT",
      studentId: "student-03",
      studentName: "سجاد شریفی",
      type: "DISCIPLINE",
      message: "اولیا گرامی؛ فرزند شما سجاد شریفی در آزمون جامع سنجش موفق به کسب رتبه ۲ پایه دوازدهم گردید. این موفقیت را به شما تبریک می‌گوییم. مدیریت دبیرستان علامه حلی ۱",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921445",
      sentAt: new Date(Date.now() - 3600 * 1000 * 60),
    },
    {
      id: "sms-log-06",
      senderId: "counselor-demo",
      recipientPhone: "09124443322",
      recipientName: "سرکار خانم موسوی (ولی پویا)",
      recipientRole: "PARENT",
      studentId: "student-04",
      studentName: "پویا کریمی",
      type: "GRADE_ALERT",
      message: "اولیا محترم؛ افت تراز تحصیلی در آزمون شیمی ۳ برای فرزندتان پویا کریمی ثبت گردید. لطفا جهت دریافت وقت مشاوره روز دوشنبه به مرکز مراجعه فرمایید.",
      status: "SENT",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921446",
      sentAt: new Date(Date.now() - 3600 * 1000 * 12),
    },
    {
      id: "sms-log-07",
      senderId: "principal-demo",
      recipientPhone: "09351112233",
      recipientName: "آقای یزدانی (ولی آرین)",
      recipientRole: "PARENT",
      studentId: "student-05",
      studentName: "آرین یزدانی",
      type: "GENERAL",
      message: "اولیا گرامی؛ جلسه معارفه المپیادهای علمی روز چهارشنبه ساعت ۱۶ در سالن همایش دبیرستان برگزار می‌گردد.",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921447",
      sentAt: new Date(Date.now() - 3600 * 1000 * 72),
    },
    {
      id: "sms-log-08",
      senderId: "system",
      recipientPhone: "09123332211",
      recipientName: "خانم ناصری (ولی امیرعلی)",
      recipientRole: "PARENT",
      studentId: "student-06",
      studentName: "امیرعلی ناصری",
      type: "ABSENCE_ALERT",
      message: "اولیا گرامی؛ فرزند شما امیرعلی ناصری امروز با ۱۵ دقیقه تاخیر در زنگ اول حاضر شده است. معاونت انضباطی دبیرستان علامه حلی ۱",
      status: "DELIVERED",
      costToman: 120,
      partsCount: 1,
      providerRef: "KN-9921448",
      sentAt: new Date(Date.now() - 3600 * 1000 * 2),
    },
  ];

  for (const log of logs) {
    await prisma.smsLog.upsert({
      where: { id: log.id },
      update: log,
      create: log,
    });
  }

  console.log("✅ SMS Gateway successfully seeded: 1 Wallet, 6 Templates, 8 Historical Outbox Logs.");
}

main()
  .catch((e) => {
    console.error("❌ SMS Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
