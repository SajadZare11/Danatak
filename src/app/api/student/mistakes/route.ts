import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");
    const status = searchParams.get("status") || "all"; // all, unresolved, resolved
    const topicId = searchParams.get("topicId");

    // یافتن دانش‌آموز (پیش‌فرض: علی رضایی)
    let studentId = studentIdParam;
    if (!studentId) {
      const defaultStudent = await prisma.user.findFirst({
        where: { role: "STUDENT", nationalId: "0022334455" },
      });
      studentId = defaultStudent?.id || "";
    }

    const where: any = { studentId };

    if (status === "unresolved") where.isResolved = false;
    else if (status === "resolved") where.isResolved = true;

    if (topicId && topicId !== "ALL") {
      where.question = { topicId };
    }

    const mistakes = await prisma.studentMistake.findMany({
      where,
      include: {
        question: {
          include: {
            options: {
              orderBy: { orderIndex: "asc" },
            },
            topic: {
              include: {
                textbook: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = mistakes.length;
    const unresolvedCount = mistakes.filter((m) => !m.isResolved).length;
    const resolvedCount = mistakes.filter((m) => m.isResolved).length;

    // دسته‌بندی بر اساس دلیل اشتباه
    const byReason: Record<string, number> = {
      "بی‌دقتی محاسباتی": 0,
      "عدم تسلط مفهومی": 0,
      "کمبود زمان": 0,
      "بدخوانی صورت سوال": 0,
    };
    mistakes.forEach((m) => {
      if (m.errorReason && byReason[m.errorReason] !== undefined) {
        byReason[m.errorReason]++;
      }
    });

    return NextResponse.json({
      mistakes,
      stats: {
        total: totalCount,
        unresolved: unresolvedCount,
        resolved: resolvedCount,
        byReason,
      },
    });
  } catch (error) {
    console.error("Student Mistakes GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی دفترچه اشتباهات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, mistakeId, errorReason, notes, questionId, studentId, answer } = body;

    // ۱. به‌روزرسانی برچسب دلیل اشتباه یا یادداشت
    if (action === "updateReason" && mistakeId) {
      const updated = await prisma.studentMistake.update({
        where: { id: mistakeId },
        data: {
          errorReason: errorReason || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
      });
      return NextResponse.json({ success: true, mistake: updated });
    }

    // ۲. حل و رفع نقص اشتباه به صورت دستی یا تستی
    if (action === "resolve" && mistakeId) {
      const updated = await prisma.studentMistake.update({
        where: { id: mistakeId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
        include: {
          student: {
            include: { studentProfile: true },
          },
        },
      });

      // اعطای پاداش XP بابت رفع اشتباه
      if (updated.student?.studentProfile) {
        await prisma.studentProfile.update({
          where: { id: updated.student.studentProfile.id },
          data: { totalXP: { increment: 15 } },
        });
      }

      return NextResponse.json({
        success: true,
        mistake: updated,
        awardedXP: 15,
        message: "اشتباه با موفقیت رفع نقص شد و ۱۵ امتیاز تجربه به شما تعلق گرفت! 🎉",
      });
    }

    // ۳. آزمون مجدد تکی یا گروهی از سوالات اشتباه (Re-test)
    if (action === "verifyRetest" && mistakeId && answer) {
      const mistake = await prisma.studentMistake.findUnique({
        where: { id: mistakeId },
        include: {
          question: {
            include: { options: true },
          },
          student: {
            include: { studentProfile: true },
          },
        },
      });

      if (!mistake) {
        return NextResponse.json({ error: "مورد یافت نشد" }, { status: 404 });
      }

      const correctOpt = mistake.question.options.find((o) => o.isCorrect);
      const isCorrect =
        correctOpt && (answer === correctOpt.id || answer === String(correctOpt.orderIndex));

      if (isCorrect) {
        await prisma.studentMistake.update({
          where: { id: mistakeId },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
          },
        });

        if (mistake.student?.studentProfile) {
          await prisma.studentProfile.update({
            where: { id: mistake.student.studentProfile.id },
            data: { totalXP: { increment: 20 } },
          });
        }

        return NextResponse.json({
          isCorrect: true,
          message: "پاسخ کاملاً درست بود! این اشتباه در دفترچه شما به عنوان «رفع نقص شده» علامت خورد. (+۲۰ XP)",
          awardedXP: 20,
        });
      } else {
        return NextResponse.json({
          isCorrect: false,
          message: "پاسخ انتخابی نادرست بود. راه‌حل تشریحی را مرور کرده و مجدداً تلاش کنید.",
        });
      }
    }

    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (error) {
    console.error("Student Mistakes POST error:", error);
    return NextResponse.json({ error: "خطا در عملیات دفترچه اشتباهات" }, { status: 500 });
  }
}
