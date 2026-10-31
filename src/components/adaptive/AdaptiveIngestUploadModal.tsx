"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";

interface AdaptiveIngestUploadModalProps {
  isOpen: boolean;
  creatorId?: string;
  studentId?: string;
  onClose: () => void;
  onSuccess: (packId: string, courseStructure: any) => void;
}

export const AdaptiveIngestUploadModal: React.FC<AdaptiveIngestUploadModalProps> = ({
  isOpen,
  creatorId,
  studentId,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "pdf" | "image">("text");
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [targetGrade, setTargetGrade] = useState("12");
  const [topicTag, setTopicTag] = useState("حسابان و دیفرانسیل");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatusMessage("در حال محاسبه کد هش SHA-256 و بررسی سلامت فونت‌های جزوه...");

    try {
      const content = activeTab === "text" ? textContent : fileBase64;
      if (!content || !content.trim()) {
        alert("لطفاً متن جزوه یا فایل مربوطه را وارد کنید.");
        setIsProcessing(false);
        return;
      }

      setStatusMessage("در حال تحلیل ساختاری با هوش مصنوعی و تولید ۶ فرمت تعاملی بلوم...");

      const res = await fetch("/api/adaptive/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sourceType: activeTab === "text" ? "TEXT" : activeTab === "pdf" ? "PDF" : "IMAGE",
          fileName,
          targetGrade: Number(targetGrade),
          preferredTopic: topicTag,
          creatorId,
          studentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.packId, data.courseStructure);
        onClose();
      } else {
        alert(data.error || "خطا در پردازش جزوه");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* هدر */}
        <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-xs text-indigo-300 font-bold">
                خط لوله دریافت چندوجهی اسناد و کشینگ هش
              </div>
              <h3 className="text-base font-black">
                تبدیل هوشمند جزوه به نقشه مراحل میکرولرنینگ
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* تب‌های نوع ورودی */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "text"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>متن یا یادداشت</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "pdf"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>فایل PDF درسی</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "image"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>عکس جزوه دست‌نویس</span>
            </button>
          </div>

          {/* محتوای تب انتخاب شده */}
          {activeTab === "text" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">متن جزوه، مقاله یا نکات درس:</label>
              <textarea
                rows={5}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="متن فصل مورد نظر، قضیه‌ها و فرمول‌ها را اینجا قرار دهید..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-indigo-500 shadow-2xs transition resize-none leading-relaxed"
              />
            </div>
          )}

          {(activeTab === "pdf" || activeTab === "image") && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {activeTab === "pdf" ? "فایل PDF جزوه:" : "تصویر تخته یا یادداشت دست‌نویس:"}
              </label>
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-6 text-center space-y-2 bg-indigo-50/30 transition cursor-pointer relative">
                <input
                  type="file"
                  accept={activeTab === "pdf" ? ".pdf" : "image/*"}
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                  {activeTab === "pdf" ? <Upload className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {fileName ? fileName : "برای انتخاب فایل کلیک کنید یا آن را به اینجا بکشید"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeTab === "pdf"
                    ? "سیستم به صورت خودکار فونت‌های خراب را با Vision LLM ترمیم می‌کند."
                    : "مدل بینایی فرمول‌ها و نمودارها را با حداکثر دقت بازخوانی می‌کند."}
                </div>
              </div>
            </div>
          )}

          {/* فیلدهای پایه و سرفصل */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">سرفصل یا موضوع:</label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="مثلاً مشتق و اکسترمم"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">پایه تحصیلی:</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="10">پایه دهم</option>
                <option value="11">پایه یازدهم</option>
                <option value="12">پایه دوازدهم (کنکور سراسری)</option>
              </select>
            </div>
          </div>

          {/* بنر توضیح ویژگی SHA-256 و Vision OCR */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">برگ برنده مالی SHA-256: </span>
              اگر این فصل قبلاً توسط دانشجوی دیگری آپلود شده باشد، بدون نیاز به فراخوانی مجدد هوش مصنوعی، در کمتر از ۱ ثانیه و با هزینه ۰$ بارگذاری می‌شود.
            </div>
          </div>

          {/* دکمه ارسال */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{statusMessage || "در حال ساخت دوره میکرولرنینگ..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>تولید نقشه نودهای یادگیری و نبرد Boss Fight ⚡</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
