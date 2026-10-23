import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: دریافت نمرات کلاسی جهت پیش‌نمایش و ویرایش در جدول سیدا
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const subjectId = searchParams.get("subjectId");

    let classroom = classroomId
      ? await prisma.classroom.findUnique({ where: { id: classroomId } })
      : await prisma.classroom.findFirst();

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    let subject = subjectId
      ? await prisma.subject.findUnique({ where: { id: subjectId } })
      : await prisma.subject.findFirst({ where: { code: "MATH-01" } }) || await prisma.subject.findFirst();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId: classroom.id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { student: { user: { fullName: "asc" } } },
    });

    const officialGrades = await prisma.officialGrade.findMany({
      where: {
        classroomId: classroom.id,
        subjectId: subject.id,
      },
    });

    const studentsGrades = enrollments.map((enr, idx) => {
      const u = enr.student.user;
      const g = officialGrades.find((grade) => grade.studentId === u.id);

      const t1Cont = g?.term1Continuous ?? 18.0;
      const t1Fin = g?.term1Final ?? 17.5;
      const t2Cont = g?.term2Continuous ?? 18.5;
      const t2Fin = g?.term2Final ?? 18.0;
      const annualScore =
        g?.annualScore ??
        Number(((t1Cont * 1 + t1Fin * 2 + t2Cont * 1 + t2Fin * 4) / 8).toFixed(2));

      let descriptive = g?.descriptiveEvaluation;
      if (!descriptive) {
        if (annualScore >= 18) descriptive = "خیلی خوب";
        else if (annualScore >= 15) descriptive = "خوب";
        else if (annualScore >= 10) descriptive = "قابل قبول";
        else descriptive = "نیاز به آموزش و تلاش بیشتر";
      }

      return {
        id: u.id,
        rowNumber: idx + 1,
        fullName: u.fullName,
        nationalId: u.nationalId,
        avatarUrl: u.avatarUrl,
        term1Continuous: t1Cont,
        term1Final: t1Fin,
        term2Continuous: t2Cont,
        term2Final: t2Fin,
        annualScore,
        descriptiveEvaluation: descriptive,
        conductScore: g?.conductScore ?? 20.0,
        unexcusedAbsences: g?.unexcusedAbsences ?? 0,
        passStatus: annualScore >= 10 ? "قبول" : "تجدید",
        gradeRecordId: g?.id || null,
      };
    });

    // دریافت لیست تمام کلاس‌ها و درس‌ها برای منوهای انتخاب فیلتر
    const classrooms = await prisma.classroom.findMany({
      select: { id: true, name: true, gradeLevel: true, major: true },
    });

    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, code: true },
    });

    return NextResponse.json({
      currentClassroom: classroom,
      currentSubject: subject,
      classrooms,
      subjects,
      grades: studentsGrades,
    });
  } catch (error: any) {
    console.error("Error in GET /api/sida/grades:", error);
    return NextResponse.json({ error: error.message || "Failed to load grades" }, { status: 500 });
  }
}

// POST: ذخیره یا به‌روزرسانی نمرات رسمی در جدول سیدا
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classroomId, subjectId, grades } = body as {
      classroomId: string;
      subjectId: string;
      grades: Array<{
        studentId: string;
        term1Continuous?: number;
        term1Final?: number;
        term2Continuous?: number;
        term2Final?: number;
        conductScore?: number;
        unexcusedAbsences?: number;
      }>;
    };

    if (!classroomId || !subjectId || !grades) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    for (const item of grades) {
      const t1Cont = item.term1Continuous ?? 18;
      const t1Fin = item.term1Final ?? 18;
      const t2Cont = item.term2Continuous ?? 18;
      const t2Fin = item.term2Final ?? 18;
      const annualScore = Number(
        ((t1Cont * 1 + t1Fin * 2 + t2Cont * 1 + t2Fin * 4) / 8).toFixed(2)
      );

      let descriptive = "خیلی خوب";
      if (annualScore >= 18) descriptive = "خیلی خوب";
      else if (annualScore >= 15) descriptive = "خوب";
      else if (annualScore >= 10) descriptive = "قابل قبول";
      else descriptive = "نیاز به آموزش و تلاش بیشتر";

      await prisma.officialGrade.upsert({
        where: {
          studentId_classroomId_subjectId: {
            studentId: item.studentId,
            classroomId,
            subjectId,
          },
        },
        update: {
          term1Continuous: item.term1Continuous,
          term1Final: item.term1Final,
          term2Continuous: item.term2Continuous,
          term2Final: item.term2Final,
          annualScore,
          descriptiveEvaluation: descriptive,
          conductScore: item.conductScore ?? 20.0,
          unexcusedAbsences: item.unexcusedAbsences ?? 0,
        },
        create: {
          studentId: item.studentId,
          classroomId,
          subjectId,
          term1Continuous: t1Cont,
          term1Final: t1Fin,
          term2Continuous: t2Cont,
          term2Final: t2Fin,
          annualScore,
          descriptiveEvaluation: descriptive,
          conductScore: item.conductScore ?? 20.0,
          unexcusedAbsences: item.unexcusedAbsences ?? 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "نمرات با موفقیت ذخیره گردید و آماده خروجی سیدا است.",
    });
  } catch (error: any) {
    console.error("Error in POST /api/sida/grades:", error);
    return NextResponse.json({ error: error.message || "Failed to save grades" }, { status: 500 });
  }
}
