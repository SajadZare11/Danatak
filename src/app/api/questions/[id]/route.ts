import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "شناسه سوال الزامی است" }, { status: 400 });
    }

    // ابتدا گزینه‌های سوال حذف می‌شوند
    await prisma.questionOption.deleteMany({
      where: { questionId: id },
    });

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "سوال با موفقیت حذف شد" });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "خطا در حذف سوال" }, { status: 500 });
  }
}
