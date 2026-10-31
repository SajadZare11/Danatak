"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import {
  AdaptiveCourseStructure,
  AdaptiveLearningNode,
} from "@/lib/adaptive/types";
import { SAMPLE_CALCULUS_ADAPTIVE_COURSE } from "@/lib/adaptive/sampleCourse";
import { AdaptiveNodeMap } from "@/components/adaptive/AdaptiveNodeMap";
import { GamifiedStudyPlayer } from "@/components/adaptive/GamifiedStudyPlayer";
import { DailyFSRSReviewDeckModal } from "@/components/adaptive/DailyFSRSReviewDeckModal";
import { AdaptiveIngestUploadModal } from "@/components/adaptive/AdaptiveIngestUploadModal";
import {
  ArrowRight,
  Sparkles,
  Award,
  Calendar,
  Zap,
  BookOpen,
  Plus,
} from "lucide-react";

export default function AdaptiveStudyPackPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params?.id as string;
  const { currentUser } = useRole();

  const [course, setCourse] = useState<AdaptiveCourseStructure | null>(null);
  const [progresses, setProgresses] = useState<Record<string, any>>({});
  const [activePlayingNode, setActivePlayingNode] = useState<AdaptiveLearningNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyDeckOpen, setIsDailyDeckOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dailyDueCount, setDailyDueCount] = useState(0);

  const studentId = currentUser.role === "STUDENT" ? currentUser.id : "demo-student-id";

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/adaptive/progress?studyPackId=${packId}&studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.courseStructure);
        const map: Record<string, any> = {};
        (data.progresses || []).forEach((p: any) => {
          map[p.nodeId] = p;
        });
        setProgresses(map);
      } else {
        // اگر هنوز نودهای ادپتیو در دیتابیس نبود، از سمپل حسابان استفاده می‌کنیم
        setCourse(SAMPLE_CALCULUS_ADAPTIVE_COURSE);
      }
    } catch (err) {
      console.warn("Failed to load adaptive course, using rich sample:", err);
      setCourse(SAMPLE_CALCULUS_ADAPTIVE_COURSE);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDueCount = async () => {
    try {
      const res = await fetch(`/api/adaptive/fsrs?studentId=${studentId}&studyPackId=${packId}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setDailyDueCount(data.analysis.dueCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (packId) {
      fetchCourseData();
      fetchDueCount();
    }
  }, [packId, studentId]);

  const handleFinishNode = async (result: {
    score: number;
    heartsLeft: number;
    starsEarned: number;
    streakCount: number;
  }) => {
    if (!activePlayingNode) return;

    try {
      const res = await fetch("/api/adaptive/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: packId,
          studentId,
          nodeId: activePlayingNode.id,
          score: result.score,
          heartsLeft: result.heartsLeft,
          starsEarned: result.starsEarned,
          streakCount: result.streakCount,
          isCompleted: result.score >= activePlayingNode.minPassingScore,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // بروزرسانی استیت محلی پیشرفت
        fetchCourseData();
        fetchDueCount();
      }
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-bold text-slate-500">
          در حال بارگذاری نقشه مراحل یادگیری تطبیقی و وضعیت حافظه FSRS...
        </div>
      </div>
    );
  }

  const currentCourse = course || SAMPLE_CALCULUS_ADAPTIVE_COURSE;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* نوار ناوبری بالا */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/study-studio" className="hover:text-indigo-600 transition flex items-center gap-1 font-bold">
              <ArrowRight className="w-3.5 h-3.5" />
              استودیوی مطالعه
            </Link>
            <span>/</span>
            <Link href={`/study-studio/${packId}`} className="hover:text-indigo-600 transition font-bold">
              بسته یادگیری
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">موتور یادگیری تطبیقی</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currentCourse.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDailyDeckOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold border border-indigo-200 shadow-2xs transition"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>مرورهای امروز FSRS</span>
            {dailyDueCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {dailyDueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>آپلود جزوه جدید (⚡)</span>
          </button>
        </div>
      </div>

      {/* نمایش پلیر تعاملی نود یا نقشه مراحل */}
      {activePlayingNode ? (
        <GamifiedStudyPlayer
          node={activePlayingNode}
          onFinish={handleFinishNode}
          onBackToMap={() => setActivePlayingNode(null)}
        />
      ) : (
        <AdaptiveNodeMap
          course={currentCourse}
          progresses={progresses}
          onSelectNode={(node) => setActivePlayingNode(node)}
          onOpenDailyDeck={() => setIsDailyDeckOpen(true)}
          dailyDueCount={dailyDueCount}
          onUploadNew={() => setIsUploadOpen(true)}
        />
      )}

      {/* مدال مرورهای روزانه FSRS */}
      <DailyFSRSReviewDeckModal
        isOpen={isDailyDeckOpen}
        studentId={studentId}
        onClose={() => setIsDailyDeckOpen(false)}
        onCardReviewed={() => fetchDueCount()}
      />

      {/* مدال آپلود و پردازش چندوجهی جزوه */}
      <AdaptiveIngestUploadModal
        isOpen={isUploadOpen}
        creatorId={currentUser.id}
        studentId={studentId}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newPackId, newCourse) => {
          router.push(`/study-studio/${newPackId}/adaptive`);
        }}
      />
    </div>
  );
}
