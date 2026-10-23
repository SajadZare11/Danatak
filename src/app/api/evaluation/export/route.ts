import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const summaries = await prisma.teacherEvaluationSummary.findMany({
      orderBy: { overallScore: "desc" },
    });

    const headers = [
      "رتبه",
      "نام و نام خانوادگی دبیر",
      "عنوان درس تخصصی",
      "امتیاز کل از ۱۰۰",
      "رضایت دانش‌آموزان (٪)",
      "رضایت اولیا (٪)",
      "تعداد کل ارزیابی‌ها",
      "تسلط علمی (از ۵)",
      "عدالت نمره‌دهی (از ۵)",
      "اخلاق حرفه‌ای (از ۵)",
      "نظم کلاسی (از ۵)",
      "انگیزش‌بخشی (از ۵)",
      "ارتباط با اولیا (از ۵)",
      "نقاط قوت شاخص (هوش مصنوعی)",
      "توصیه‌های بهبود تدریس (هوش مصنوعی)",
    ];

    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = summaries.map((s, index) => {
      return [
        index + 1,
        s.teacherName,
        s.subjectName,
        s.overallScore,
        s.studentSatisfaction,
        s.parentSatisfaction,
        s.totalEvaluations,
        s.radarMastery,
        s.radarFairness,
        s.radarEthics,
        s.radarDiscipline,
        s.radarInspiration,
        s.radarEngagement,
        s.aiSummaryStrengths || "-",
        s.aiSummaryImprovements || "-",
      ]
        .map(escapeCsvField)
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.map(escapeCsvField).join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="danatak-teacher-evaluation-report-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Evaluation Export error:", error);
    return NextResponse.json({ success: false, error: "خطا در خروجی اکسل ارزشیابی" }, { status: 500 });
  }
}
