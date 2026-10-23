"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function SchedulePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const daysOfWeekFa = [
    { index: 0, title: "شنبه" },
    { index: 1, title: "یکشنبه" },
    { index: 2, title: "دوشنبه" },
    { index: 3, title: "سه‌شنبه" },
    { index: 4, title: "چهارشنبه" },
  ];

  const periodsHeader = [
    { index: 1, label: "زنگ اول", time: "۰۷:۴۵ الی ۰۹:۱۵" },
    { index: 2, label: "زنگ دوم", time: "۰۹:۳۰ الی ۱۱:۰۰" },
    { index: 3, label: "زنگ سوم", time: "۱۱:۱۵ الی ۱۲:۴۵" },
    { index: 4, label: "زنگ چهارم", time: "۱۳:۱۵ الی ۱۴:۳۰" },
  ];

  const fetchSchedule = async (cId?: string) => {
    setLoading(true);
    try {
      const q = cId ? `?classroomId=${cId}` : "";
      const res = await fetch(`/api/schedule${q}`);
      const json = await res.json();
      setData(json);
      if (json.classroom && !selectedClassId) {
        setSelectedClassId(json.classroom.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedClassId);
  }, [selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* هدر صفحه */}
      <section className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full font-bold">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>برنامه هفتگی کلاسی و تقویم تحصیلی هوشمند داناتک</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            برنامه هفتگی دروس، تقویم امتحانات و رویدادهای دبیرستان
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            تنظیم ساعات زنگ‌های ۱ الی ۴ از شنبه تا چهارشنبه، رصد زنده زنگ کلاسی در حال برگزاری و تقویم زمانی مهلت تکالیف و آزمون‌ها.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            نسخه چاپی برنامه
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition border border-white/10"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            صفحه اصلی
          </Link>
        </div>
      </section>

      {/* نوار وضعیت زنگ در حال برگزاری (Live Active Period) */}
      {data?.activePeriod && (
        <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-300 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <span>زنگ و کلاس فعال در حال حاضر</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  ساعت {data.currentTimeStr}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black mt-0.5">
                زنگ {data.activePeriod.periodIndex}: درس {data.activePeriod.subjectName} ({data.activePeriod.startTime} الی {data.activePeriod.endTime})
              </div>
              <div className="text-xs text-emerald-100 mt-0.5">
                دبیر: {data.activePeriod.teacherName} • {data.activePeriod.roomNumber || "کلاس ۲۰۱"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Link
              href="/classroom"
              className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-black shadow-md flex items-center gap-1.5 transition transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>ورود به کلاس آنلاین زنده</span>
            </Link>
            <div className="text-xs bg-white/15 px-3 py-2 rounded-xl border border-white/20 text-center font-bold">
              کلاس {data.classroom?.name}
            </div>
          </div>
        </section>
      )}

      {/* انتخاب کلاس و جدول هفتگی */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ستون راست: جدول هفتگی */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">کلاس آموزشی:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {data?.classrooms?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              سال تحصیلی ۱۴۰۳-۱۴۰۴ • دبیرستان علامه حلی ۱ (سمپاد)
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">در حال واکشی جدول ساعات درسی...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 border border-slate-200 text-center w-24">روز هفته</th>
                    {periodsHeader.map((h) => (
                      <th key={h.index} className="p-3 border border-slate-200 text-center">
                        <div className="font-black text-slate-900">{h.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{h.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeekFa.map((day) => {
                    const isToday = data?.timetableDayOfWeek === day.index;

                    return (
                      <tr
                        key={day.index}
                        className={isToday ? "bg-indigo-50/40" : "hover:bg-slate-50/50"}
                      >
                        <td className="p-3 border border-slate-200 text-center font-black text-slate-800 bg-slate-50/70">
                          <div className="flex flex-col items-center gap-1">
                            <span>{day.title}</span>
                            {isToday && (
                              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                                امروز
                              </span>
                            )}
                          </div>
                        </td>

                        {periodsHeader.map((pHeader) => {
                          const period = data?.periods?.find(
                            (p: any) =>
                              p.dayOfWeek === day.index && p.periodIndex === pHeader.index
                          );

                          const isLive =
                            isToday &&
                            data?.activePeriod &&
                            data.activePeriod.periodIndex === pHeader.index;

                          return (
                            <td
                              key={pHeader.index}
                              className={`p-3 border border-slate-200 transition ${
                                isLive
                                  ? "bg-emerald-50/80 ring-2 ring-emerald-500 rounded-lg shadow-sm"
                                  : ""
                              }`}
                            >
                              {period ? (
                                <div className="space-y-1 text-center sm:text-right">
                                  <div className="font-black text-indigo-950 text-xs sm:text-sm flex items-center justify-between gap-1">
                                    <span>{period.subjectName}</span>
                                    {isLive && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{period.teacherName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{period.roomNumber || "کلاس ۲۰۱"}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-slate-300 text-xs">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ستون چپ: تقویم امتحانات و رویدادهای آینده */}
        <div className="lg:col-span-4 space-y-5 print:hidden">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800">
                تقویم رویدادها و امتحانات پیش‌رو
              </h3>
            </div>

            <div className="space-y-3">
              {data?.upcomingEvents?.map((event: any) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs hover:border-indigo-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        event.type === "EXAM"
                          ? "bg-purple-100 text-purple-800"
                          : event.type === "ASSIGNMENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {event.type === "EXAM"
                        ? "آزمون کلاسی"
                        : event.type === "ASSIGNMENT"
                        ? "تکلیف درسی"
                        : "مجمع اولیا"}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 leading-snug">
                    {event.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
