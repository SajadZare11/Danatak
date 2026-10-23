import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Virtual Classroom seeding for Danatak...");

  // ایجاد یا به‌روزرسانی جلسه کلاس زنده
  const session = await prisma.virtualClassroomSession.upsert({
    where: { id: "live-session-calculus" },
    update: {
      title: "جلسه آنلاین حسابان ۲ - مبحث مشتق و اکسترمم‌های نسبی",
      teacherName: "استاد احسان محمدی",
      subjectName: "حسابان ۲",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      status: "LIVE",
      isRecording: true,
      activeSlide: "TEXTBOOK_P42",
      startedAt: new Date(Date.now() - 1000 * 60 * 35), // ۳۵ دقیقه قبل شروع شده
    },
    create: {
      id: "live-session-calculus",
      title: "جلسه آنلاین حسابان ۲ - مبحث مشتق و اکسترمم‌های نسبی",
      teacherName: "استاد احسان محمدی",
      subjectName: "حسابان ۲",
      className: "کلاس ۱۲/۱ (دوازدهم ریاضی)",
      status: "LIVE",
      isRecording: true,
      activeSlide: "TEXTBOOK_P42",
      startedAt: new Date(Date.now() - 1000 * 60 * 35),
    },
  });

  // حاضرین جلسه
  const attendees = [
    {
      id: "att-teacher",
      sessionId: session.id,
      userId: "teacher-demo",
      userName: "استاد احسان محمدی (دبیر)",
      userRole: "TEACHER",
      isHandRaised: false,
      isMicOn: true,
    },
    {
      id: "att-ali",
      sessionId: session.id,
      userId: "student-demo",
      userName: "علی رضایی",
      userRole: "STUDENT",
      isHandRaised: true, // دستش بالاست جهت سوال پرسیدن
      isMicOn: false,
    },
    {
      id: "att-bagheri",
      sessionId: session.id,
      userId: "student-02",
      userName: "محمد باقری",
      userRole: "STUDENT",
      isHandRaised: false,
      isMicOn: false,
    },
    {
      id: "att-sharifi",
      sessionId: session.id,
      userId: "student-03",
      userName: "سجاد شریفی",
      userRole: "STUDENT",
      isHandRaised: false,
      isMicOn: false,
    },
  ];

  for (const att of attendees) {
    await prisma.virtualClassroomAttendee.upsert({
      where: { id: att.id },
      update: att,
      create: att,
    });
  }

  // پیام‌های گفتگوی زنده متنی
  const chatMessages = [
    {
      id: "chat-01",
      sessionId: session.id,
      senderName: "استاد احسان محمدی",
      senderRole: "TEACHER",
      message: "سلام به همگی، لطفا صفحه ۴۲ کتاب حسابان ۲ را روی تخته مشاهده کنید و مثال قضیه رول را با هم بررسی کنیم.",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "chat-02",
      sessionId: session.id,
      senderName: "محمد باقری",
      senderRole: "STUDENT",
      message: "سلام استاد، تصویر تخته و صدای شما با کیفیت عالی دریافت می‌شود.",
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      id: "chat-03",
      sessionId: session.id,
      senderName: "علی رضایی",
      senderRole: "STUDENT",
      message: "استاد ببخشید، در خط سوم قضیه، چرا مشتق در نقاط مرزی بازه بررسی نمی‌شود؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "chat-04",
      sessionId: session.id,
      senderName: "استاد احسان محمدی",
      senderRole: "TEACHER",
      message: "علی جان سوال بسیار دقیقی پرسیدی، الان دستت رو دیدم، میکروفونت رو باز می‌کنم تا با هم روی تخته توضیح بدیم.",
      createdAt: new Date(Date.now() - 1000 * 60 * 2),
    },
  ];

  for (const msg of chatMessages) {
    await prisma.virtualClassroomChatMessage.upsert({
      where: { id: msg.id },
      update: msg,
      create: msg,
    });
  }

  console.log("✅ Virtual Classroom seeded: 1 Active Live Session, 4 Attendees, 4 Chat Messages.");
}

main()
  .catch((e) => {
    console.error("❌ Classroom Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
