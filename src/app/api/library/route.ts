import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get("gradeLevel");
    const category = searchParams.get("category");
    const subjectName = searchParams.get("subjectName");
    const search = searchParams.get("search");

    const where: any = {};
    if (gradeLevel) where.gradeLevel = parseInt(gradeLevel);
    if (category && category !== "ALL") where.category = category;
    if (subjectName && subjectName !== "ALL") where.subjectName = subjectName;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { authorName: { contains: search } },
      ];
    }

    const resources = await prisma.digitalLibraryResource.findMany({
      where,
      orderBy: [{ downloads: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json(
      { error: "خطا در واکشی منابع کتابخانه دیجیتال." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, gradeLevel, major, subjectName, fileUrl, fileSize, authorName, description } = body;

    if (!title || !subjectName) {
      return NextResponse.json(
        { error: "عنوان منبع و نام درس الزامی است." },
        { status: 400 }
      );
    }

    const newResource = await prisma.digitalLibraryResource.create({
      data: {
        title: title.trim(),
        category: category || "TEACHER_NOTES",
        gradeLevel: parseInt(gradeLevel) || 12,
        major: major || "ریاضی",
        subjectName: subjectName.trim(),
        fileUrl: fileUrl || "/docs/sample.pdf",
        fileSize: fileSize || "3.5 مگابایت",
        authorName: authorName?.trim() || "دبیرخانه آموزشی سمپاد",
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, resource: newResource });
  } catch (error) {
    console.error("Post library resource error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری منبع جدید در کتابخانه." },
      { status: 500 }
    );
  }
}
