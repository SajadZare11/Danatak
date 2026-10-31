"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Calendar,
  Plus,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";

export default function StudentAdaptiveEnginePage() {
  const router = useRouter();
  const { currentUser } = useRole();

  const [course, setCourse] = useState<AdaptiveCourseStructure>(SAMPLE_CALCULUS_ADAPTIVE_COURSE);
  const [packId, setPackId] = useState<string>("seed-calculus-pack");
  const [progresses, setProgresses] = useState<Record<string, any>>({});
  const [activePlayingNode, setActivePlayingNode] = useState<AdaptiveLearningNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyDeckOpen, setIsDailyDeckOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dailyDueCount, setDailyDueCount] = useState(3);

  const studentId = currentUser.role === "STUDENT" ? currentUser.id : "demo-student-id";

  const fetchAdaptiveData = async () => {
    setIsLoading(true);
    try {
      // بررسی آیا بسته تطبیقی از پیش در پایگاه داده وجود دارد
      const packsRes = await fetch("/api/study-studio/packs");
      const packsData = await packsRes.json();

      let targetId = "seed-pack";
      if (packsData.success && packsData.data && packsData.data.length > 0) {
        // یافتن بسته‌ای که nodesJson دارد یا اولین بسته
        const foundWithNodes = packsData.data.find((p: any) => p.nodesJson);
        targetId = foundWithNodes ? foundWithNodes.id : packsData.data[0].id;
      }

      setPackId(targetId);

      const res = await fetch(`/api/adaptive/progress?studyPackId=${targetId}&studentId=${studentId}`);
      const data = await res.json();
      if (data.success && data.courseStructure) {
        setCourse(data.courseStructure);
        const map: Record<string, any> = {};
        (data.progresses || []).forEach((p: any) => {
          map[p.nodeId] = p;
        });
        setProgresses(map);
      } else {
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
      const res = await fetch(`/api/adaptive/fsrs?studentId=${studentId}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setDailyDueCount(data.analysis.dueCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdaptiveData();
    fetchDueCount();
  }, [studentId]);

  const handleFinishNode = async (result: {
    score: number;
    heartsLeft: number;
    starsEarned: number;
    streakCount: number;
  }) => {
    if (!activePlayingNode) return;

    try {
      await fetch("/api/adaptive/progress", {
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

      fetchAdaptiveData();
      fetchDueCount();
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-bold text-slate-500">
          در حال بارگذاری موتور یادگیری تطبیقی و وضعیت حافظه FSRS...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* هدر بالایی ناوبری */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/student" className="hover:text-indigo-600 transition flex items-center gap-1 font-bold">
              <ArrowRight className="w-3.5 h-3.5" />
              داشبورد دانش‌آموز
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">موتور یادگیری تطبیقی هوشمند</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {course.title}
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>تبدیل جزوه جدید با هوش مصنوعی ⚡</span>
          </button>
        </div>
      </div>

      {/* نمایش پلیر مرحله‌ای یا نقشه نودها */}
      {activePlayingNode ? (
        <GamifiedStudyPlayer
          node={activePlayingNode}
          onFinish={handleFinishNode}
          onBackToMap={() => setActivePlayingNode(null)}
        />
      ) : (
        <AdaptiveNodeMap
          course={course}
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

      {/* مدال آپلود چندوجهی جزوه */}
      <AdaptiveIngestUploadModal
        isOpen={isUploadOpen}
        creatorId={currentUser.id}
        studentId={studentId}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newPackId, newCourse) => {
          setPackId(newPackId);
          setCourse(newCourse);
          fetchAdaptiveData();
        }}
      />
    </div>
  );
}
