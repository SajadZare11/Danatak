"use client";

import React, { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import {
  MessageSquare,
  Pin,
  Send,
  Plus,
  Sparkles,
  HelpCircle,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Filter,
  Check,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  const { currentRole, currentUser } = useRole();

  const [activeTab, setActiveTab] = useState<"announcements" | "qa" | "direct">("announcements");
  const [loading, setLoading] = useState(true);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [qaThreads, setQaThreads] = useState<any[]>([]);
  const [privateDms, setPrivateDms] = useState<any[]>([]);

  // فرم‌های درج پیام جدید
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState("ALL");
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [questionSubject, setQuestionSubject] = useState("MATH");

  const [replyContentMap, setReplyContentMap] = useState<Record<string, string>>({});
  const [newDmContent, setNewDmContent] = useState("");

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
      if (data.qaThreads) setQaThreads(data.qaThreads);
      if (data.privateDms) setPrivateDms(data.privateDms);
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // ارسال اطلاعیه جدید
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          type: "ANNOUNCEMENT",
          title: announcementTitle.trim() || "اطلاعیه رسمی آموزشگاه",
          content: announcementContent.trim(),
          targetRole: announcementTarget,
          isPinned: announcementPinned,
        }),
      });

      if (res.ok) {
        setIsNewAnnouncementOpen(false);
        setAnnouncementTitle("");
        setAnnouncementContent("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ارسال سوال جدید در تالار رفع اشکال
  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionContent.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          type: "QA_QUESTION",
          title: questionTitle.trim() || "پرسش درسی",
          content: questionContent.trim(),
          subjectId: questionSubject,
        }),
      });

      if (res.ok) {
        setIsNewQuestionOpen(false);
        setQuestionTitle("");
        setQuestionContent("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ثبت پاسخ به یک سوال درسی
  const handleSendReply = async (questionId: string) => {
    const text = replyContentMap[questionId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          type: "QA_ANSWER",
          parentId: questionId,
          content: text.trim(),
        }),
      });

      if (res.ok) {
        setReplyContentMap((prev) => ({ ...prev, [questionId]: "" }));
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ارسال پیام خصوصی
  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDmContent.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          type: "PRIVATE_DM",
          content: newDmContent.trim(),
          targetRole: currentRole === "PARENT" ? "TEACHER" : "PARENT",
        }),
      });

      if (res.ok) {
        setNewDmContent("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* هدر صفحه */}
      <section className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>کانال‌های ارتباطی و پیام‌رسان یکپارچه داناتک</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            مرکز اعلانات، رفع اشکال علمی و پیام‌های مستقیم
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            اطلاع‌رسانی بخشنامه‌های دبیرستان، تالار پرسش و پاسخ دروس با پشتیبانی فرمول KaTeX و ارتباط امن بین خانواده و مدرسه.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition border border-white/10"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            صفحه اصلی
          </Link>
        </div>
      </section>

      {/* ناوبری تب‌های ۳ گانه */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "announcements"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Pin className="w-4 h-4" />
            کانال اعلانات رسمی مدرسه ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "qa"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            تالار پرسش و پاسخ علمی (رفع اشکال KaTeX) ({qaThreads.length})
          </button>

          <button
            onClick={() => setActiveTab("direct")}
            className={`px-4 py-2.5 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "direct"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            پیام‌های مستقیم مشاوره و اولیا ({privateDms.length})
          </button>
        </div>

        {/* دکمه‌های درج با توجه به نقش کاربر */}
        <div>
          {activeTab === "announcements" && (currentRole === "PRINCIPAL" || currentRole === "TEACHER") && (
            <button
              onClick={() => setIsNewAnnouncementOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl font-black text-xs shadow hover:opacity-90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              انتشار اطلاعیه جدید
            </button>
          )}

          {activeTab === "qa" && (
            <button
              onClick={() => setIsNewQuestionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-bold text-xs shadow hover:opacity-90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              طرح پرسش درسی جدید
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">در حال بارگذاری پیام‌ها و مکاتبات...</p>
        </div>
      ) : (
        <>
          {/* تب ۱: اعلانات رسمی مدرسه */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm transition space-y-3 ${
                    item.isPinned ? "border-amber-400/80 bg-gradient-to-br from-amber-50/30 to-white" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {item.sender?.fullName?.slice(0, 2) || "مد"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                          {item.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                              <Pin className="w-2.5 h-2.5" /> سنجاق‌شده
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.sender?.fullName} ({item.sender?.role === "PRINCIPAL" ? "مدیریت مدرسه" : "دبیر"})</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">
                      مخاطب: {item.targetRole === "ALL" ? "عموم اعضا" : item.targetRole === "PARENT" ? "اولیا" : "دانش‌آموزان"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line pr-13">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* تب ۲: تالار رفع اشکال درسی */}
          {activeTab === "qa" && (
            <div className="space-y-6">
              {qaThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  {/* سوال دانش‌آموز */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {thread.sender?.fullName?.slice(0, 2) || "دان"}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{thread.sender?.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            درس: {thread.subjectId} • {new Date(thread.createdAt).toLocaleDateString("fa-IR")}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        {thread.answers.length} پاسخ
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-indigo-950 pt-1">{thread.title}</h4>
                    <div className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <KaTeXRenderer content={thread.content} />
                    </div>
                  </div>

                  {/* فهرست پاسخ‌ها */}
                  <div className="space-y-3 pr-4 border-r-2 border-indigo-100">
                    {thread.answers.map((ans: any) => (
                      <div
                        key={ans.id}
                        className="bg-gradient-to-l from-indigo-50/50 to-white p-3.5 rounded-xl border border-indigo-100 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {ans.sender?.fullName} ({ans.sender?.role === "TEACHER" ? "دبیر مربوطه" : "دانش‌آموز"})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ans.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <div className="text-slate-800 leading-relaxed text-xs">
                          <KaTeXRenderer content={ans.content} />
                        </div>
                      </div>
                    ))}

                    {/* کادر ارسال پاسخ جدید */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="پاسخ تشریحی خود را با پشتیبانی فرمول بنویسید..."
                        value={replyContentMap[thread.id] || ""}
                        onChange={(e) =>
                          setReplyContentMap((prev) => ({ ...prev, [thread.id]: e.target.value }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSendReply(thread.id)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        ارسال
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تب ۳: پیام‌های مستقیم */}
          {activeTab === "direct" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="space-y-3">
                {privateDms.map((dm) => (
                  <div
                    key={dm.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dm.sender?.fullName}</span>
                        <span className="text-[10px] text-slate-400">({dm.sender?.role === "PARENT" ? "ولی" : "دبیر/مشاور"})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(dm.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    {dm.title && <div className="font-bold text-indigo-900">{dm.title}</div>}
                    <p className="text-slate-700 leading-relaxed">{dm.content}</p>
                  </div>
                ))}
              </div>

              {/* کادر ارسال پیام جدید */}
              <form onSubmit={handleSendDm} className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="متن پیام جدید برای دبیر یا ولی دانش‌آموز..."
                  value={newDmContent}
                  onChange={(e) => setNewDmContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  ارسال پیام
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* مودال انتشار اطلاعیه رسمی */}
      {isNewAnnouncementOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500" />
              انتشار اطلاعیه رسمی در کانال مدرسه
            </h3>

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان اطلاعیه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زمان‌بندی آزمون جامع سمپاد"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">متن کامل اطلاعیه:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="شرح کامل بخشنامه یا اطلاع‌رسانی به کادر، اولیا و دانش‌آموزان..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={announcementPinned}
                    onChange={(e) => setAnnouncementPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  سنجاق در بالای کانال (Pinned)
                </label>

                <select
                  value={announcementTarget}
                  onChange={(e) => setAnnouncementTarget(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <option value="ALL">عموم اعضا</option>
                  <option value="STUDENT">فقط دانش‌آموزان</option>
                  <option value="PARENT">فقط اولیا</option>
                  <option value="TEACHER">فقط دبیران</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAnnouncementOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  انتشار رسمی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال طرح سوال علمی جدید */}
      {isNewQuestionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              طرح پرسش علمی در تالار رفع اشکال
            </h3>

            <form onSubmit={handlePostQuestion} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">موضوع یا سرفصل سوال:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مشتق توابع مثلثاتی و کسری"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  متن صورت سوال (با پشتیبانی فرمول‌نویسی ریاضی KaTeX مثل $f'(x)$):
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="صورت سوال را بنویسید. فرمول‌های ریاضی را بین $ یا $$ قرار دهید..."
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {questionContent && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">پیش‌نمایش فرمول:</span>
                  <KaTeXRenderer content={questionContent} />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewQuestionOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  ارسال به تالار رفع اشکال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
