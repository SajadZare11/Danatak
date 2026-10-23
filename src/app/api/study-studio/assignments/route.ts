import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const needClassrooms = searchParams.get("classrooms") === "true";
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    const studyPackId = searchParams.get("studyPackId");

    // ۱. دریافت لیست کلاس‌ها و دانش‌آموزان برای مودال تخصیص
    if (needClassrooms) {
      const classrooms = await prisma.classroom.findMany({
        include: {
          enrollments: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      nationalId: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const formatted = classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        major: c.major,
        students: c.enrollments.map((e) => ({
          id: e.student.user.id,
          fullName: e.student.user.fullName,
          nationalId: e.student.user.nationalId,
          avatarUrl: e.student.user.avatarUrl,
        })),
      }));

      return NextResponse.json({ success: true, classrooms: formatted });
    }

    // ۲. فیلتر تکالیف بر اساس دانش‌آموز (شامل تکالیف مستقیم و تکالیف کلاسی)
    if (studentId) {
      // یافتن کلاس‌هایی که دانش‌آموز در آن‌ها ثبت‌نام کرده است
      const userProfile = await prisma.studentProfile.findUnique({
        where: { userId: studentId },
        include: { enrollments: true },
      });
      const classroomIds = userProfile?.enrollments.map((e) => e.classroomId) || [];

      const assignments = await prisma.studyPackAssignment.findMany({
        where: {
          OR: [
            { studentId },
            { classroomId: { in: classroomIds } },
          ],
          ...(studyPackId ? { studyPackId } : {}),
        },
        include: {
          studyPack: {
            include: {
              flashcards: { select: { id: true } },
              quizzes: {
                include: {
                  questions: { select: { id: true } },
                },
              },
            },
          },
          teacher: {
            select: {
              id: true,
              fullName: true,
            },
          },
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      // بررسی وضعیت تکمیل هر تکلیف بر اساس کوییز و فلش‌کارت‌های دانش‌آموز
      const enriched = await Promise.all(
        assignments.map(async (assignment) => {
          const quizIds = assignment.studyPack.quizzes.map((q) => q.id);
          const attempts = await prisma.studyQuizAttempt.findMany({
            where: {
              studentId,
              quizId: { in: quizIds },
            },
            orderBy: { percentage: "desc" },
          });

          const bestPercentage = attempts.length > 0 ? (attempts[0].percentage || 0) : 0;
          const isCompleted = bestPercentage >= assignment.minMasteryScore;

          return {
            ...assignment,
            bestPercentage,
            attemptsCount: attempts.length,
            isCompleted,
            status: isCompleted ? "COMPLETED" : attempts.length > 0 ? "IN_PROGRESS" : "PENDING",
          };
        })
      );

      return NextResponse.json({ success: true, assignments: enriched });
    }

    // ۳. تکالیف ایجاد شده توسط معلم
    const whereTeacher: any = {};
    if (teacherId) whereTeacher.teacherId = teacherId;
    if (studyPackId) whereTeacher.studyPackId = studyPackId;

    const teacherAssignments = await prisma.studyPackAssignment.findMany({
      where: whereTeacher,
      include: {
        studyPack: true,
        classroom: true,
        student: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, assignments: teacherAssignments });
  } catch (error: any) {
    console.error("Error fetching study pack assignments:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست تکالیف استودیو", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studyPackId,
      teacherId,
      classroomId,
      studentIds, // آرایه‌ای از شناسه‌های دانش‌آموزان یا رشته تک‌دانش‌آموز
      dueDate,
      minMasteryScore = 80,
      instructions = "",
    } = body;

    if (!studyPackId) {
      return NextResponse.json(
        { success: false, error: "شناسه بسته مطالعه الزامی است." },
        { status: 400 }
      );
    }

    let finalTeacherId = teacherId;
    if (!finalTeacherId) {
      const defaultTeacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
      finalTeacherId = defaultTeacher?.id;
    }

    if (!finalTeacherId) {
      return NextResponse.json(
        { success: false, error: "معلم صادرکننده تکلیف یافت نشد." },
        { status: 400 }
      );
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // پیش‌فرض ۷ روز بعد

    const createdAssignments = [];

    // الف) اگر برای کل کلاس اختصاص داده شده باشد:
    if (classroomId && (!studentIds || (Array.isArray(studentIds) && studentIds.length === 0))) {
      const assignment = await prisma.studyPackAssignment.create({
        data: {
          studyPackId,
          teacherId: finalTeacherId,
          classroomId,
          dueDate: parsedDueDate,
          minMasteryScore: Number(minMasteryScore) || 80,
          instructions,
        },
      });
      createdAssignments.push(assignment);
    }
    // ب) اگر برای دانش‌آموزان خاصی انتخاب شده باشد:
    else if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      for (const sId of studentIds) {
        const assignment = await prisma.studyPackAssignment.create({
          data: {
            studyPackId,
            teacherId: finalTeacherId,
            classroomId: classroomId || null,
            studentId: sId,
            dueDate: parsedDueDate,
            minMasteryScore: Number(minMasteryScore) || 80,
            instructions,
          },
        });
        createdAssignments.push(assignment);
      }
    } else if (body.studentId) {
      const assignment = await prisma.studyPackAssignment.create({
        data: {
          studyPackId,
          teacherId: finalTeacherId,
          classroomId: classroomId || null,
          studentId: body.studentId,
          dueDate: parsedDueDate,
          minMasteryScore: Number(minMasteryScore) || 80,
          instructions,
        },
      });
      createdAssignments.push(assignment);
    } else {
      // پیش‌فرض: تخصیص به اولین کلاس معلم
      const defaultClass = await prisma.classroom.findFirst();
      const assignment = await prisma.studyPackAssignment.create({
        data: {
          studyPackId,
          teacherId: finalTeacherId,
          classroomId: defaultClass?.id || null,
          dueDate: parsedDueDate,
          minMasteryScore: Number(minMasteryScore) || 80,
          instructions,
        },
      });
      createdAssignments.push(assignment);
    }

    return NextResponse.json({
      success: true,
      message: `تکلیف بسته مطالعه با موفقیت به ${createdAssignments.length} مخاطب اختصاص یافت.`,
      assignments: createdAssignments,
    });
  } catch (error: any) {
    console.error("Error creating study pack assignment:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت تکلیف استودیو", details: error?.message },
      { status: 500 }
    );
  }
}
