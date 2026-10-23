"use client";

import React, { useState } from "react";
import {
  Printer,
  Download,
  FileText,
  CheckCircle2,
  QrCode,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Maximize2,
} from "lucide-react";

export type SheetTemplateType = "30_QUESTIONS" | "60_QUESTIONS" | "120_QUESTIONS";

interface PrintableBubbleSheetProps {
  examTitle?: string;
  schoolName?: string;
  studentName?: string;
  nationalId?: string;
  studentId?: string;
  examId?: string;
  classroomName?: string;
  initialTemplate?: SheetTemplateType;
  onClose?: () => void;
}

export function PrintableBubbleSheet({
  examTitle = "آزمون آزمایشی کنکور سراسری و سمپاد",
  schoolName = "دبیرستان استعدادهای درخشان علامه حلی ۱ (دوره دوم)",
  studentName = "علی رضایی",
  nationalId = "0023456789",
  studentId = "std_default",
  examId = "exam_default",
  classroomName = "دوازدهم ریاضی الف",
  initialTemplate = "30_QUESTIONS",
  onClose,
}: PrintableBubbleSheetProps) {
  const [template, setTemplate] = useState<SheetTemplateType>(initialTemplate);
  const [isPersonalized, setIsPersonalized] = useState(true);

  const getQuestionCount = () => {
    if (template === "30_QUESTIONS") return 30;
    if (template === "60_QUESTIONS") return 60;
    return 120;
  };

  const getColumnCount = () => {
    if (template === "30_QUESTIONS") return 1;
    if (template === "60_QUESTIONS") return 2;
    return 4;
  };

  const totalQuestions = getQuestionCount();
  const columnCount = getColumnCount();
  const questionsPerColumn = totalQuestions / columnCount;

  const handlePrint = () => {
    window.print();
  };

  // بارکد شناسایی هوشمند ترکیبی
  const qrPayload = JSON.stringify({
    sid: isPersonalized ? studentId : "BLANK",
    nid: isPersonalized ? nationalId : "",
    eid: examId,
    tmpl: template,
    tq: totalQuestions,
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 flex flex-col items-center" dir="rtl">
      {/* استایل‌های اختصاصی پرینت بدون کادر یا حاشیه‌های زاید */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 8mm 6mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .fiducial-marker {
            background-color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bubble {
            border: 1.5px solid #000000 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* نوار ابزار تنظیمات بالای برگه (مخفی در پرینت) */}
      <header className="w-full max-w-4xl bg-slate-800/90 border border-slate-700 rounded-3xl p-4 mb-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 no-print shadow-xl">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
              title="بستن"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Printer className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-sm font-black text-white">طراحی و چاپ پاسخ‌برگ استاندارد OMR</h2>
            <p className="text-[11px] text-slate-400">
              قالب‌های آماده برای تصحیح خودکار با دوربین هوش مصنوعی (کنکور، قلم‌چی و سمپاد)
            </p>
          </div>
        </div>

        {/* انتخاب نوع برگه */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTemplate("30_QUESTIONS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                template === "30_QUESTIONS" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              ۳۰ سوالی (کلاسی)
            </button>
            <button
              type="button"
              onClick={() => setTemplate("60_QUESTIONS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                template === "60_QUESTIONS" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              ۶۰ سوالی (جامع)
            </button>
            <button
              type="button"
              onClick={() => setTemplate("120_QUESTIONS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                template === "120_QUESTIONS" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              ۱۲۰ سوالی (کنکوری)
            </button>
          </div>

          {/* سوییچ برگه خام یا با نام دانش‌آموز */}
          <button
            type="button"
            onClick={() => setIsPersonalized(!isPersonalized)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isPersonalized
                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {isPersonalized ? "شخصی‌سازی شده (با نام)" : "برگه خام (بدون نام)"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ برگه (Print)</span>
          </button>
        </div>
      </header>

      {/* سند چاپی پاسخ‌برگ (ابعاد دقیق کاغذ استاندارد A4) */}
      <div
        className="print-area w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between font-sans border-2 border-slate-300 select-none"
        style={{ minHeight: "280mm" }}
      >
        {/* ۱. مارکرهای سیاه‌گوشه کالیبراسیون برای اسکنر و بینایی ماشین (۴ مارکر در گوشه‌ها) */}
        <div className="fiducial-marker absolute top-4 left-4 w-5 h-5 bg-black" title="OMR TL Marker" />
        <div className="fiducial-marker absolute top-4 right-4 w-5 h-5 bg-black" title="OMR TR Marker" />
        <div className="fiducial-marker absolute bottom-4 left-4 w-5 h-5 bg-black" title="OMR BL Marker" />
        <div className="fiducial-marker absolute bottom-4 right-4 w-5 h-5 bg-black" title="OMR BR Marker" />

        {/* ۲. سربرگ آزمون و مشخصات داوطلب */}
        <div className="pt-2 px-6 pb-4 border-b-2 border-black">
          <div className="flex items-center justify-between gap-4">
            {/* لوگو و نام مدرسه */}
            <div className="space-y-1">
              <h1 className="text-base font-black text-black">{schoolName}</h1>
              <p className="text-xs font-bold text-slate-800">{examTitle}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-700 pt-1">
                <span>کلاس: {classroomName}</span>
                <span>•</span>
                <span>تعداد سوالات: {totalQuestions} تست</span>
                <span>•</span>
                <span>نمره منفی: یک‌سوم ($\frac{1}{3}$)</span>
              </div>
            </div>

            {/* بخش QR-Code شناسه هوشمند */}
            <div className="flex flex-col items-center justify-center p-2 border-2 border-black rounded-xl bg-slate-50">
              <div className="w-16 h-16 bg-black flex items-center justify-center text-white text-[9px] font-mono text-center p-1 rounded-sm">
                <QrCode className="w-12 h-12 text-white" />
              </div>
              <span className="text-[8px] font-mono font-bold mt-1 tracking-tighter">
                {isPersonalized ? nationalId : "OMR-BLANK-SHEET"}
              </span>
            </div>
          </div>

          {/* کادر مشخصات داوطلب */}
          <div className="mt-3 pt-2.5 border-t border-slate-300 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-300">
              <span className="text-[10px] text-slate-600 block">نام و نام خانوادگی داوطلب:</span>
              <span className="font-black text-black text-xs">
                {isPersonalized ? studentName : "..................................."}
              </span>
            </div>

            <div className="bg-slate-100 p-2 rounded-lg border border-slate-300">
              <span className="text-[10px] text-slate-600 block">شماره ملی / داوطلبی:</span>
              <span className="font-mono font-black text-black text-xs">
                {isPersonalized ? nationalId : "..................................."}
              </span>
            </div>

            <div className="bg-slate-100 p-2 rounded-lg border border-slate-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-600 block">کد پاسخ‌برگ:</span>
                <span className="font-mono font-black text-indigo-900 text-xs">{template}</span>
              </div>
              <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm">
                فرم A
              </span>
            </div>
          </div>
        </div>

        {/* ۳. راهنمای پر کردن پاسخ‌برگ */}
        <div className="my-2 px-6 py-1.5 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between text-[10px] text-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-black" />
            <span className="font-bold">نحوه صحیح علامت‌گذاری:</span>
            <span>دایره مورد نظر را با مداد سیاه نرم و پررنگ کاملاً پر کنید.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-3.5 h-3.5 rounded-full bg-black inline-block" />
              <span>صحیح</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-3.5 h-3.5 rounded-full border border-black inline-block text-center leading-none text-[8px]">
                ✕
              </span>
              <span>غلط</span>
            </span>
          </div>
        </div>

        {/* ۴. ماتریس حباب‌های تستی (ستون‌های ۳۰ تایی) */}
        <div
          className={`flex-1 px-4 py-2 grid gap-4 ${
            columnCount === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : columnCount === 2
              ? "grid-cols-2"
              : "grid-cols-4"
          }`}
        >
          {Array.from({ length: columnCount }).map((_, colIdx) => {
            const startNum = colIdx * questionsPerColumn + 1;
            const endNum = (colIdx + 1) * questionsPerColumn;

            return (
              <div
                key={colIdx}
                className="border-2 border-black rounded-xl p-2 bg-white flex flex-col justify-between"
              >
                {/* سرستون */}
                <div className="flex items-center justify-between pb-1 mb-1 border-b-2 border-black text-[10px] font-black text-center">
                  <span className="w-6">سوال</span>
                  <div className="flex-1 flex justify-around pr-2 text-center">
                    <span className="w-5">۱</span>
                    <span className="w-5">۲</span>
                    <span className="w-5">۳</span>
                    <span className="w-5">۴</span>
                  </div>
                </div>

                {/* ردیف‌های سوالات */}
                <div className="space-y-1">
                  {Array.from({ length: questionsPerColumn }).map((__, qOffset) => {
                    const qNum = startNum + qOffset;
                    const isGroupDivider = qNum % 5 === 0 && qNum !== endNum;

                    return (
                      <div
                        key={qNum}
                        className={`flex items-center justify-between text-xs py-0.5 ${
                          isGroupDivider ? "border-b border-dashed border-slate-400 pb-1 mb-1" : ""
                        }`}
                      >
                        <span className="w-6 font-mono font-black text-slate-900 text-left pl-1 text-[11px]">
                          {qNum}
                        </span>

                        <div className="flex-1 flex justify-around pr-2">
                          {[1, 2, 3, 4].map((optNum) => (
                            <div
                              key={optNum}
                              className="bubble w-4 h-4 rounded-full border-1.5 border-black flex items-center justify-center font-mono text-[9px] font-bold text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                              title={`سوال ${qNum} گزینه ${optNum}`}
                            >
                              {optNum}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ۵. پانویس پاسخ‌برگ و امضای داوطلب */}
        <div className="px-6 pt-3 pb-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
          <span>سامانه تصحیح خودکار OMR هوشمند مدرسه • الگوریتم سنجش و بینایی ماشین</span>
          <div className="flex items-center gap-6">
            <span>محل امضای مراقب: ....................</span>
            <span>محل امضای داوطلب: ....................</span>
          </div>
        </div>
      </div>
    </div>
  );
}
