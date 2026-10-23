import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nationalId = searchParams.get("nationalId") || "0022334455"; // علی رضایی

    const studentUser = await prisma.user.findFirst({
      where: {
        role: "STUDENT",
        nationalId,
      },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                classroom: {
                  include: {
                    school: true,
                    assignments: {
                      orderBy: { createdAt: "desc" },
                      include: {
                        topic: {
                          include: {
                            textbook: true,
                          },
                        },
                        teacher: {
                          select: {
                            fullName: true,
                          },
                        },
                        submissions: true,
                      },
                    },
                  },
                },
              },
            },
            masteryRecords: {
              include: {
                topic: true,
              },
            },
          },
        },
      },
    });

    if (!studentUser || !studentUser.studentProfile) {
      return NextResponse.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    const profile = studentUser.studentProfile;
    const primaryEnrollment = profile.enrollments[0];
    const classroom = primaryEnrollment?.classroom;

    // پردازش تکالیف کلاس و انطباق با وضعیت ارسال دانش‌آموز
    const rawAssignments = classroom?.assignments || [];
    const assignments = rawAssignments.map((a) => {
      // تعداد سوالات
      let questionCount = 0;
      try {
        const qids = JSON.parse(a.questionsJson);
        questionCount = Array.isArray(qids) ? qids.length : 0;
      } catch {
        questionCount = 0;
      }

      // وضعیت ثبت پاسخ دانش‌آموز
      const userSubmission = a.submissions.find((s) => s.studentId === studentUser.id);

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        createdAt: a.createdAt,
        questionCount,
        topicTitle: a.topic?.title || "ریاضیات و حسابان",
        textbookTitle: a.topic?.textbook?.title || "حسابان و ریاضی ۳",
        teacherName: a.teacher?.fullName || "استاد احسان محمدی",
        submission: userSubmission
          ? {
              id: userSubmission.id,
              status: userSubmission.status,
              score: userSubmission.score,
              submittedAt: userSubmission.submittedAt,
            }
          : null,
      };
    });

    const completedCount = assignments.filter((a) => a.submission !== null).length;
    const pendingCount = assignments.filter((a) => a.submission === null).length;

    return NextResponse.json({
      student: {
        id: studentUser.id,
        profileId: profile.id,
        fullName: studentUser.fullName,
        nationalId: studentUser.nationalId,
        phoneNumber: studentUser.phoneNumber,
        avatarUrl: studentUser.avatarUrl,
        gradeLevel: profile.gradeLevel,
        major: profile.major,
        schoolName: profile.schoolName,
        totalXP: profile.totalXP,
        currentStreakDays: profile.currentStreakDays,
        learningStyle: profile.learningStyle,
        academicStrengths: profile.academicStrengths,
        academicWeaknesses: profile.academicWeaknesses,
      },
      classroom: classroom
        ? {
            id: classroom.id,
            name: classroom.name,
            gradeLevel: classroom.gradeLevel,
            major: classroom.major,
            schoolName: classroom.school?.name,
          }
        : null,
      assignments,
      stats: {
        totalAssignments: assignments.length,
        completedCount,
        pendingCount,
        totalXP: profile.totalXP,
        streakDays: profile.currentStreakDays,
      },
      masteryRecords: profile.masteryRecords.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        topicTitle: m.topic.title,
        percentage: m.masteryPercentage,
      })),
    });
  } catch (error) {
    console.error("Student Dashboard GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی اطلاعات دانش‌آموز" }, { status: 500 });
  }
}
