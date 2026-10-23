"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import { CreateStudyPackModal } from "@/components/study-studio/CreateStudyPackModal";
import { AssignStudyPackModal } from "@/components/study-studio/AssignStudyPackModal";
import {
  Sparkles,
  BookOpen,
  Plus,
  Layers,
  Zap,
  HelpCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  Trash2,
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Send,
} from "lucide-react";

export default function StudyStudioHubPage() {
  const { currentUser } = useRole();
  const [packs, setPacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackForAssign, setSelectedPackForAssign] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchPacks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/study-studio/packs");
      const data = await res.json();
      if (data.success) {
        setPacks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load packs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const filteredPacks = packs.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.topicTag && p.topicTag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* بنر هدر استودیو با طراحی های‌تک */}
      <section className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-400/30 text-xs px-3.5 py-1 rounded-full font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              استودیوی یادگیری هوشمند (الگوبرداری از Gizmo.ai و StudyFetch)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              استودیوی مطالعه و فلش‌کارت‌های هوشمند SM-2
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              با هوش مصنوعی از روی جزوه، متن یا صدای کلاس، بسته‌های یادگیری چندمنظوره شامل فلش‌کارت‌های سه‌بعدی با الگوریتم مرور فاصله‌دار، کوییزهای تشخیصی بلوم و نقشه‌های مفهومی تولید کنید.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 border border-amber-300"
              >
                <Plus className="w-4 h-4" />
                تولید بسته جدید با هوش مصنوعی ⚡
              </button>
            </div>
          </div>

          <div className="flex sm:flex-col gap-3 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{packs.length} بسته مطالعه فعال</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>الگوریتم رسمی SuperMemo-2</span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>نقشه ذهنی گراف مفاهیم</span>
            </div>
          </div>
        </div>
      </section>

      {/* نوار جستجو و فیلتر */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در بسته‌ها و سرفصل‌ها..."
            className="w-full pl-3 pr-10 py-2 text-xs rounded-2xl border border-slate-200 bg-white shadow-xs focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          افزودن بسته مطالعه
        </button>
      </div>

      {/* شبکه کارت‌های بسته‌های یادگیری */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>در حال بارگذاری بسته‌های یادگیری استودیو...</div>
        </div>
      ) : filteredPacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                    {pack.topicTag || "مبحث تحلیلی"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    پایه {pack.gradeLevel || 12}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition leading-snug">
                  {pack.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {pack.description || "بسته مطالعه تولیدشده با هوش مصنوعی"}
                </p>

                {/* آمار بسته */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <div className="text-sm font-black text-slate-800">
                      {pack._count?.flashcards || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">فلش‌کارت</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <div className="text-sm font-black text-slate-800">
                      {pack._count?.quizzes || 1}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">کوییز سنجش</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <div className="text-sm font-black text-emerald-700">SM-2</div>
                    <div className="text-[10px] text-slate-500 font-medium">مرور فعال</div>
                  </div>
                </div>
              </div>

              {/* اکشن‌های هدایت به پلیر و ابلاغ تکلیف */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/study-studio/${pack.id}`}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  ورود به اتاق مطالعه
                </Link>

                {(currentUser.role === "TEACHER" || currentUser.role === "PRINCIPAL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackForAssign(pack);
                      setIsAssignModalOpen(true);
                    }}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition"
                    title="ابلاغ تکلیف به کلاس (MagicSchool)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">هنوز بسته مطالعه‌ای ساخته نشده است</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            با کلیک روی دکمه زیر، اولین بسته هوشمند خود را با الصاق متن، PDF یا عکس تخته ایجاد کنید.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            تولید نخستین بسته مطالعه
          </button>
        </div>
      )}

      {/* مدال ساخت بسته جدید */}
      <CreateStudyPackModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        creatorId={currentUser.id}
        studentId={currentUser.role === "STUDENT" ? currentUser.id : undefined}
        onSuccess={(packId) => {
          fetchPacks();
        }}
      />

      {/* مدال تخصیص تکلیف به کلاس / دانش‌آموز (MagicSchool) */}
      {selectedPackForAssign && (
        <AssignStudyPackModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedPackForAssign(null);
          }}
          studyPackId={selectedPackForAssign.id}
          studyPackTitle={selectedPackForAssign.title}
          topicTag={selectedPackForAssign.topicTag}
        />
      )}
    </div>
  );
}
