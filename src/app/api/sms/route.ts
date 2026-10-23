import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsNotification } from "@/lib/smsService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // کیف پول پیامک
    const wallet = await prisma.smsWallet.findUnique({
      where: { id: "default-wallet" },
    });

    // الگوهای پیامک
    const templates = await prisma.smsTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // لاگ‌های ارسالی با فیلتر
    const whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.type = category;
    }
    if (search) {
      whereClause.OR = [
        { recipientName: { contains: search } },
        { recipientPhone: { contains: search } },
        { message: { contains: search } },
        { studentName: { contains: search } },
      ];
    }

    const logs = await prisma.smsLog.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    // آمار تجمیعی
    const totalLogs = await prisma.smsLog.count();
    const deliveredCount = await prisma.smsLog.count({ where: { status: "DELIVERED" } });
    const absenceAlertCount = await prisma.smsLog.count({ where: { type: "ABSENCE_ALERT" } });
    const gradeAlertCount = await prisma.smsLog.count({ where: { type: "GRADE_ALERT" } });

    return NextResponse.json({
      success: true,
      wallet: wallet || {
        balanceToman: 2450000,
        smsRateToman: 120,
        totalSent: totalLogs,
        deliveryRate: 98.7,
        providerName: "KavehNegar Enterprise VIP",
        senderNumber: "10008899",
      },
      stats: {
        totalSent: totalLogs,
        deliveredCount,
        deliveryPercentage: totalLogs > 0 ? ((deliveredCount / totalLogs) * 100).toFixed(1) : "99.0",
        absenceAlertCount,
        gradeAlertCount,
      },
      templates,
      logs,
    });
  } catch (error: any) {
    console.error("SMS API GET error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت اطلاعات پیامک" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipientPhone,
      recipientName,
      recipientRole = "PARENT",
      message,
      type = "GENERAL",
      studentName,
      senderId = "principal-demo",
      recipients, // در صورت ارسال گروهی
    } = body;

    // ارسال گروهی (Bulk SMS)
    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      const results = [];
      for (const r of recipients) {
        if (!r.phone || !message) continue;
        const res = await sendSmsNotification({
          recipientPhone: r.phone,
          recipientName: r.name || "گیرنده پیامک",
          recipientRole: r.role || recipientRole,
          studentName: r.studentName || studentName,
          message,
          type,
          senderId,
        });
        results.push(res);
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        message: `${results.length} پیامک با موفقیت در صف ارسال درگاه قرار گرفت.`,
      });
    }

    // ارسال تکی
    if (!recipientPhone || !message) {
      return NextResponse.json({ success: false, error: "شماره گیرنده و متن پیامک الزامی است" }, { status: 400 });
    }

    const newLog = await sendSmsNotification({
      recipientPhone,
      recipientName: recipientName || "مخاطب",
      recipientRole,
      studentName,
      message,
      type,
      senderId,
    });

    return NextResponse.json({
      success: true,
      log: newLog,
      message: "پیامک با موفقیت به درگاه مخابراتی ارسال گردید.",
    });
  } catch (error: any) {
    console.error("SMS API POST error:", error);
    return NextResponse.json({ success: false, error: "خطا در پردازش ارسال پیامک" }, { status: 500 });
  }
}
