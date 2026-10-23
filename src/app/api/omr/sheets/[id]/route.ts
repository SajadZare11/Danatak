import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sheet = await prisma.oMRAnswerSheet.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            avatarUrl: true,
          },
        },
        exam: {
          include: {
            classroom: true,
            teacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "پاسخ‌برگ مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    let parsedAnswerKey: string[] = [];
    let parsedStudentAnswers: (string | null)[] = [];
    let parsedDiagnostic: any = null;

    try {
      parsedAnswerKey = JSON.parse(sheet.answerKeyJson);
    } catch (e) {}

    try {
      parsedStudentAnswers = JSON.parse(sheet.studentAnswersJson);
    } catch (e) {}

    try {
      parsedDiagnostic = sheet.diagnosticJson ? JSON.parse(sheet.diagnosticJson) : null;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      sheet: {
        ...sheet,
        answerKey: parsedAnswerKey,
        studentAnswers: parsedStudentAnswers,
        diagnostic: parsedDiagnostic,
      },
    });
  } catch (error: any) {
    console.error("Error fetching OMR sheet detail:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت اطلاعات پاسخ‌برگ", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.oMRAnswerSheet.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "پاسخ‌برگ با موفقیت حذف شد.",
    });
  } catch (error: any) {
    console.error("Error deleting OMR sheet:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف پاسخ‌برگ", details: error?.message },
      { status: 500 }
    );
  }
}
