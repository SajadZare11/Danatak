"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart2,
  X,
  Play,
  Award,
  AlertCircle,
  Lock,
} from "lucide-react";

interface LiveInClassQuizRunnerProps {
  sessionId: string;
  isTeacher: boolean;
  currentUserId: string;
}

const PRESET_QUIZZES = [
  {
    title: "مفهوم مشتق مراتب بالاتر",
    question: "اگر f(x) = x³ باشد، مقدار f''(2) کدام است؟",
    options: ["۶", "۱۲", "۲۴", "۳"],
    correctAnswer: "1", // گزینه ب = 12
  },
  {
    title: "تست سرعت و درک مطلب",
    question: "شیب خط مماس بر منحنی در نقطه عطف چه ویژگی دارد؟",
    options: [
      "همواره صفر است",
      "بیشترین یا کمترین مقدار محلی را دارد",
      "تعریف نشده است",
      "برابر با مقدار تابع است",
    ],
    correctAnswer: "1",
  },
  {
    title: "سنجش درک و آمادگی کلاس",
    question: "میزان فهم خود از فرمول تدریس‌شده در این اسلاید را مشخص کنید:",
    options: [
      "کاملاً تسلط پیدا کردم (عالی)",
      "نیاز به یک مثال دیگر دارم (خوب)",
      "کمی مبهم بود (متوسط)",
      "اصلاً متوجه نشدم (نیاز به بازتدریس)",
    ],
    correctAnswer: "0",
  },
];

