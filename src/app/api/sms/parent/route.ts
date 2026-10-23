import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "student-demo";
    const phone = searchParams.get("phone") || "09121234567";

    const notifications = await prisma.smsLog.findMany({
      where: {
        OR: [
          { recipientPhone: phone },
          { studentId: studentId },
          { studentName: { contains: "علی رضایی" } },
        ],
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error("SMS Parent API error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت پیامک‌های اولیا" }, { status: 500 });
  }
}
