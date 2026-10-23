import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get("studentProfileId");

    // یافتن دانش‌آموز (در صورت نبود شناسه، اولین دانش‌آموز که علی رضایی است انتخاب می‌شود)
    const studentProfile = requestedStudentId
      ? await prisma.studentProfile.findUnique({
          where: { id: requestedStudentId },
          include: {
            user: true,
            masteryRecords: {
              include: {
                topic: {
                  include: {
                    textbook: true,
                  },
                },
              },
            },
          },
        })
      : await prisma.studentProfile.findFirst({
          include: {
            user: true,
            masteryRecords: {
              include: {
                topic: {
                  include: {
                    textbook: true,
                  },
                },
              },
            },
          },
        });

    if (!studentProfile) {
      return NextResponse.json({ error: "پروفایل دانش‌آموز یافت نشد" }, { status: 404 });
    }

    // واکشی تمام گره‌های درختواره مباحث مرتبط با گراف پیش‌نیازها
    const allTopics = await prisma.topic.findMany({
      include: {
        textbook: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    const prerequisiteEdges = await prisma.prerequisiteEdge.findMany({
      include: {
        sourceTopic: {
          include: {
            textbook: true,
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        targetTopic: {
          include: {
            textbook: true,
          },
        },
      },
    });

    // ۱. آماده‌سازی داده‌های نمودار راداری (Recharts Radar Data)
    const radarData = studentProfile.masteryRecords.map((m) => {
      // میانگین فرضی کلاس برای مقایسه صدکی
      const classAverage = m.masteryPercentage >= 70 ? 68 : 55;
      return {
        subject: m.topic.title.replace("فصل ۳: ", ""),
        topicId: m.topicId,
        mastery: Math.round(m.masteryPercentage),
        classAverage,
        fullMark: 100,
      };
    });

    // ۲. آماده‌سازی داده‌های گراف پیوسته پیش‌نیازها (Cross-Grade Knowledge Graph)
    // ایجاد یک مپ از درصد تسلط دانش‌آموز روی مباحث
    const masteryMap = new Map<string, number>();
    studentProfile.masteryRecords.forEach((m) => {
      masteryMap.set(m.topicId, m.masteryPercentage);
    });

    // گره‌های گراف
    const graphNodes = allTopics
      .filter((t) => t.parentId !== null || t.textbook.gradeLevel < 12)
      .map((t) => {
        const mastery = masteryMap.get(t.id) ?? (t.textbook.gradeLevel === 10 ? 82 : 50);
        let status: "MASTERED" | "MODERATE" | "CRITICAL" = "MASTERED";
        if (mastery < 60) status = "CRITICAL";
        else if (mastery < 75) status = "MODERATE";

        return {
          id: t.id,
          title: t.title,
          gradeLevel: t.textbook.gradeLevel,
          major: t.textbook.major,
          bookTitle: t.textbook.title,
          masteryPercentage: Math.round(mastery),
          status,
        };
      });

    // یال‌های گراف
    const graphEdges = prerequisiteEdges.map((e) => ({
      id: e.id,
      sourceId: e.sourceTopicId,
      sourceTitle: e.sourceTopic.title,
      sourceGrade: e.sourceTopic.textbook.gradeLevel,
      targetId: e.targetTopicId,
      targetTitle: e.targetTopic.title,
      targetGrade: e.targetTopic.textbook.gradeLevel,
      importance: e.importance,
    }));

    // ۳. موتور عارضه‌یابی ریشه‌ای (Root-Cause Diagnostic Engine)
    // کشف مباحثی از پایه دوازدهم که درصد تسلط آنها زیر ۶۰٪ است
    const criticalTopics = graphNodes.filter((n) => n.gradeLevel === 12 && n.status === "CRITICAL");

    const diagnosticRecommendations = [];

    for (const crit of criticalTopics) {
      // جستجوی یال‌های پیش‌نیاز منتهی به این مبحث
      const incomingEdges = prerequisiteEdges.filter((e) => e.targetTopicId === crit.id);

      for (const edge of incomingEdges) {
        const sourceTopic = edge.sourceTopic;
        const sourceMastery = masteryMap.get(sourceTopic.id) ?? 75;

        // استخراج سوالات تشخیصی از مبحث پیش‌نیاز
        const diagnosticQuestions = sourceTopic.questions.map((q) => ({
          id: q.id,
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          explanation: q.explanation,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.optionText,
            orderIndex: o.orderIndex,
            isCorrect: o.isCorrect,
          })),
        }));

        diagnosticRecommendations.push({
          strugglingTopic: {
            id: crit.id,
            title: crit.title,
            gradeLevel: crit.gradeLevel,
            mastery: crit.masteryPercentage,
          },
          rootCausePrerequisite: {
            id: sourceTopic.id,
            title: sourceTopic.title,
            gradeLevel: sourceTopic.textbook.gradeLevel,
            bookTitle: sourceTopic.textbook.title,
            currentMastery: sourceMastery,
            importance: edge.importance,
          },
          analysisMessage: `افت در مبحث «${crit.title}» دوازدهم ممکن است ناشی از گره یادگیری در مبحث پیش‌نیاز پایه ${sourceTopic.textbook.gradeLevel} («${sourceTopic.title}») باشد.`,
          questions: diagnosticQuestions,
        });
      }
    }

    // ۴. شاخص کل سلامت آموزشی (Academic Health Index)
    const avgMastery =
      radarData.length > 0
        ? Math.round(radarData.reduce((acc, r) => acc + r.mastery, 0) / radarData.length)
        : 50;

    return NextResponse.json({
      student: {
        id: studentProfile.id,
        fullName: studentProfile.user.fullName,
        nationalId: studentProfile.user.nationalId,
        gradeLevel: studentProfile.gradeLevel,
        major: studentProfile.major,
        schoolName: studentProfile.schoolName,
        avgMastery,
        streakDays: studentProfile.currentStreakDays,
        totalXP: studentProfile.totalXP,
      },
      radarData,
      graphNodes,
      graphEdges,
      diagnosticRecommendations,
    });
  } catch (error) {
    console.error("Mastery Analytics GET error:", error);
    return NextResponse.json({ error: "خطا در واکشی اطلاعات رادار و گراف تسلط" }, { status: 500 });
  }
}