export function LiveInClassQuizRunner({
  sessionId,
  isTeacher,
  currentUserId,
}: LiveInClassQuizRunnerProps) {
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // فرم طرح کوییز دبیر
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("0");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // پاسخ ارسالی دانش‌آموز
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // ۱. پولینگ دریافت کوییز فعال
  const fetchQuizzes = async () => {
    if (!sessionId) return;
    try {
      const studentParam = !isTeacher && currentUserId ? `?studentId=${currentUserId}` : "";
      const res = await fetch(`/api/live/sessions/${sessionId}/quizzes${studentParam}`);
      const data = await res.json();
      if (data.success) {
        if (data.activeQuiz) {
          setActiveQuiz(data.activeQuiz);
          if (data.activeQuiz.myResponse) {
            setSelectedOption(data.activeQuiz.myResponse.selectedOption);
            setHasSubmitted(true);
          }
        } else {
          setActiveQuiz(null);
          setHasSubmitted(false);
          setSelectedOption(null);
        }
      }
    } catch (err) {
      console.error("Error fetching live quizzes:", err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    const interval = setInterval(fetchQuizzes, 2500);
    return () => clearInterval(interval);
  }, [sessionId, isTeacher, currentUserId]);

  // ۲. مدیریت تایمر معکوس
  useEffect(() => {
    if (!activeQuiz || activeQuiz.status !== "ACTIVE") {
      setTimeLeft(0);
      return;
    }

    const createdTime = new Date(activeQuiz.createdAt).getTime();
    const expiryTime = createdTime + activeQuiz.timeLimitSeconds * 1000;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    setTimeLeft(remaining);

    const timer = setInterval(() => {
      const currentNow = Date.now();
      const diff = Math.max(0, Math.floor((expiryTime - currentNow) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz]);

  // پر کردن فرم از سوالات پیش‌فرض
  const handleSelectPreset = (preset: typeof PRESET_QUIZZES[0]) => {
    setQuestionText(preset.question);
    setOptions([...preset.options]);
    setCorrectAnswer(preset.correctAnswer);
  };

  // ارسال کوییز جدید توسط دبیر
  const handleLaunchQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || options.some((opt) => !opt.trim())) {
      alert("لطفاً متن سوال و هر ۴ گزینه را پر کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/live/sessions/${sessionId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_quiz",
          questionText,
          options,
          correctAnswer,
          timeLimitSeconds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setActiveQuiz(data.quiz);
        fetchQuizzes();
      } else {
        alert(data.error || "خطا در طرح کوییز");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ثبت پاسخ توسط دانش‌آموز
  const handleSubmitResponse = async (optIndex: number) => {
    if (hasSubmitted || submittingAnswer || !activeQuiz || activeQuiz.status !== "ACTIVE") return;

    setSubmittingAnswer(true);
    setSelectedOption(optIndex.toString());

    try {
      const res = await fetch(`/api/live/sessions/${sessionId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_response",
          quizId: activeQuiz.id,
          studentId: currentUserId,
          selectedOption: optIndex,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasSubmitted(true);
        fetchQuizzes();
      }
    } catch (err) {
      console.error("Failed to submit quiz answer:", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // بستن کوییز توسط دبیر
  const handleCloseQuiz = async () => {
    if (!activeQuiz) return;
    try {
      await fetch(`/api/live/sessions/${sessionId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close_quiz",
          quizId: activeQuiz.id,
        }),
      });
      fetchQuizzes();
    } catch (err) {
      console.error("Error closing quiz:", err);
    }
  };

  const optionLabels = ["الف", "ب", "ج", "د"];

  return (
    <>
      {/* دکمه اختصاصی دبیر برای طرح کوییز حین تدریس */}
      {isTeacher && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>طرح کوییز آنی کلاس ⚡</span>
        </button>
      )}

      {/* ۱. پنجره نمایش نتایج و مانیتورینگ برای دبیر حین اجرای کوییز */}
      {isTeacher && activeQuiz && (
        <div
          className="fixed bottom-20 left-4 z-40 w-96 bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-4 shadow-2xl backdrop-blur-md text-slate-100 flex flex-col space-y-3"
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-black text-xs text-amber-300">کوییز فعال کلاسی</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded-md text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft} ثانیه</span>
              </div>
              <button
                type="button"
                onClick={handleCloseQuiz}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition"
              >
                پایان کوییز
              </button>
            </div>
          </div>

          <p className="text-xs font-bold text-white leading-relaxed">{activeQuiz.questionText}</p>

          {/* آمار میله‌ای گزینه‌ها */}
          <div className="space-y-2 pt-1">
            {activeQuiz.options?.map((opt: string, idx: number) => {
              const count = activeQuiz.distribution?.[idx.toString()] || 0;
              const total = activeQuiz.totalResponses || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const isCorrect = activeQuiz.correctAnswer === idx.toString();

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">
                      گزینه {optionLabels[idx]}: {opt}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">
                      {count} نفر ({pct}٪) {isCorrect && "✅"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCorrect ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800">
            مجموع پاسخ‌های ثبت شده: <span className="font-bold text-white">{activeQuiz.totalResponses || 0}</span>
          </div>
        </div>
      )}

      {/* ۲. پاپ‌آپ تعاملی پاسخ‌دهی برای دانش‌آموز */}
      {!isTeacher && activeQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col space-y-4">
            {/* هدر مدال کوییز */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">کوییز سریع کلاسی دبیر</h3>
                  <p className="text-[10px] text-slate-400">به سوال زیر در مهلت مشخص‌شده پاسخ دهید</p>
                </div>
              </div>

              {/* تایمر معکوس با انیمیشن */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black border ${
                  timeLeft <= 10
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                    : "bg-amber-500/20 border-amber-500/50 text-amber-300"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{timeLeft} ثانیه</span>
              </div>
            </div>

            {/* متن سوال */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <p className="text-sm font-bold text-slate-100 leading-relaxed">
                {activeQuiz.questionText}
              </p>
            </div>

            {/* ۴ گزینه قابل کلیک */}
            <div className="grid grid-cols-1 gap-2.5">
              {activeQuiz.options?.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx.toString();
                const isCorrect = activeQuiz.correctAnswer === idx.toString();
                const isClosed = activeQuiz.status === "CLOSED";

                let btnStyle = "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200";
                if (isSelected) {
                  btnStyle = "bg-amber-500/20 border-amber-500 text-amber-200 font-black shadow-lg shadow-amber-500/10";
                }
                if (isClosed && isCorrect) {
                  btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-black";
                }
                if (isClosed && isSelected && !isCorrect) {
                  btnStyle = "bg-rose-600/30 border-rose-500 text-rose-200 font-bold";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={hasSubmitted || isClosed}
                    onClick={() => handleSubmitResponse(idx)}
                    className={`w-full p-3.5 rounded-2xl border transition text-xs flex items-center justify-between text-right ${btnStyle} ${
                      hasSubmitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                        {optionLabels[idx]}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isSelected && !isClosed && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md">
                        پاسخ شما
                      </span>
                    )}

                    {isClosed && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {isClosed && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* نوار وضعیت تایید ارسال */}
            {hasSubmitted && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>پاسخ شما با موفقیت ثبت شد! منتظر اعلام نتیجه پس از پایان تایمر بمانید.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ۳. مدال ایجاد کوییز جدید توسط دبیر */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">طرح کوییز آنی کلاسی</h3>
                  <p className="text-[10px] text-slate-400">سنجش آمادگی و درک مطلب دانش‌آموزان حین تدریس</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* قالب‌های سریع */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400">قالب‌های سوالات پرتکرار و سریع:</span>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_QUIZZES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[10px] font-bold transition border border-slate-700/60"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLaunchQuiz} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">متن سوال کوییز:</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="مثال: حاصل مشتق تابع در نقطه x=2 کدام است؟"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500 transition resize-none h-16"
                  required
                />
              </div>

              {/* ۴ گزینه */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  گزینه‌ها (گزینه صحیح را علامت بزنید):
                </label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctAnswer === idx.toString()}
                      onChange={() => setCorrectAnswer(idx.toString())}
                      className="text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      title="علامت زدن به عنوان گزینه صحیح"
                    />
                    <span className="text-xs font-bold text-amber-400 w-5">{optionLabels[idx]}:</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`گزینه ${optionLabels[idx]}`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-500 transition"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* مهلت پاسخ */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[11px] font-bold text-slate-300">مهلت پاسخ‌دهی:</label>
                <div className="flex gap-1.5">
                  {[30, 45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimeLimitSeconds(sec)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        timeLimitSeconds === sec
                          ? "bg-amber-600 text-white font-black"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {sec} ثانیه
                    </button>
                  ))}
                </div>
              </div>

              {/* دکمه‌های پایانی */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isSubmitting ? "در حال فعال‌سازی..." : "شروع کوییز در کلاس"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
