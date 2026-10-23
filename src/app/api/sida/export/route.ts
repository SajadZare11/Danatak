import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const subjectId = searchParams.get("subjectId");

    // دریافت کلاس
    let classroom = classroomId
      ? await prisma.classroom.findUnique({
          where: { id: classroomId },
          include: {
            school: true,
            teacher: { include: { user: true } },
          },
        })
      : await prisma.classroom.findFirst({
          include: {
            school: true,
            teacher: { include: { user: true } },
          },
        });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // دریافت درس
    let subject = subjectId
      ? await prisma.subject.findUnique({ where: { id: subjectId } })
      : await prisma.subject.findFirst({ where: { code: "MATH-01" } }) || await prisma.subject.findFirst();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // دریافت لیست ثبت‌نامی‌های کلاس
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

    // دریافت نمرات رسمی این درس و کلاس
    const officialGrades = await prisma.officialGrade.findMany({
      where: {
        classroomId: classroom.id,
        subjectId: subject.id,
      },
    });

    // آماده‌سازی سطرهای اکسل
    const rows: any[] = [];

    // هدرهای اطلاعاتی بالای برگه طبق فرمت رسمی سیدا
    rows.push(["وزارت آموزش و پرورش - سامانه جامع سنجش و ارزشیابی تحصیلی (سیدا - sida.medu.ir)"]);
    rows.push([
      `مدرسه: ${classroom.school?.name || "دبیرستان علامه حلی ۱"}`,
      `کد مدرسه: ${classroom.school?.code || "12345678"}`,
      `سال تحصیلی: ۱۴۰۳-۱۴۰۴`,
      `دوره: دوم متوسطه`,
    ]);
    rows.push([
      `کلاس: ${classroom.name}`,
      `پایه: ${classroom.gradeLevel}`,
      `رشته: ${classroom.major}`,
      `درس: ${subject.name}`,
      `دبیر مربوطه: ${classroom.teacher?.user.fullName || "استاد احسان محمدی"}`,
    ]);
    rows.push([]); // سطر خالی

    // ستون‌های اصلی جدول سیدا
    rows.push([
      "ردیف",
      "کد ملی (کد دانش‌آموزی)",
      "نام و نام خانوادگی",
      "مستمر نوبت اول (۰-۲۰)",
      "پایانی نوبت اول (۰-۲۰)",
      "مستمر نوبت دوم (۰-۲۰)",
      "پایانی نوبت دوم (۰-۲۰)",
      "نمره سالانه",
      "ارزشیابی توصیفی معادل",
      "نمره انضباط",
      "غیبت غیرموجه",
      "نتیجه ارزشیابی",
    ]);

    // اضافه کردن دانش‌آموزان
    enrollments.forEach((enr, index) => {
      const studentUser = enr.student.user;
      const grade = officialGrades.find((g) => g.studentId === studentUser.id);

      const t1Cont = grade?.term1Continuous ?? 18.0;
      const t1Fin = grade?.term1Final ?? 17.5;
      const t2Cont = grade?.term2Continuous ?? 18.5;
      const t2Fin = grade?.term2Final ?? 18.0;

      // فرمول محاسبه نمره سالانه استاندارد آموزش و پرورش:
      // نمره سالانه = (مستمر ۱ * ۱ + پایانی ۱ * ۲ + مستمر ۲ * ۱ + پایانی ۲ * ۴) / ۸
      const calculatedAnnual = Number(
        ((t1Cont * 1 + t1Fin * 2 + t2Cont * 1 + t2Fin * 4) / 8).toFixed(2)
      );
      const annualScore = grade?.annualScore ?? calculatedAnnual;

      // توصیفی معادل
      let descriptive = grade?.descriptiveEvaluation;
      if (!descriptive) {
        if (annualScore >= 18) descriptive = "خیلی خوب";
        else if (annualScore >= 15) descriptive = "خوب";
        else if (annualScore >= 10) descriptive = "قابل قبول";
        else descriptive = "نیاز به آموزش و تلاش بیشتر";
      }

      const passStatus = annualScore >= 10 ? "قبول" : "تجدید";
      const conduct = grade?.conductScore ?? 20.0;
      const unexcused = grade?.unexcusedAbsences ?? 0;

      rows.push([
        index + 1,
        studentUser.nationalId,
        studentUser.fullName,
        t1Cont,
        t1Fin,
        t2Cont,
        t2Fin,
        annualScore,
        descriptive,
        conduct,
        unexcused,
        passStatus,
      ]);
    });

    // ساخت ورک‌بوک اکسل با SheetJS
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // تنظیم جهت راست‌به‌چپ (RTL) برگه
    ws["!views"] = [{ RTL: true }];

    // تنظیم عرض ستون‌ها برای خوانایی شکیل در نرم‌افزار اکسل
    ws["!cols"] = [
      { wch: 6 },  // ردیف
      { wch: 22 }, // کد ملی
      { wch: 26 }, // نام و نام خانوادگی
      { wch: 18 }, // مستمر ۱
      { wch: 18 }, // پایانی ۱
      { wch: 18 }, // مستمر ۲
      { wch: 18 }, // پایانی ۲
      { wch: 14 }, // سالانه
      { wch: 24 }, // توصیفی
      { wch: 12 }, // انضباط
      { wch: 14 }, // غیبت
      { wch: 14 }, // نتیجه
    ];

    XLSX.utils.book_append_sheet(wb, ws, "کارنامه نمرات سیدا");

    // خروجی بافر باینری استاندارد
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const safeClassName = classroom.name.replace(/[/\\?%*:|"<>]/g, "-");
    const safeSubjectName = subject.name.replace(/[/\\?%*:|"<>]/g, "-");
    const filename = `Sida_Grades_${safeClassName}_${safeSubjectName}.xlsx`;

    // تنظیم هدرهای دانلود فایل باینری
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/sida/export:", error);
    return NextResponse.json({ error: error.message || "Failed to export Sida Excel" }, { status: 500 });
  }
}
