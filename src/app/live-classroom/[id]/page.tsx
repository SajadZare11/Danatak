"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { InteractiveWhiteboard } from "@/components/live/InteractiveWhiteboard";
import { TeacherVideoPodium } from "@/components/live/TeacherVideoPodium";
import { LiveInClassQuizRunner } from "@/components/live/LiveInClassQuizRunner";
import {
  Radio,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  MessageSquare,
  Users,
  Settings,
  Share2,
  PhoneOff,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Clock,
  CheckCircle2,
  Send,
  Filter,
  ShieldCheck,
  Edit3,
} from "lucide-react";

export default function LiveClassroomRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser } = useRole();

  const [session, setSession] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // وضعیت‌های صوتی و تصویری کاربر
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "participants">("chat");

  // وضعیت‌های چت و فیلتر
  const [chatInput, setChatInput] = useState("");
  const [isQuestionMessage, setIsQuestionMessage] = useState(false);
  const [onlyQuestionsFilter, setOnlyQuestionsFilter] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  // نمایش یا عدم نمایش پودیوم شناور
  const [showPodium, setShowPodium] = useState(true);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isTeacher =
    currentUser.role === "TEACHER" ||
    currentUser.role === "PRINCIPAL" ||
    session?.hostTeacherId === currentUser.id;

  // اطلاعات شرکت‌کننده جاری در صورت دانش‌آموز بودن
  const currentParticipant = participants.find((p) => p.studentId === currentUser.id);
  const canDrawOnBoard = isTeacher || Boolean(currentParticipant?.boardAllowed);

  // ۱. بارگذاری اولیه اطلاعات جلسه
  const fetchSession = async () => {
    if (!id) return;
    try {
      const studentId = currentUser.role === "STUDENT" ? currentUser.id : "";
      const res = await fetch(`/api/live/sessions/${id}?studentId=${studentId}`);
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      } else {
        setError(data.error || "جلسه کلاس یافت نشد.");
      }
    } catch (err: any) {
      setError("خطا در بارگذاری کلاس: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ۲. بارگذاری پیام‌های چت
  const fetchChats = async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `/api/live/sessions/${id}/chats?onlyQuestions=${onlyQuestionsFilter}`
      );
      const data = await res.json();
      if (data.success && data.chats) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  // ۳. بارگذاری لیست حاضرین
  const fetchParticipants = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/live/sessions/${id}/participants`);
      const data = await res.json();
      if (data.success && data.participants) {
        setParticipants(data.participants);
        // اگر من دانش‌آموز هستم، وضعیت دستم را همگام کن
        const myP = data.participants.find((p: any) => p.studentId === currentUser.id);
        if (myP) {
          setIsHandRaised(Boolean(myP.handRaised));
        }
      }
    } catch (err) {
      console.error("Error fetching participants:", err);
    }
  };

  // چرخه زمانی پولینگ برای چت و حاضرین
  useEffect(() => {
    fetchSession();
    fetchChats();
    fetchParticipants();

    const chatInterval = setInterval(fetchChats, 3000);
    const participantsInterval = setInterval(fetchParticipants, 4000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(participantsInterval);
    };
  }, [id, currentUser.id, onlyQuestionsFilter]);

  // اسکرول خودکار به آخرین پیام
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats]);

  // ۴. ضربان حضور زنده در کلاس (هر ۱۵ ثانیه برای دانش‌آموز)
  useEffect(() => {
    if (isTeacher || !id || !currentUser.id) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`/api/live/sessions/${id}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            studentId: currentUser.id,
            addedSeconds: 15,
          }),
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, 15000);

    return () => clearInterval(heartbeatInterval);
  }, [id, isTeacher, currentUser.id]);

  // ارسال پیام در چت
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    setSendingChat(true);
    const text = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`/api/live/sessions/${id}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          messageText: text,
          isQuestion: isQuestionMessage,
        }),
      });
      const data = await res.json();
      if (data.success && data.chat) {
        setChats((prev) => [...prev, data.chat]);
        setIsQuestionMessage(false);
      }
    } catch (err) {
      console.error("Failed to send chat:", err);
    } finally {
      setSendingChat(false);
    }
  };

  // تغییر وضعیت دست بالا توسط دانش‌آموز
  const handleToggleHand = async () => {
    try {
      const res = await fetch(`/api/live/sessions/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_hand",
          studentId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsHandRaised(data.handRaised);
        fetchParticipants();
      }
    } catch (err) {
      console.error("Failed to toggle hand:", err);
    }
  };

  // مدیریت دسترسی میکروفون توسط دبیر
  const handleSetMicPermission = async (studentId: string, currentMicAllowed: boolean) => {
    try {
      const res = await fetch(`/api/live/sessions/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_mic",
          studentId,
          micAllowed: !currentMicAllowed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchParticipants();
      }
    } catch (err) {
      console.error("Failed to set mic permission:", err);
    }
  };

  // مدیریت دسترسی قلم تخته توسط دبیر
  const handleSetBoardPermission = async (studentId: string, currentBoardAllowed: boolean) => {
    try {
      const res = await fetch(`/api/live/sessions/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_board",
          studentId,
          boardAllowed: !currentBoardAllowed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchParticipants();
      }
    } catch (err) {
      console.error("Failed to set board permission:", err);
    }
  };

  // پایان کلاس توسط دبیر همراه با محاسبه هوشمند حضور و غیاب
  const handleEndClass = async () => {
    if (!confirm("آیا از پایان دادن به این جلسه تدریس و محاسبه حضور و غیاب اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/live/sessions/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });
      const data = await res.json();
      if (data.success && data.attendanceSummary) {
        alert(
          `جلسه تدریس به پایان رسید.\nگزارش حضور و غیاب هوشمند (معیار ۷۰٪ حضور):\n` +
          `✅ حاضر: ${data.attendanceSummary.presentCount} نفر\n` +
          `⚠️ تاخیر: ${data.attendanceSummary.lateCount} نفر\n` +
          `❌ غایب: ${data.attendanceSummary.absentCount} نفر\n\n` +
          `اطلاعات در دفتر نمرات و انضباطی مدرسه ثبت شد.`
        );
      } else {
        alert("جلسه کلاس با موفقیت به پایان رسید.");
      }
      router.push("/teacher");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">در حال اتصال به اتاق وبینار و استودیو تدریس زنده...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold">
          {error || "کلاس یافت نشد."}
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const handRaisedParticipants = participants.filter((p) => p.handRaised);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden" dir="rtl">
      {/* هدر بالای اتاق کلاس آنلاین */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={isTeacher ? "/teacher" : "/student"}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="خروج از اتاق"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
              پخش زنده (LIVE)
            </span>
          </div>

          <div>
            <h1 className="text-sm font-black text-white">{session.title}</h1>
            <p className="text-[11px] text-slate-400">
              {session.classroom?.name} • دبیر: {session.hostTeacher?.fullName} ({session.subjectTitle})
            </p>
          </div>
        </div>

        {/* دکمه‌های کنترلی سمت چپ هدر */}
        <div className="flex items-center gap-2">
          {/* کوییز آنی کلاسی */}
          <LiveInClassQuizRunner
            sessionId={session.id}
            isTeacher={isTeacher}
            currentUserId={currentUser.id}
          />

          {/* نشانگر اجازه نوشتن تخته برای دانش‌آموز */}
          {!isTeacher && currentParticipant?.boardAllowed && (
            <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
              <Edit3 className="w-3.5 h-3.5" />
              <span>دسترسی نوشتن روی تخته فعال است</span>
            </span>
          )}

          {isTeacher && (
            <button
              type="button"
              onClick={handleEndClass}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>پایان کلاس و خروج</span>
            </button>
          )}

          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>زمان جلسه: زنده</span>
          </div>

          <Link
            href="/live-classroom/archive"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
            title="مشاهده آرشیو کلاس‌ها و جزوات"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">آرشیو جلسات</span>
          </Link>
        </div>
      </header>

      {/* ناحیه محتوای کلاس: استودیو تدریس + سایدبار تعاملی */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* بخش اصلی تدریس (محل تخته سیاه تعاملی و پودیوم) */}
        <main className="flex-1 bg-slate-900/60 p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            <InteractiveWhiteboard
              sessionId={session.id}
              canDraw={canDrawOnBoard}
              onSaveSnapshot={async (snapshotJson) => {
                try {
                  await fetch(`/api/live/sessions/${session.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ whiteboardSnapshotJson: snapshotJson }),
                  });
                } catch (e) {
                  console.error("Failed to save board snapshot:", e);
                }
              }}
            />

            {/* پودیوم تصویر ویدئویی شناور استاد در گوشه بالای صفحه */}
            {showPodium && (
              <div className="absolute top-4 left-4 z-30">
                <TeacherVideoPodium
                  isTeacher={isTeacher}
                  teacherName={session.hostTeacher?.fullName || "استاد کلاس"}
                  subjectTitle={session.subjectTitle}
                  isMicOn={isMicOn}
                  isVideoOn={isVideoOn}
                  onToggleMic={() => setIsMicOn(!isMicOn)}
                  onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                />
              </div>
            )}
          </div>

          {/* نوار کنترل پایین کلاس (میکروفون، وبکم، دست بلند کردن) */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-3">
            {/* دکمه میکروفون: اگر دبیر است یا دانش‌آموز اجازه میکروفون دارد */}
            {(isTeacher || currentParticipant?.micAllowed) && (
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-2xl transition font-bold text-xs flex items-center gap-2 ${
                  isMicOn
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                <span>{isMicOn ? "میکروفون روشن" : "میکروفون بسته"}</span>
              </button>
            )}

            {isTeacher && (
              <button
                type="button"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-2xl transition font-bold text-xs flex items-center gap-2 ${
                  isVideoOn
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
                <span>{isVideoOn ? "دوربین فعال" : "دوربین غیرفعال"}</span>
              </button>
            )}

            {/* دکمه دست بلند کردن مخصوص دانش‌آموزان */}
            {!isTeacher && (
              <button
                type="button"
                onClick={handleToggleHand}
                className={`p-3 rounded-2xl transition font-bold text-xs flex items-center gap-2 ${
                  isHandRaised
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>{isHandRaised ? "دست شما بالاست (در انتظار نوبت) ✋" : "اجازه گرفتن (دست بالا)"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPodium(!showPodium)}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              title="نمایش یا پنهان کردن پنجره ویدیو"
            >
              <Video className="w-4 h-4 text-indigo-400" />
              <span>{showPodium ? "پنهان کردن پودیوم" : "نمایش پودیوم"}</span>
            </button>
          </div>
        </main>

        {/* سایدبار سمت راست: چت تعاملی و لیست شرکت‌کنندگان و مدیریت اجازه */}
        <aside className="w-full md:w-88 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          {/* تب‌های سایدبار */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSidebarTab("chat")}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeSidebarTab === "chat"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>گفتگوی کلاسی ({chats.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarTab("participants")}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 relative ${
                activeSidebarTab === "participants"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>حاضرین ({participants.length + 1})</span>
              {handRaisedParticipants.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 left-2" />
              )}
            </button>
          </div>

          {/* محتوای تب چت */}
          {activeSidebarTab === "chat" && (
            <div className="flex-1 flex flex-col justify-between p-3.5 space-y-3 overflow-hidden text-xs">
              {/* فیلتر پیام‌ها */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Filter className="w-3 h-3" />
                  <span>نمایش پیام‌ها:</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setOnlyQuestionsFilter(false)}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${
                      !onlyQuestionsFilter
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyQuestionsFilter(true)}
                    className={`px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 ${
                      onlyQuestionsFilter
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>فقط سوالات</span>
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* لیست پیام‌ها */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 text-slate-300 leading-relaxed text-[11px]">
                  به جلسه آنلاین <span className="font-bold text-white">{session.classroom?.name}</span> خوش آمدید. پیام‌ها و سوالات درسی به صورت لحظه‌ای قابل مشاهده است.
                </div>

                {chats.map((c: any) => {
                  const isMsgTeacher = c.isTeacher || c.sender?.role === "TEACHER" || c.sender?.role === "PRINCIPAL";
                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl space-y-1 border ${
                        c.isQuestion
                          ? "bg-amber-500/10 border-amber-500/30"
                          : isMsgTeacher
                          ? "bg-indigo-600/15 border-indigo-500/30"
                          : "bg-slate-800/60 border-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isMsgTeacher ? "text-indigo-300" : "text-slate-300"}`}>
                            {c.sender?.fullName || "شرکت‌کننده"}
                          </span>
                          {isMsgTeacher && (
                            <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded-sm text-[9px] font-bold">
                              دبیر
                            </span>
                          )}
                          {c.isQuestion && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-sm text-[9px] font-bold flex items-center gap-0.5">
                              <HelpCircle className="w-2.5 h-2.5" />
                              <span>سوال درسی</span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono">
                          {new Date(c.sentAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{c.messageText}</p>
                    </div>
                  );
                })}
              </div>

              {/* فرم ارسال پیام */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-amber-300 select-none">
                    <input
                      type="checkbox"
                      checked={isQuestionMessage}
                      onChange={(e) => setIsQuestionMessage(e.target.checked)}
                      className="rounded-sm border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>ارسال به عنوان «سوال درسی» ❓</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="پیام یا پرسش خود را تایپ کنید..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* محتوای تب حاضرین و مدیریت دسترسی‌ها */}
          {activeSidebarTab === "participants" && (
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
              {/* بخش دست‌های بالا برده شده (مخصوص توجه دبیر) */}
              {handRaisedParticipants.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5 animate-bounce" />
                      <span>دست‌های بالا برای اجازه صحبت ({handRaisedParticipants.length})</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {handRaisedParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 bg-slate-900/90 rounded-xl border border-amber-500/20 flex items-center justify-between"
                      >
                        <span className="font-bold text-white text-[11px]">{p.student?.fullName}</span>
                        {isTeacher && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetMicPermission(p.studentId, p.micAllowed)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <Mic className="w-3 h-3" />
                              <span>اجازه صحبت</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* دبیر کلاس */}
              <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="font-bold text-white text-xs">{session.hostTeacher?.fullName}</p>
                    <p className="text-[10px] text-slate-400">دبیر و میزبان جلسه</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                  میزبان
                </span>
              </div>

              {/* لیست دانش‌آموزان حاضر */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-400">دانش‌آموزان حاضر در کلاس:</p>

                {participants.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-4">هنوز دانش‌آموزی وارد کلاس نشده است.</p>
                ) : (
                  participants.map((p) => {
                    const presentMinutes = Math.floor((p.totalPresentSeconds || 0) / 60);

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-800 transition flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-slate-200 font-bold text-xs">
                              {p.student?.fullName || "دانش‌آموز"}
                            </span>
                            {p.handRaised && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold">
                                ✋
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            حضور: {presentMinutes} دقیقه ({p.totalPresentSeconds || 0} ثانیه)
                          </span>
                        </div>

                        {/* دسترسی‌های مدیریتی برای معلم */}
                        {isTeacher ? (
                          <div className="flex items-center gap-1">
                            {/* دکمه میکروفون */}
                            <button
                              type="button"
                              onClick={() => handleSetMicPermission(p.studentId, p.micAllowed)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold transition flex items-center ${
                                p.micAllowed
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                              title={p.micAllowed ? "بستن میکروفون دانش‌آموز" : "اعطای اجازه صحبت"}
                            >
                              {p.micAllowed ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                            </button>

                            {/* دکمه تخته سیاه */}
                            <button
                              type="button"
                              onClick={() => handleSetBoardPermission(p.studentId, p.boardAllowed)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold transition flex items-center ${
                                p.boardAllowed
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                              title={p.boardAllowed ? "پس گرفتن قلم تخته" : "اعطای قلم نوری تخته"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px]">
                            {p.micAllowed && (
                              <span className="text-emerald-400" title="میکروفون فعال">
                                <Mic className="w-3 h-3" />
                              </span>
                            )}
                            {p.boardAllowed && (
                              <span className="text-amber-400" title="دسترسی تخته فعال">
                                <Edit3 className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
