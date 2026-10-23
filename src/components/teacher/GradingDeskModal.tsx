"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
  Save,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Check,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface SubmissionDetail {
  id: string;
  assignmentId: string;
  assignment: {
    title: string;
    maxScore: number;
    questionsJson: string;
    topic?: {
      title: string;
    };
  };
  student: {
    id: string;
    fullName: string;
    nationalId: string;
  };
  status: string;
  score: number | null;
  submittedAt: string | Date;
  answersJson?: string | null;
  teacherFeedback?: string | null;
  annotatedImageUrl?: string | null;
}

interface QuestionItem {
  id: string;
  content?: string;
  questionText?: string;
  type: string;
  difficulty: string;
  explanation?: string | null;
  options: Array<{
    id: string;
    orderIndex: number;
    text?: string;
    optionText?: string;
    isCorrect: boolean;
  }>;
}

interface GradingDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onGradedSuccess?: () => void;
}

export const GradingDeskModal: React.FC<GradingDeskModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  onGradedSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});

  // نمرات اختصاص‌یافته به هر سوال { qId: number }
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تنظیمات ابزار قلم کانواس (Canvas Pen Tool)
  const [penColor, setPenColor] = useState<string>("#ef4444"); // قرمز پیش‌فرض
  const [penSize, setPenSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  // بارگذاری داده‌های برگه از API
  const fetchSubmission = async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      // دریافت برگه و تکالیف
      const res = await fetch(`/api/assignments/submit`); // یا واکشی جزئیات
      // از API واکشی تکلیف مربوطه استفاده می‌کنیم
      const dashRes = await fetch("/api/teacher/dashboard");
      const dashData = await dashRes.json();
      const currentSub = dashData.pendingSubmissions.find((s: any) => s.id === submissionId);

      if (currentSub) {
        setSubmission(currentSub);
        // واکشی سوالات برگه از API تکلیف
        const assignRes = await fetch(`/api/assignments/${currentSub.assignmentId}`);
        const assignData = await assignRes.json();
        setQuestions(assignData.questions || []);

        let parsedAnswers: Record<string, any> = {};
        if (currentSub.answersJson) {
          try {
            parsedAnswers = JSON.parse(currentSub.answersJson);
          } catch {
            parsedAnswers = {};
          }
        }
        setStudentAnswers(parsedAnswers);

        // محاسبه اولیه نمرات تستی
        const initialScores: Record<string, number> = {};
        const scorePerQ =
          assignData.questions && assignData.questions.length > 0
            ? Number((currentSub.assignment.maxScore / assignData.questions.length).toFixed(1))
            : 2;

        (assignData.questions || []).forEach((q: any) => {
          if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
            const chosen = parsedAnswers[q.id];
            const correctOpt = q.options.find((o: any) => o.isCorrect);
            if (
              chosen &&
              correctOpt &&
              (chosen === correctOpt.id || chosen === String(correctOpt.orderIndex))
            ) {
              initialScores[q.id] = scorePerQ;
            } else {
              initialScores[q.id] = 0;
            }
          } else {
            // تشریحی: پیش‌فرض نیمی از نمره
            initialScores[q.id] = Number((scorePerQ * 0.8).toFixed(1));
          }
        });
        setScores(initialScores);
        setOverallFeedback(currentSub.teacherFeedback || "پاسخ‌ها بررسی شد؛ راه‌حل‌ها رضایت‌بخش بودند.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchSubmission();
    }
  }, [isOpen, submissionId]);

  // راه‌اندازی کانواس قلم‌گذاری
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // اندازه کانواس
    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = 800;

    // رسم بک‌گراند کاغذ امتحانی شطرنجی کم‌رنگ
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // شبیه‌سازی دست‌خط دانش‌آموز روی برگه
    ctx.font = "14px Vazirmatn, Tahoma";
    ctx.fillStyle = "#1e293b";
    ctx.fillText("پاسخ تشریحی سوال ۲: برای محاسبه مشتق کسری، ابتدا مشتق صورت را در مخرج ضرب می‌کنیم:", 40, 60);
    ctx.font = "13px serif";
    ctx.fillText("f'(x) = [ (2x - 3)(x^2 + 1) - (x^2 - 3x + 2)(2x) ] / (x^2 + 1)^2", 60, 100);
    ctx.font = "14px Vazirmatn, Tahoma";
    ctx.fillText("سپس در نقطه x = 1 مقدارگذاری انجام می‌دهیم:", 40, 140);
    ctx.font = "13px serif";
    ctx.fillText("f'(1) = [ (-1)(2) - (0)(2) ] / (4) = -2 / 4 = -0.5", 60, 180);

    // ذخیره وضعیت اولیه
    const initialImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialImg]);
  }, [loading, isOpen]);

  // ترسیم با قلم
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ذخیره وضعیت در تاریخچه برای Undo
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), currentImg]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // حذف وضعیت فعلی
    const prevImg = newHistory[newHistory.length - 1];
    ctx.putImageData(prevImg, 0, 0);
    setHistory(newHistory);
  };

  // افزودن استامپ / مهر نمره‌گذاری
  const addStamp = (type: "correct" | "wrong" | "calc_error") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "bold 16px Vazirmatn, Tahoma";
    if (type === "correct") {
      ctx.fillStyle = "#059669";
      ctx.fillText("✓ آفرین، راه‌حل کاملاً صحیح است", 100, 240);
    } else if (type === "wrong") {
      ctx.fillStyle = "#dc2626";
      ctx.fillText("✗ خطای مفهومی در مخرج مشترک", 100, 240);
    } else {
      ctx.fillStyle = "#d97706";
      ctx.fillText("⚠ بی‌دقتی در علامت جبری", 100, 240);
    }

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, currentImg]);
  };

  // محاسبه مجموع کل نمرات داده‌شده
  const calculatedTotalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = submission?.assignment.maxScore || 20;
  const finalScoreCapped = Math.min(maxScore, Number(calculatedTotalScore.toFixed(2)));

  // ثبت نهایی برگه در دیتابیس
  const handleSubmitGrading = async () => {
    if (!submission) return;
    setIsSubmitting(true);

    try {
      // خروجی عکس خط‌کشی‌شده از کانواس
      let annotatedImgUrl = null;
      if (canvasRef.current) {
        annotatedImgUrl = canvasRef.current.toDataURL("image/png");
      }

      // آماده‌سازی اطلاعات سوالات غلط برای ورود خودکار به دفترچه اشتباهات
      const scorePerQ = questions.length > 0 ? maxScore / questions.length : 1;
      const questionGrades: Record<string, any> = {};

      questions.forEach((q) => {
        const qScore = scores[q.id] || 0;
        const isCorrect = qScore >= scorePerQ * 0.9;
        questionGrades[q.id] = {
          score: qScore,
          maxScore: scorePerQ,
          isCorrect,
          feedback: feedbacks[q.id] || null,
        };
      });

      const res = await fetch("/api/teacher/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          finalScore: finalScoreCapped,
          teacherFeedback: overallFeedback,
          annotatedImageUrl: annotatedImgUrl,
          questionGrades,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "برگه با موفقیت تصحیح و ثبت شد!");
        if (onGradedSuccess) onGradedSuccess();
        onClose();
      } else {
        alert(data.error || "خطا در ثبت نمره");
      }
    } catch (err) {
      console.error(err);
      alert("خطای غیرمنتظره در ثبت نمرات");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        {/* هدر بالای میز تصحیح */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">
                  میز تصحیح و قلم‌گذاری برگه: {submission?.student.fullName}
                </h2>
                <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  کدملی: {submission?.student.nationalId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تکلیف: {submission?.assignment.title} • بارم کل: {maxScore} نمره
              </p>
            </div>
          </div>

          {/* نشانگر زنده نمره کل محاسبه‌شده */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-medium">نمره کل محاسبه‌شده</span>
              <span className="text-lg font-black text-amber-400">
                {finalScoreCapped} <span className="text-xs text-slate-400 font-normal">از {maxScore}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* بدنه دو ستونه میز تصحیح */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200">
          {/* ستون راست: سوالات، گزینه‌ها و ثبت تفکیکی نمرات (۵ ستون) */}
          <div className="lg:col-span-5 p-6 overflow-y-auto max-h-[75vh] space-y-5 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                پاسخ‌های ثبت‌شده دانش‌آموز ({questions.length} سوال)
              </h3>
              <span className="text-xs text-slate-500 font-bold">بارم سوالات</span>
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-bold">در حال بارگذاری برگه دانش‌آموز...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentAnswer = studentAnswers[q.id];
                  const qScore = scores[q.id] || 0;
                  const scorePerQ = Number((maxScore / questions.length).toFixed(1));

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3"
                    >
                      {/* شماره سوال و نمره */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {q.type === "MULTIPLE_CHOICE"
                              ? "چهارگزینه‌ای"
                              : q.type === "TRUE_FALSE"
                              ? "صحیح / غلط"
                              : "تشریحی"}
                          </span>
                        </div>

                        {/* فیلد نمره‌دهی معلم */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">نمره:</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={scorePerQ}
                            value={qScore}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setScores((prev) => ({
                                ...prev,
                                [q.id]: Math.min(scorePerQ, Math.max(0, val)),
                              }));
                            }}
                            className="w-16 p-1.5 rounded-lg border border-slate-300 text-center text-xs font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                          />
                          <span className="text-xs text-slate-400">از {scorePerQ}</span>
                        </div>
                      </div>

                      {/* صورت سوال KaTeX */}
                      <div className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                        <KaTeXRenderer content={q.content || q.questionText || ""} />
                      </div>

                      {/* نمایش پاسخ ارسال‌شده */}
                      {q.type === "MULTIPLE_CHOICE" ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] text-slate-500 font-medium">گزینه‌ها:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt) => {
                              const isStudentPick =
                                studentAnswer === opt.id || studentAnswer === String(opt.orderIndex);
                              const isCorrectOpt = opt.isCorrect;

                              let optBg = "bg-slate-50 border-slate-200 text-slate-700";
                              if (isCorrectOpt)
                                optBg = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                              if (isStudentPick && !isCorrectOpt)
                                optBg = "bg-rose-50 border-rose-400 text-rose-950 font-bold line-through";

                              return (
                                <div
                                  key={opt.id}
                                  className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${optBg}`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-bold">{opt.orderIndex}.</span>
                                    <span className="truncate">{opt.optionText || opt.text}</span>
                                  </div>
                                  {isStudentPick && (
                                    <span className="text-[10px] font-black text-indigo-700 bg-white/80 px-1 rounded">
                                      انتخاب دانش‌آموز
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-xs">
                          <span className="font-bold text-amber-900 block mb-1">
                            پاسخ تشریحی ارسالی دانش‌آموز:
                          </span>
                          <p className="text-amber-950">
                            {studentAnswer || "حل تشریحی در برگه دست‌نویس سمت چپ بارگذاری شده است."}
                          </p>
                        </div>
                      )}

                      {/* یادداشت معلم برای این سوال */}
                      <div>
                        <input
                          type="text"
                          placeholder="یادداشت تصحیح برای این سوال (اختیاری)..."
                          value={feedbacks[q.id] || ""}
                          onChange={(e) =>
                            setFeedbacks((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full text-[11px] p-2 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* بازخورد عمومی معلم */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    بازخورد و توصیه نهایی معلم برای دانش‌آموز:
                  </label>
                  <textarea
                    rows={3}
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    placeholder="توصیه‌های انگیزشی و نقاط نیازمند تمرین بیشتر..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ستون چپ: ابزار کانواس قلم‌گذاری برگه تشریحی (۷ ستون) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-100/60 overflow-hidden">
            <div className="space-y-3">
              {/* جعبه ابزار قلم دبیر (Canvas Toolbar) */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 ml-1">قلم تصحیح:</span>

                  {/* انتخاب رنگ قلم */}
                  <button
                    type="button"
                    onClick={() => setPenColor("#ef4444")}
                    className={`w-7 h-7 rounded-full bg-rose-500 transition-all ${
                      penColor === "#ef4444" ? "ring-3 ring-rose-400 scale-110 shadow-xs" : ""
                    }`}
                    title="قلم قرمز (اشکال و تصحیح)"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor("#10b981")}
                    className={`w-7 h-7 rounded-full bg-emerald-500 transition-all ${
                      penColor === "#10b981" ? "ring-3 ring-emerald-400 scale-110 shadow-xs" : ""
                    }`}
                    title="قلم سبز (تایید و تشویق)"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor("#3b82f6")}
                    className={`w-7 h-7 rounded-full bg-blue-500 transition-all ${
                      penColor === "#3b82f6" ? "ring-3 ring-blue-400 scale-110 shadow-xs" : ""
                    }`}
                    title="قلم آبی"
                  />

                  {/* ضخامت قلم */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-2">
                    {[2, 4, 6].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPenSize(size)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                          penSize === size ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* مهرهای آماده */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addStamp("correct")}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition"
                  >
                    ✓ صحیح
                  </button>
                  <button
                    type="button"
                    onClick={() => addStamp("wrong")}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
                  >
                    ✗ غلط
                  </button>
                  <button
                    type="button"
                    onClick={() => addStamp("calc_error")}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition"
                  >
                    ⚠ بی‌دقتی
                  </button>

                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition ml-2"
                    title="بازگشت (Undo)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* برگه کانواس شبیه‌سازی دست‌خط و قلم‌گذاری */}
              <div className="relative border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-white max-h-[58vh] overflow-y-auto cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full block"
                />
              </div>
            </div>

            {/* نوار پایانی ثبت و تایید نمرات */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">
                  غلط‌های برگه خودکار به دفترچه اشتباهات دانش‌آموز ارسال خواهند شد.
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitGrading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "در حال ثبت..." : "تایید نهایی و ارسال کارنامه 🚀"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
