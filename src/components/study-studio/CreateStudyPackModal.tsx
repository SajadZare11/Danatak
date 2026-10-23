"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Mic,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface CreateStudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId?: string;
  studentId?: string;
  onSuccess: (packId: string) => void;
}

export const CreateStudyPackModal: React.FC<CreateStudyPackModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  studentId,
  onSuccess,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<"TEXT" | "PDF" | "IMAGE" | "AUDIO">("TEXT");
  const [textContent, setTextContent] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetGrade, setTargetGrade] = useState<number>(12);
  const [preferredTopic, setPreferredTopic] = useState<string>("مشتق و کاربردها");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusStep, setStatusStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // نمونه متن آماده برای تست سریع
  const handleLoadSample = () => {
    setTextContent(`مشتق تابع در یک نقطه بیانگر شیب خط مماس بر نمودار در آن نقطه است.
نقطه بحرانی نقطه‌ای از درون دامنه تابع است که در آن مشتق اول برابر صفر باشد یا مشتق وجود نداشته باشد.
طبق قضیه فرما، اگر تابع در یک نقطه اکسترمم نسبی داشته باشد و در آن نقطه مشتق‌پذیر باشد، حتماً مشتق آن صفر است.
آزمون مشتق اول: اگر علامت مشتق از مثبت به منفی تغییر کند، تابع دارای ماکزیمم نسبی است و اگر از منفی به مثبت تغییر کند دارای مینیمم نسبی است.
مشتق دوم جهت تقعر را تعیین می‌کند: اگر مشتق دوم مثبت باشد تقعر رو به بالاست و اگر منفی باشد تقعر رو به پایین است.`);
    setPreferredTopic("مشتق و اکسترمم‌های تابع");
  };

  // بارگذاری فایل و تبدیل به Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // شروع فرآیند تولید هوشمند با هوش مصنوعی
  const handleGenerate = async () => {
    setErrorMessage(null);
    const rawPayload = activeSourceTab === "TEXT" ? textContent : fileDataUrl;

    if (!rawPayload || !rawPayload.trim()) {
      setErrorMessage("لطفاً متن، جزوه یا فایل ورودی را مشخص نمایید.");
      return;
    }

    setIsGenerating(true);
    setStatusStep("۱. در حال استخراج و تحلیل ساختار ورودی...");

    try {
      // مرحله ۱: تولید محتوا توسط سرویس هوش مصنوعی
      setStatusStep("۲. در حال پردازش با هوش مصنوعی و تولید فلش‌کارت‌ها...");
      const genRes = await fetch("/api/study-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: rawPayload,
          sourceType: activeSourceTab,
          fileName,
          targetGrade,
          preferredTopic,
        }),
      });

      const genData = await genRes.json();
      if (!genData.success || !genData.data) {
        throw new Error(genData.error || "خطا در تولید محتوای بسته");
      }

      // مرحله ۲: ذخیره دائم بسته در دیتابیس
      setStatusStep("۳. در حال ثبت بسته، فلش‌کارت‌ها و وضعیت اولیه SM-2 در پایگاه داده...");
      const saveRes = await fetch("/api/study-studio/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...genData.data,
          creatorId,
          studentId,
          sourceType: activeSourceTab,
          rawContent: activeSourceTab === "TEXT" ? textContent : `فایل پیوست: ${fileName}`,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveData.success || !saveData.packId) {
        throw new Error(saveData.error || "خطا در ذخیره‌سازی بسته");
      }

      // موفقیت و هدایت
      onSuccess(saveData.packId);
      onClose();
    } catch (err: any) {
      console.error("Study pack generation error:", err);
      setErrorMessage(err.message || "خطا در فرآیند تولید بسته مطالعه.");
    } finally {
      setIsGenerating(false);
      setStatusStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* هدر مدال */}
        <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black">ساخت بسته مطالعه هوشمند (Gizmo / StudyFetch Engine)</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                تولید خودکار فلش‌کارت‌های SM-2، کوییز تستی و نقشه ذهنی از روی متن یا جزوه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوای داخلی فرم */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* تب‌های انتخاب نوع ورودی چندرسانه‌ای */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">نوع ماده آموزشی ورودی:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSourceTab("TEXT");
                  setFileDataUrl(null);
                  setFileName(null);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                  activeSourceTab === "TEXT"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                متن یا یادداشت
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSourceTab("PDF");
                  setTextContent("");
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                  activeSourceTab === "PDF"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Upload className="w-4 h-4 text-rose-600" />
                جزوه و PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSourceTab("IMAGE");
                  setTextContent("");
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                  activeSourceTab === "IMAGE"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                عکس تخته / دست‌نویس
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSourceTab("AUDIO");
                  setTextContent("");
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                  activeSourceTab === "AUDIO"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Mic className="w-4 h-4 text-amber-600" />
                وویس / صوت تدریس
              </button>
            </div>
          </div>

          {/* بدنه ورودی متنی */}
          {activeSourceTab === "TEXT" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">متن درس، فرمول‌ها یا نکات کلیدی:</label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition"
                >
                  ⚡ درج نمونه سریع حسابان ۳ (تست دمو)
                </button>
              </div>

              <textarea
                rows={5}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="متن درس، جزوه تدریس، پاراگراف کتاب درسی یا فرمول‌های مورد نظر را اینجا تایپ یا الصاق نمایید..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 leading-relaxed transition"
                dir="auto"
              />
              <div className="text-[11px] text-slate-400 text-left">
                {textContent.length} کاراکتر
              </div>
            </div>
          )}

          {/* بدنه آپلود فایل چندرسانه‌ای */}
          {activeSourceTab !== "TEXT" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">
                انتخاب فایل {activeSourceTab === "PDF" ? "PDF" : activeSourceTab === "IMAGE" ? "تصویر" : "صوتی"}:
              </label>

              <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-6 text-center hover:bg-indigo-50/50 transition relative">
                <input
                  type="file"
                  accept={
                    activeSourceTab === "PDF"
                      ? ".pdf,application/pdf"
                      : activeSourceTab === "IMAGE"
                      ? "image/*"
                      : "audio/*"
                  }
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    {fileName ? fileName : "برای انتخاب یا کشیدن فایل کلیک کنید"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {activeSourceTab === "PDF" && "پشتیبانی از فرمت‌های PDF جزوات و آزمون‌ها"}
                    {activeSourceTab === "IMAGE" && "تصاویر JPG، PNG یا اسکن تخته کلاس درس"}
                    {activeSourceTab === "AUDIO" && "فایل‌های صوتی MP3، WAV یا وویس تدریس"}
                  </div>
                </div>
              </div>

              {fileDataUrl && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  فایل {fileName} با موفقیت بارگذاری گردید.
                </div>
              )}
            </div>
          )}

          {/* فیلدهای تکمیلی: پایه و نام مبحث */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">پایه تحصیلی هدف:</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value={10}>پایه دهم (دوره دوم متوسطه)</option>
                <option value={11}>پایه یازدهم (دوره دوم متوسطه)</option>
                <option value={12}>پایه دوازدهم (کنکور سراسری)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">برچسب سرفصل (Topic Tag):</label>
              <input
                type="text"
                value={preferredTopic}
                onChange={(e) => setPreferredTopic(e.target.value)}
                placeholder="مثلاً: مشتق و اکسترمم‌های تابع"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* پیام خطا در صورت وجود */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-bold animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* وضعیت مراحل تولید */}
          {isGenerating && statusStep && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                {statusStep}
              </div>
              <div className="w-full h-1.5 bg-indigo-200/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* فوتر مدال */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-40 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 transform active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال تولید هوشمند...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                تولید بسته کامل مطالعه با هوش مصنوعی
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
