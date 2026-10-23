"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Video, ArrowLeft, Users, Sparkles, BookOpen } from "lucide-react";

interface LiveClassAlertBannerProps {
  studentId?: string;
  teacherId?: string;
  classroomId?: string;
}

export const LiveClassAlertBanner: React.FC<LiveClassAlertBannerProps> = ({
  studentId,
  teacherId,
  classroomId,
}) => {
  const [activeSession, setActiveSession] = useState<any | null>(null);

  const checkLiveSessions = async () => {
    try {
      let url = "/api/live/sessions?status=LIVE";
      if (studentId) url += `&studentId=${studentId}`;
      else if (teacherId) url += `&teacherId=${teacherId}`;
      else if (classroomId) url += `&classroomId=${classroomId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.sessions && data.sessions.length > 0) {
        setActiveSession(data.sessions[0]);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("Failed to check active live sessions:", err);
    }
  };

  useEffect(() => {
    checkLiveSessions();
    const interval = setInterval(checkLiveSessions, 15000); // چک کردن هر ۱۵ ثانیه
    return () => clearInterval(interval);
  }, [studentId, teacherId, classroomId]);

  if (!activeSession) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 text-white p-4 sm:p-5 rounded-3xl border-2 border-rose-500/50 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <span className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
              <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
            </span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-ping" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                پخش زنده فعال (LIVE)
              </span>
              <span className="text-xs text-rose-200 font-bold">
                {activeSession.classroom?.name}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white">
              {activeSession.title}
            </h3>

            <p className="text-[11px] text-slate-300 flex items-center gap-2">
              <span>درس: {activeSession.subjectTitle}</span>
              <span>•</span>
              <span>دبیر: {activeSession.hostTeacher?.fullName}</span>
              <span>•</span>
              <span className="font-mono text-rose-300">
                {activeSession._count?.participants || 0} نفر در کلاس
              </span>
            </p>
          </div>
        </div>

        <Link
          href={`/live-classroom/${activeSession.id}`}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 shrink-0 border border-rose-400/30"
        >
          <Video className="w-4 h-4" />
          <span>ورود به اتاق کلاس آنلاین 🔴</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
