import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const pack = await prisma.studyPack.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
        flashcards: {
          orderBy: { orderIndex: "asc" },
          include: studentId
            ? {
                progressRecords: {
                  where: { studentId },
                },
              }
            : undefined,
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
            },
            attempts: studentId
              ? {
                  where: { studentId },
                  orderBy: { startedAt: "desc" },
                  take: 5,
                }
              : undefined,
          },
        },
        telemetryLogs: studentId
          ? {
              where: { studentId },
              orderBy: { createdAt: "desc" },
              take: 10,
            }
          : undefined,
      },
    });

    if (!pack) {
      return NextResponse.json(
        { success: false, error: "بسته مطالعه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pack,
    });
  } catch (error: any) {
    console.error("Error fetching study pack details:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت جزئیات بسته مطالعه" },
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
    await prisma.studyPack.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "بسته مطالعه با موفقیت حذف گردید.",
    });
  } catch (error: any) {
    console.error("Error deleting study pack:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف بسته مطالعه" },
      { status: 500 }
    );
  }
}
