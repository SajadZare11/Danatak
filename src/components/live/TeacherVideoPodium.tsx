"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
  UserCheck,
  Radio,
} from "lucide-react";

interface TeacherVideoPodiumProps {
  isTeacher: boolean;
  teacherName: string;
  subjectTitle?: string;
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
}

export function TeacherVideoPodium({
  isTeacher,
  teacherName,
  subjectTitle = "جلسه درسی",
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
}: TeacherVideoPodiumProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(45); // Visualizer level

  // شبیه‌سازی نوسان صدای استاد هنگام فعال بودن میکروفون
  useEffect(() => {
    if (!isMicOn) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      // نوسان تصادفی برای نمایش فرکانس صدا
      const level = Math.floor(Math.random() * 55) + 35;
      setAudioLevel(level);
    }, 180);
    return () => clearInterval(interval);
  }, [isMicOn]);

  // مدیریت استریم دوربین فیزیکی یا اشتراک تصویر با فال‌بک امن
  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (!isVideoOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsFallbackActive(false);
        return;
      }

      if (isTeacher && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false, // صدا جداگانه کنترل می‌شود
          });
          if (active && videoRef.current) {
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setIsFallbackActive(false);
          }
        } catch (err) {
          // در صورت عدم وجود دوربین فیزیکی یا رد مجوز دسترسی، از فال‌بک تعاملی استفاده می‌شود
          console.log("No physical camera or access denied; switching to simulated teacher stream:", err);
          if (active) {
            setIsFallbackActive(true);
          }
        }
      } else {
        setIsFallbackActive(true);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isVideoOn, isTeacher]);

  // اشتراک‌گذاری صفحه نمایش دسکتاپ
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsScreenSharing(false);
      // بازگشت به دوربین
      if (isVideoOn) {
        onToggleVideo();
        setTimeout(onToggleVideo, 200);
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        streamRef.current = screenStream;
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          videoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);
        setIsFallbackActive(false);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    } else {
      alert("قابلیت اشتراک‌گذاری صفحه در این مرورگر پشتیبانی نمی‌شود.");
    }
  };

  return (
    <div
      className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col ${
        isExpanded
          ? "fixed inset-4 z-50 md:inset-12 bg-slate-950/95"
          : "w-64 sm:w-72 h-44 sm:h-48 relative"
      }`}
      dir="rtl"
    >
      {/* هدر بالای پودیوم */}
      <div className="px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between text-xs text-white z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-black text-[11px] text-slate-200 truncate max-w-[120px]">
            {isScreenSharing ? "اشتراک دسکتاپ" : teacherName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition"
            title={isExpanded ? "کوچک‌نمایی" : "بزرگ‌نمایی پودیوم"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ناحیه پخش ویدیو / تصویر */}
      <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
        {/* عنصر ویدیو در صورت دریافت استریم زنده */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isVideoOn && !isFallbackActive ? "opacity-100" : "hidden"
          }`}
        />

        {/* فال‌بک تعاملی شبیه‌ساز استودیو در صورت نبود دوربین فیزیکی یا خاموش بودن آن */}
        {(!isVideoOn || isFallbackActive) && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-center relative overflow-hidden select-none">
            {/* جلوه موج‌های رادیویی پس‌زمینه */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div
                className="w-44 h-44 rounded-full border border-indigo-400 animate-ping"
                style={{ animationDuration: "3s" }}
              />
            </div>

            {/* آواتار تدریس استاد */}
            <div className="relative mb-2">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-xl border-2 transition-all duration-300 ${
                  isMicOn
                    ? "bg-gradient-to-tr from-indigo-600 to-rose-600 border-rose-400 scale-105"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                {teacherName.slice(0, 2)}
              </div>

              {/* نشانگر زنده بودن صدا */}
              {isMicOn && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-slate-200">{teacherName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{subjectTitle}</p>

            <span className="mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-800/90 text-indigo-300 border border-indigo-500/30">
              {isVideoOn ? "استودیو زنده (شبیه‌ساز تدریس)" : "دوربین غیرفعال"}
            </span>
          </div>
        )}

        {/* اکولایزر امواج صدا در گوشه پایین تصویر */}
        {isMicOn && (
          <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
            <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
            <div className="flex items-end gap-0.5 h-3">
              <span
                className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                style={{ height: `${Math.max(20, audioLevel * 0.4)}%` }}
              />
              <span
                className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                style={{ height: `${Math.max(30, audioLevel * 0.8)}%` }}
              />
              <span
                className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                style={{ height: `${Math.max(15, audioLevel * 0.6)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* نوار ابزار کنترل استاد زیر پودیوم */}
      {isTeacher && (
        <div className="p-2 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-around gap-2 text-xs">
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2 rounded-xl transition flex items-center gap-1 font-bold ${
              isMicOn
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            }`}
            title={isMicOn ? "بستن میکروفون" : "باز کردن میکروفون"}
          >
            {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onToggleVideo}
            className={`p-2 rounded-xl transition flex items-center gap-1 font-bold ${
              isVideoOn
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            title={isVideoOn ? "خاموش کردن دوربین" : "روشن کردن دوربین"}
          >
            {isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleToggleScreenShare}
            className={`p-2 rounded-xl transition flex items-center gap-1 font-bold ${
              isScreenSharing
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            title={isScreenSharing ? "توقف اشتراک دسکتاپ" : "اشتراک صفحه نمایش (Screen Share)"}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
