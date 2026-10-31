import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      gradeLevel,
      major,
      subjects,
      selectedStudentIds = [],
      newStudents = [],
    } = body;

    if (!name || !gradeLevel || !major) {
      return NextResponse.json(
        { success: false, error: "نام کلاس، پایه و رشته الزامی هستند." },
        { status: 400 }
      );
    }

    // دبیر جاری
    const teacherUser = await prisma.user.findFirst({
      where: { role: "TEACHER" },
      include: { teacherProfile: true },
    });

    if (!teacherUser || !teacherUser.teacherProfile) {
      return NextResponse.json(
        { success: false, error: "پروفایل دبیر یافت نشد." },
        { status: 404 }
      );
    }

    const teacherProfile = teacherUser.teacherProfile;
    const school = await prisma.school.findFirst();

    // ۱. ساخت کلاس
    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        major: major.trim(),
        subjects: subjects ? subjects.trim() : null,
        teacherId: teacherProfile.id,
        schoolId: school ? school.id : null,
      },
    });

    // ۲. جمع‌آوری شناسه دانش‌آموزان
    const uniqueStudentIds = new Set<string>();

    if (Array.isArray(selectedStudentIds)) {
      for (const sId of selectedStudentIds) {
        if (sId && typeof sId === "string") {
          uniqueStudentIds.add(sId);
        }
      }
    }

    // ۳. ساخت یا انتساب دانش‌آموزان جدید (دستی یا اکسل)
    if (Array.isArray(newStudents)) {
      for (const ns of newStudents) {
        if (!ns.fullName || !ns.fullName.trim()) continue;
        const cleanName = ns.fullName.trim();
        const nationalId =
          ns.nationalId && ns.nationalId.trim().length > 0
            ? ns.nationalId.trim()
            : `st-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        let existingUser = await prisma.user.findUnique({
          where: { nationalId },
          include: { studentProfile: true },
        });

        let studentProfileId: string;

        if (existingUser && existingUser.studentProfile) {
          studentProfileId = existingUser.studentProfile.id;
        } else if (existingUser && existingUser.role === "STUDENT") {
          const sp = await prisma.studentProfile.create({
            data: {
              userId: existingUser.id,
              gradeLevel: Number(gradeLevel),
              major: major.trim(),
              schoolName: teacherProfile.schoolName || "دبیرستان علامه حلی ۱",
            },
          });
          studentProfileId = sp.id;
        } else {
          // در صورت وجود کاربری با این کدملی در نقشی غیر از دانش‌آموز (مثلاً مدیر/دبیر)، کدملی دانش‌آموز بهینه‌سازی می‌شود
          const finalNationalId = existingUser
            ? `${nationalId}-st-${Date.now().toString().slice(-4)}`
            : nationalId;

          const newUser = await prisma.user.create({
            data: {
              fullName: cleanName,
              nationalId: finalNationalId,
              phoneNumber: ns.phoneNumber?.trim() || null,
              role: "STUDENT",
              studentProfile: {
                create: {
                  gradeLevel: Number(gradeLevel),
                  major: major.trim(),
                  schoolName: teacherProfile.schoolName || "دبیرستان علامه حلی ۱",
                },
              },
            },
            include: { studentProfile: true },
          });
          studentProfileId = newUser.studentProfile!.id;
        }

        uniqueStudentIds.add(studentProfileId);
      }
    }

    // ۴. ایجاد رکوردهای Enrollment
    for (const studentId of uniqueStudentIds) {
      await prisma.enrollment.create({
        data: {
          classroomId: classroom.id,
          studentId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      classroomId: classroom.id,
      classroom,
      enrolledCount: uniqueStudentIds.size,
      message: `کلاس «${classroom.name}» با موفقیت افزوده شد.`,
    });
  } catch (error: any) {
    console.error("Create Classroom error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد کلاس جدید: " + (error.message || "") },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, gradeLevel, major, subjects } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "شناسه کلاس الزامی است." },
        { status: 400 }
      );
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: name?.trim(),
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        major: major?.trim(),
        subjects: subjects !== undefined ? subjects?.trim() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      classroom: updated,
      message: "مشخصات کلاس با موفقیت به‌روزرسانی شد.",
    });
  } catch (error: any) {
    console.error("Update Classroom error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ویرایش کلاس" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");

    if (!classroomId) {
      return NextResponse.json(
        { success: false, error: "شناسه کلاس ارسال نشده است." },
        { status: 400 }
      );
    }

    await prisma.classroom.delete({
      where: { id: classroomId },
    });

    return NextResponse.json({
      success: true,
      message: "کلاس با موفقیت حذف شد.",
    });
  } catch (error: any) {
    console.error("Delete Classroom error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف کلاس" },
      { status: 500 }
    );
  }
}
