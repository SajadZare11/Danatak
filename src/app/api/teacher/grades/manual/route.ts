import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateDescriptiveStats,
  calculateQuartiles,
  calculateDistributionShape,
  generateBellCurveData,
  calculateStandardScores,
} from "@/lib/analytics/psychometrics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");
    const requestedExamId = searchParams.get("examId");

    // دریافت کلیه کلاس‌های معلم پیش‌فرض برای سوئیچر کلاس
    const teacherUser = await prisma.user.findFirst({
      where: { role: "TEACHER" },
      include: {
        teacherProfile: {
          include: {
            classrooms: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
                major: true,
              },
            },
          },
        },
      },
    });

    const teacherClassrooms = teacherUser?.teacherProfile?.classrooms || [];
    const activeClassId = classroomId || teacherClassrooms[0]?.id;

    if (!activeClassId) {
      return NextResponse.json({
        success: true,
        classrooms: [],
        exams: [],
        selectedExam: null,
        analytics: null,
        students: [],
      });
    }

    // دریافت اطلاعات کلاس و دانش‌آموزان ثبت‌نام‌شده
    const classroom = await prisma.classroom.findUnique({
      where: { id: activeClassId },
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

    const students = classroom?.enrollments.map((en) => ({
      id: en.student.user.id,
      fullName: en.student.user.fullName,
      nationalId: en.student.user.nationalId,
      avatarUrl: en.student.user.avatarUrl || `/api/avatar?name=${encodeURIComponent(en.student.user.fullName)}&bg=4338ca`,
    })) || [];

    // واکشی تمام آزمون‌های ثبت دستی مربوط به این کلاس
    const allExams = await prisma.exam.findMany({
      where: {
        classroomId: activeClassId,
        OR: [
          { description: { startsWith: "MANUAL_GRADE" } },
          { questionsJson: { contains: '"isManual":true' } },
        ],
      },
      include: {
        attempts: {
          include: {
            student: {
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
      orderBy: { createdAt: "desc" },
    });

    // خلاصه هر آزمون
    const examsSummary = allExams.map((ex) => {
      let maxScore = 20;
      let subjectTitle = "حسابان";
      try {
        if (ex.description?.startsWith("MANUAL_GRADE:")) {
          const meta = JSON.parse(ex.description.replace("MANUAL_GRADE:", ""));
          maxScore = meta.maxScore || 20;
          subjectTitle = meta.subjectTitle || "حسابان";
        } else if (ex.questionsJson) {
          const qData = JSON.parse(ex.questionsJson);
          maxScore = qData.maxScore || 20;
          subjectTitle = qData.subjectTitle || "حسابان";
        }
      } catch (e) {}

      const validAttempts = ex.attempts.filter((a) => a.score !== null && a.score !== undefined);
      const scores = validAttempts.map((a) => a.score as number);
      const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
      const passingScores = scores.filter((s) => (s / maxScore) >= 0.5);
      const passRate = scores.length > 0 ? Number(((passingScores.length / scores.length) * 100).toFixed(1)) : 0;

      return {
        id: ex.id,
        title: ex.title,
        maxScore,
        subjectTitle,
        examDate: ex.startTime,
        createdAt: ex.createdAt,
        totalStudents: students.length,
        recordedCount: validAttempts.length,
        absentCount: ex.attempts.filter((a) => a.score === null).length,
        averageScore: avg,
        averagePercentage: Number(((avg / maxScore) * 100).toFixed(1)),
        passRate,
      };
    });

    // انتخاب آزمون هدف جهت تحلیل و نمایش ریزنمرات
    const targetExam = requestedExamId
      ? allExams.find((e) => e.id === requestedExamId) || allExams[0]
      : allExams[0];

    let selectedExamDetails: any = null;
    let analyticsData: any = null;

    if (targetExam) {
      let maxScore = 20;
      let subjectTitle = "حسابان";
      try {
        if (targetExam.description?.startsWith("MANUAL_GRADE:")) {
          const meta = JSON.parse(targetExam.description.replace("MANUAL_GRADE:", ""));
          maxScore = meta.maxScore || 20;
          subjectTitle = meta.subjectTitle || "حسابان";
        } else if (targetExam.questionsJson) {
          const qData = JSON.parse(targetExam.questionsJson);
          maxScore = qData.maxScore || 20;
          subjectTitle = qData.subjectTitle || "حسابان";
        }
      } catch (e) {}

      const attemptsMap = new Map<string, any>();
      targetExam.attempts.forEach((att) => {
        attemptsMap.set(att.studentId, att);
      });

      // نمرات خام برای محاسبات آماری
      const validScores: number[] = [];

      // ترکیب لیست همه دانش‌آموزان کلاس با نمرات ثبت‌شده‌شان
      const studentResults = students.map((std) => {
        const att = attemptsMap.get(std.id);
        const isAbsent = att ? att.score === null : false;
        const rawScore = att && att.score !== null && att.score !== undefined ? att.score : null;

        if (rawScore !== null) {
          validScores.push(rawScore);
        }

        const percentage = rawScore !== null ? Number(((rawScore / maxScore) * 100).toFixed(1)) : null;

        return {
          studentId: std.id,
          fullName: std.fullName,
          nationalId: std.nationalId,
          avatarUrl: std.avatarUrl,
          rawScore,
          maxScore,
          percentage,
          isAbsent,
          isRecorded: !!att,
        };
      });

      // محاسبات شاخص‌های آماری
      if (validScores.length > 0) {
        const descStats = calculateDescriptiveStats(validScores);
        const quartiles = calculateQuartiles(validScores);
        const distShape = calculateDistributionShape(validScores);
        const bellCurve = generateBellCurveData(validScores, 5);

        // مرتب‌سازی و محاسبه رتبه و تراز هر دانش‌آموز
        const sortedScores = [...validScores].sort((a, b) => b - a);

        const enrichedStudents = studentResults.map((std) => {
          if (std.rawScore === null || std.isAbsent) {
            return {
              ...std,
              classRank: "-",
              percentileRank: 0,
              zScore: 0,
              taraz: 0,
              statusLabel: std.isAbsent ? "غایب" : "ثبت‌نشده",
              statusColor: "bg-slate-100 text-slate-600 border-slate-300",
            };
          }

          const stdScore = calculateStandardScores(std.rawScore, validScores);
          const rank = sortedScores.indexOf(std.rawScore) + 1;

          let statusLabel = "متوسط";
          let statusColor = "bg-amber-50 text-amber-700 border-amber-300";

          const pct = (std.rawScore / maxScore) * 100;
          if (pct >= 85) {
            statusLabel = "عالی (تسلط کامل)";
            statusColor = "bg-emerald-50 text-emerald-700 border-emerald-300";
          } else if (pct >= 70) {
            statusLabel = "خوب (تسلط مطلوب)";
            statusColor = "bg-blue-50 text-blue-700 border-blue-300";
          } else if (pct >= 50) {
            statusLabel = "متوسط (نیازمند تثبیت)";
            statusColor = "bg-amber-50 text-amber-700 border-amber-300";
          } else {
            statusLabel = "نیازمند مداخله و تلاش";
            statusColor = "bg-rose-50 text-rose-700 border-rose-300";
          }

          return {
            ...std,
            classRank: rank,
            percentileRank: stdScore.percentileRank,
            zScore: stdScore.zScore,
            taraz: stdScore.taraz,
            statusLabel,
            statusColor,
          };
        });

        // مرتب‌سازی نهایی لیست بر اساس رتبه کلاسی (بالاترین نمرات اول)
        enrichedStudents.sort((a, b) => {
          if (a.rawScore === null) return 1;
          if (b.rawScore === null) return -1;
          return (b.rawScore || 0) - (a.rawScore || 0);
        });

        analyticsData = {
          descriptive: descStats,
          quartiles,
          distributionShape: distShape,
          bellCurve,
          passingCount: validScores.filter((s) => s / maxScore >= 0.5).length,
          failingCount: validScores.filter((s) => s / maxScore < 0.5).length,
          passingPercentage: Number(((validScores.filter((s) => s / maxScore >= 0.5).length / validScores.length) * 100).toFixed(1)),
          excellentCount: validScores.filter((s) => s / maxScore >= 0.85).length,
          atRiskCount: validScores.filter((s) => s / maxScore < 0.5).length,
        };

        selectedExamDetails = {
          id: targetExam.id,
          title: targetExam.title,
          maxScore,
          subjectTitle,
          examDate: targetExam.startTime,
          students: enrichedStudents,
        };
      } else {
        selectedExamDetails = {
          id: targetExam.id,
          title: targetExam.title,
          maxScore,
          subjectTitle,
          examDate: targetExam.startTime,
          students: studentResults,
        };
      }
    }

    return NextResponse.json({
      success: true,
      classrooms: teacherClassrooms,
      activeClassId,
      exams: examsSummary,
      selectedExam: selectedExamDetails,
      analytics: analyticsData,
      students,
    });
  } catch (error: any) {
    console.error("Error in GET /api/teacher/grades/manual:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "خطا در واکشی اطلاعات نمرات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classroomId,
      teacherId: explicitTeacherId,
      title,
      maxScore = 20,
      subjectTitle = "حسابان",
      examDate,
      grades = [],
    } = body;

    if (!classroomId || !title?.trim()) {
      return NextResponse.json(
        { success: false, error: "کلاس درس و عنوان آزمون الزامی است." },
        { status: 400 }
      );
    }

    const numMaxScore = Math.max(1, Number(maxScore) || 20);

    // یافتن شناسه معلم در صورت ارسال نشدن
    let teacherId = explicitTeacherId;
    if (!teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { role: "TEACHER" },
      });
      teacherId = teacher?.id;
    }

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "دبیر مربوطه در سامانه یافت نشد." },
        { status: 404 }
      );
    }

    // ایجاد رکورد آزمون
    const parsedExamDate = examDate ? new Date(examDate) : new Date();
    const metaJson = JSON.stringify({
      isManual: true,
      maxScore: numMaxScore,
      subjectTitle: subjectTitle.trim(),
    });

    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        description: `MANUAL_GRADE:${metaJson}`,
        classroomId,
        teacherId,
        startTime: parsedExamDate,
        durationMinutes: 0,
        enableAntiCheat: false,
        questionsJson: metaJson,
      },
    });

    // ثبت نمرات برای دانش‌آموزان
    for (const item of grades) {
      const isAbsent = !!item.isAbsent;
      let score: number | null = null;

      if (!isAbsent && item.score !== "" && item.score !== null && item.score !== undefined) {
        score = Math.min(numMaxScore, Math.max(0, Number(item.score)));
      }

      const percentage = score !== null ? Number(((score / numMaxScore) * 100).toFixed(1)) : null;

      await prisma.examAttempt.create({
        data: {
          examId: exam.id,
          studentId: item.studentId,
          score,
          percentage,
          submittedAt: isAbsent ? null : new Date(),
          answersJson: JSON.stringify({
            isAbsent,
            rawScore: score,
            maxScore: numMaxScore,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      examId: exam.id,
      message: "نمرات با موفقیت ثبت و ذخیره گردید.",
    });
  } catch (error: any) {
    console.error("Error in POST /api/teacher/grades/manual:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "خطا در ثبت نمرات آزمون" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, studentId, score, isAbsent } = body;

    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, error: "شناسه آزمون و دانش‌آموز الزامی است." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "آزمون مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    let maxScore = 20;
    try {
      if (exam.description?.startsWith("MANUAL_GRADE:")) {
        const meta = JSON.parse(exam.description.replace("MANUAL_GRADE:", ""));
        maxScore = meta.maxScore || 20;
      }
    } catch (e) {}

    const isAbs = !!isAbsent;
    let numericScore: number | null = null;
    if (!isAbs && score !== "" && score !== null && score !== undefined) {
      numericScore = Math.min(maxScore, Math.max(0, Number(score)));
    }

    const percentage = numericScore !== null ? Number(((numericScore / maxScore) * 100).toFixed(1)) : null;

    const existingAttempt = await prisma.examAttempt.findFirst({
      where: { examId, studentId },
    });

    if (existingAttempt) {
      await prisma.examAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          score: numericScore,
          percentage,
          submittedAt: isAbs ? null : new Date(),
          answersJson: JSON.stringify({
            isAbsent: isAbs,
            rawScore: numericScore,
            maxScore,
          }),
        },
      });
    } else {
      await prisma.examAttempt.create({
        data: {
          examId,
          studentId,
          score: numericScore,
          percentage,
          submittedAt: isAbs ? null : new Date(),
          answersJson: JSON.stringify({
            isAbsent: isAbs,
            rawScore: numericScore,
            maxScore,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "نمره دانش‌آموز با موفقیت به‌روزرسانی شد.",
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/teacher/grades/manual:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "خطا در ویرایش نمره" },
      { status: 500 }
    );
  }
}
