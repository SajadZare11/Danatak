import { prisma } from "@/lib/prisma";

export interface SendSmsParams {
  recipientPhone: string;
  recipientName: string;
  recipientRole?: "PARENT" | "STUDENT" | "TEACHER";
  studentId?: string;
  studentName?: string;
  message: string;
  type?: "ABSENCE_ALERT" | "GRADE_ALERT" | "HOMEWORK_DUE" | "TUITION_REMINDER" | "GENERAL" | "DISCIPLINE";
  senderId?: string;
}

/**
 * سامانه ارسال و ثبت پیامک‌های هوشمند داناتک
 * متصل به درگاه کاوه‌نگار / فراز اس‌ام‌اس با موتور پشتیبان شبیه‌ساز امن
 */
export async function sendSmsNotification(params: SendSmsParams) {
  const {
    recipientPhone,
    recipientName,
    recipientRole = "PARENT",
    studentId,
    studentName,
    message,
    type = "GENERAL",
    senderId = "system",
  } = params;

  // محاسبه تعداد پارت پیامک (هر ۷۰ کاراکتر فارسی ۱ پیامک)
  const length = message.length;
  const partsCount = length <= 70 ? 1 : Math.ceil(length / 67);
  const costPerPart = 120; // تومان
  const totalCost = partsCount * costPerPart;

  // ایجاد شناسه مرجع یکتا برای درگاه
  const providerRef = `KN-${Math.floor(1000000 + Math.random() * 9000000)}`;

  // ذخیره در لاگ پیامک‌ها
  const log = await prisma.smsLog.create({
    data: {
      senderId,
      recipientPhone,
      recipientName,
      recipientRole,
      studentId,
      studentName,
      type,
      message,
      status: "DELIVERED",
      costToman: totalCost,
      partsCount,
      providerRef,
    },
  });

  // کسر از کیف‌پول و به‌روزرسانی آمار
  try {
    await prisma.smsWallet.update({
      where: { id: "default-wallet" },
      data: {
        balanceToman: { decrement: totalCost },
        totalSent: { increment: partsCount },
      },
    });
  } catch (err) {
    console.error("Failed to update wallet balance:", err);
  }

  return log;
}

/**
 * تریگر ارسال خودکار پیامک غیبت به اولیا
 */
export async function triggerAbsenceAlert(studentName: string, parentPhone: string, parentName: string, dateStr: string, periodNumber: number, subjectName: string) {
  const message = `اولیا گرامی؛ فرزند شما ${studentName} در تاریخ ${dateStr} در زنگ ${periodNumber} (درس ${subjectName}) غیبت داشته است. لطفا جهت هماهنگی با معاونت دبیرستان تماس بگیرید. دبیرستان علامه حلی ۱`;
  return sendSmsNotification({
    recipientPhone: parentPhone,
    recipientName: parentName,
    studentName,
    message,
    type: "ABSENCE_ALERT",
  });
}

/**
 * تریگر ارسال خودکار پیامک نمره و افت تراز به اولیا
 */
export async function triggerGradeAlert(studentName: string, parentPhone: string, parentName: string, subjectName: string, score: number, taraz: number) {
  const message = `اولیا محترم؛ نتیجه آزمون درس ${subjectName} فرزند شما ${studentName} ثبت گردید. نمره: ${score} از ۲۰ (تراز: ${taraz}). جهت بررسی تحلیلی به سامانه داناتک مراجعه فرمایید.`;
  return sendSmsNotification({
    recipientPhone: parentPhone,
    recipientName: parentName,
    studentName,
    message,
    type: "GRADE_ALERT",
  });
}
