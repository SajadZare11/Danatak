import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentProfileId, privateNotes } = body;

    if (!studentProfileId) {
      return NextResponse.json({ error: "شناسه دانش‌آموز الزامی است" }, { status: 400 });
    }

    const updated = await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { privateTeacherNotes: privateNotes },
    });

    return NextResponse.json({ success: true, notes: updated.privateTeacherNotes });
  } catch (error) {
    console.error("Teacher notes update error:", error);
    return NextResponse.json({ error: "خطا در ذخیره یادداشت محرمانه" }, { status: 500 });
  }
}
