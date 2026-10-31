import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedClassroomId = searchParams.get("classroomId");

    // یافتن دبیر پیش‌فرض نمونه (استاد محمدی)
    const teacherUser = await prisma.user.findFirst({
      where: { role: "TEACHER" },
      include: {
        teacherProfile: {
          include: {
            classrooms: {
              include: {
                enrollments: {
                  include: {
                    student: {
                      include: {
                        user: true,
                        masteryRecords: {
                          include: {
                            topic: true,
                          },
                        },
                      },
                    },
                  },
                },
                assignments: {
                  include: {
                    submissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacherUser || !teacherUser.teacherProfile) {
      return NextResponse.json({ error: "معلم یافت نشد" }, { status: 404 });
    }

    const classrooms = teacherUser.teacherProfile.classrooms || [];
    const classroom = requestedClassroomId
      ? classrooms.find((c) => c.id === requestedClassroomId) || classrooms[0]
      : classrooms[0];

    // واکشی تمام کتاب‌های درسی برای فرم سازنده تکلیف و فیلترها
    const allTextbooks = await prisma.textbook.findMany({
      include: {
        topics: {
          where: { parentId: null },
          include: {
            subTopics: true,
          },
        },
      },
      orderBy: { gradeLevel: "asc" },
    });

    const grade12Textbook = allTextbooks.find((tb) => tb.gradeLevel === 12) || allTextbooks[0];

    // واکشی برگه‌های نیازمند تصحیح (Grading Queue)
    const pendingSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        status: { in: ["PENDING", "SUBMITTED"] },
      },
      include: {
        assignment: true,
        student: true,
      },
    });

    // واکشی تمام دانش‌آموزان ثبت‌شده در سامانه جهت انتخاب سریع در افزودن کلاس
    const allStudents = await prisma.studentProfile.findMany({
      include: {
        user: true,
      },
      orderBy: {
        user: { fullName: "asc" },
      },
    });

    return NextResponse.json({
      teacher: {
        id: teacherUser.id,
        fullName: teacherUser.fullName,
        specialty: teacherUser.teacherProfile.specialty,
        schoolName: teacherUser.teacherProfile.schoolName,
      },
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        major: c.major,
        subjects: c.subjects || "تدریس حسابان ۲ و ریاضی ۳",
        studentCount: c.enrollments?.length || 0,
      })),
      classroom: classroom
        ? {
            id: classroom.id,
            name: classroom.name,
            gradeLevel: classroom.gradeLevel,
            major: classroom.major,
            subjects: classroom.subjects || "تدریس حسابان ۲ و ریاضی ۳",
            students: classroom.enrollments.map((e) => {
              const sp = e.student;
              const u = sp.user;
              // محاسبه میانگین درصد تسلط
              const avgMastery =
                sp.masteryRecords.length > 0
                  ? Math.round(
                      sp.masteryRecords.reduce((acc, m) => acc + m.masteryPercentage, 0) /
                        sp.masteryRecords.length
                    )
                  : 50;

              return {
                id: sp.id,
                userId: u.id,
                fullName: u.fullName,
                nationalId: u.nationalId,
                phoneNumber: u.phoneNumber,
                avatarUrl: u.avatarUrl,
                gradeLevel: sp.gradeLevel,
                major: sp.major,
                schoolName: sp.schoolName,
                learningStyle: sp.learningStyle || "تحلیلی و تمرین‌محور",
                academicStrengths: sp.academicStrengths || "حد و پیوستگی",
                academicWeaknesses: sp.academicWeaknesses || "مشتق توابع کسری",
                privateTeacherNotes: sp.privateTeacherNotes || "",
                avgMastery,
                streakDays: sp.currentStreakDays,
                totalXP: sp.totalXP,
                masteryRecords: sp.masteryRecords.map((m) => ({
                  id: m.id,
                  topicId: m.topicId,
                  topicTitle: m.topic.title,
                  percentage: m.masteryPercentage,
                })),
              };
            }),
          }
        : null,
      availableStudents: allStudents.map((s) => ({
        id: s.id,
        userId: s.user.id,
        fullName: s.user.fullName,
        nationalId: s.user.nationalId,
        phoneNumber: s.user.phoneNumber,
        gradeLevel: s.gradeLevel,
        major: s.major,
      })),
      textbookTopics: grade12Textbook?.topics || [],
      allTextbooks: allTextbooks.map((tb) => ({
        id: tb.id,
        title: tb.title,
        gradeLevel: tb.gradeLevel,
        topics: tb.topics.map((t) => ({
          id: t.id,
          title: t.title,
          subTopics: t.subTopics.map((st) => ({
            id: st.id,
            title: st.title,
          })),
        })),
      })),
      pendingSubmissions,
    });
  } catch (error) {
    console.error("Teacher Dashboard GET error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات داشبورد معلم" }, { status: 500 });
  }
}
