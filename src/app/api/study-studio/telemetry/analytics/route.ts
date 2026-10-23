import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TelemetryAnalyticsService } from "@/lib/study-studio/telemetryAnalytics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");

    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      studentId = defaultStudent?.id || null;
    }

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "شناسه دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const report = await TelemetryAnalyticsService.getStudentReport(studentId);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("Error generating telemetry analytics report:", error);
    return NextResponse.json(
      { success: false, error: "خطا در استخراج گزارش دورسنجی مطالعه", details: error?.message },
      { status: 500 }
    );
  }
}
