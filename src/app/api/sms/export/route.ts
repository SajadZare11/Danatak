import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.type = category;
    }

    const logs = await prisma.smsLog.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
    });

    // ترجمه نوع پیامک به فارسی
    const categoryMap: Record<string, string> = {
      ABSENCE_ALERT: "هشدار غیبت کلاسی",
      GRADE_ALERT: "افت نمره و تراز",
      HOMEWORK_DUE: "یادآوری تکلیف",
      TUITION_REMINDER: "سررسید قسط شهریه",
      GENERAL: "اطلاعیه عمومی",
      DISCIPLINE: "انضباطی / تشویقی",
    };

    const statusMap: Record<string, string> = {
      DELIVERED: "تحویل داده شده",
      SENT: "ارسال شده به مخابرات",
      PENDING: "در صف ارسال",
      FAILED: "ناموفق / بلک‌لیست",
    };

    // سرستون‌های فارسی
    const headers = [
      "ردیف",
      "شناسه مرجع درگاه",
      "نام و عنوان گیرنده",
      "شماره تلفن همراه",
      "نقش گیرنده",
      "نام دانش‌آموز مربوطه",
      "دسته‌بندی اعلان",
      "وضعیت تحویل",
      "تعداد پارت",
      "هزینه (تومان)",
      "تاریخ و زمان ارسال",
      "متن پیامک ارسالی",
    ];

    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logs.map((log, index) => {
      const dateFormatted = new Date(log.sentAt).toLocaleString("fa-IR", {
        timeZone: "Asia/Tehran",
      });

      return [
        index + 1,
        log.providerRef || `ID-${log.id.slice(0, 8)}`,
        log.recipientName,
        log.recipientPhone,
        log.recipientRole === "PARENT" ? "اولیا" : log.recipientRole === "STUDENT" ? "دانش‌آموز" : "همکار",
        log.studentName || "-",
        categoryMap[log.type] || log.type,
        statusMap[log.status] || log.status,
        log.partsCount,
        log.costToman,
        dateFormatted,
        log.message,
      ]
        .map(escapeCsvField)
        .join(",");
    });

    // اضافه کردن بایت UTF-8 BOM جهت باز شدن بی‌نقص در اکسل فارسی
    const csvContent = "\uFEFF" + [headers.map(escapeCsvField).join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="danatak-sms-outbox-export-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("SMS Export API error:", error);
    return NextResponse.json({ success: false, error: "خطا در صدور فایل اکسل پیامک‌ها" }, { status: 500 });
  }
}
