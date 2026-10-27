"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  ShieldAlert,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Maximize2,
  Copy,
  Shuffle,
  Sliders,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  CheckSquare,
  PenTool,
  Check,
  Eye,
  FileCode,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";
import { RoleSwitcherBar } from "@/components/common/RoleSwitcherBar";

interface QuestionDraft {
  id: string;
  content: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "DESCRIPTIVE" | "FILL_BLANK";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: Array<{
    id?: string;
    orderIndex: number;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  isNew?: boolean;
}

export default function DedicatedExamBuilderPage() {
  const router = useRouter();

  // گام ویزارد (۱: تنظیمات، ۲: تدوین سوالات، ۳: پیش‌نمایش و انتشار)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // داده‌های پایه از سرور
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState("");

  // فیلدهای گام ۱: مشخصات و تنظیمات آزمون
  const [title, setTitle] = useState("آزمون آنلاین جامع ریاضی و حسابان");
  const [description, setDescription] = useState(
    "آزمون رسمی آنلاین با فعال بودن سیستم ضدتقلب و ثبت در کارنامه رسمی"
  );
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);

  // تنظیمات تفکیکی و دقیق ضدتقلب (Teacher-selectable Granular Anti-Cheat)
  const [enableFullscreen, setEnableFullscreen] = useState(true);
  const [detectTabSwitch, setDetectTabSwitch] = useState(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isSequential, setIsSequential] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(true);

  // گام ۲: سوالات تدوین‌شده برای این آزمون
  const [examQuestions, setExamQuestions] = useState<QuestionDraft[]>([]);
  const [activeAuthorTab, setActiveAuthorTab] = useState<"MANUAL" | "UPLOAD" | "BANK">("MANUAL");

  // فرم زبانه ۱: نوشتن دستی سوال جدید
  const [manualType, setManualType] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE" | "DESCRIPTIVE" | "FILL_BLANK">(
    "MULTIPLE_CHOICE"
  );
  const [manualContent, setManualContent] = useState("");
  const [manualDifficulty, setManualDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [manualExplanation, setManualExplanation] = useState("");
  // گزینه‌های دستی برای تستی
  const [manualOptions, setManualOptions] = useState([
    { orderIndex: 1, text: "", isCorrect: true },
    { orderIndex: 2, text: "", isCorrect: false },
    { orderIndex: 3, text: "", isCorrect: false },
    { orderIndex: 4, text: "", isCorrect: false },
  ]);
  // گزینه دستی برای صحیح/غلط
  const [manualTFCorrect, setManualTFCorrect] = useState<"true" | "false">("true");
  // کلید دستی برای جای‌خالی
  const [manualBlankAnswer, setManualBlankAnswer] = useState("");

  // فرم زبانه ۲: آپلود و استخراج هوشمند
  const [pasteRawText, setPasteRawText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedStaging, setExtractedStaging] = useState<QuestionDraft[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);

  // فرم زبانه ۳: بانک سوالات موجود
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankTypeFilter, setBankTypeFilter] = useState("ALL");
  const [bankSearch, setBankSearch] = useState("");

  // ارسال نهایی آزمون
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  // بارگذاری داده‌های اولیه معلم، کلاس‌ها و بانک سوالات
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const teacherRes = await fetch("/api/teacher/dashboard");
        if (teacherRes.ok) {
          const tData = await teacherRes.json();
          setTeacherId(tData.teacher?.id || "");
          const classes = tData.classrooms || (tData.classroom ? [tData.classroom] : []);
          setClassrooms(classes);
          if (classes.length > 0) {
            setSelectedClassroomId(classes[0].id);
          }
          if (tData.allTextbooks) {
            setTextbooks(tData.allTextbooks);
          }
        }

        // واکشی بانک سوالات
        setLoadingBank(true);
        const qRes = await fetch("/api/questions");
        if (qRes.ok) {
          const qData = await qRes.json();
          setBankQuestions(qData.questions || []);
          if (!textbooks.length && qData.textbooks) {
            setTextbooks(qData.textbooks);
          }
        }
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoadingInitial(false);
        setLoadingBank(false);
      }
    };

    fetchInitial();
  }, []);

  // اعمال الگوهای امنیتی سریع
  const applyPreset = (preset: "strict" | "standard" | "practice") => {
    if (preset === "strict") {
      setEnableFullscreen(true);
      setDetectTabSwitch(true);
      setMaxTabSwitches(2);
      setDisableCopyPaste(true);
      setEnableWatermark(true);
      setShuffleQuestions(true);
      setShuffleOptions(true);
      setIsSequential(true);
      setNegativeMarking(true);
    } else if (preset === "standard") {
      setEnableFullscreen(true);
      setDetectTabSwitch(true);
      setMaxTabSwitches(3);
      setDisableCopyPaste(true);
      setEnableWatermark(true);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setIsSequential(false);
      setNegativeMarking(true);
    } else {
      setEnableFullscreen(false);
      setDetectTabSwitch(false);
      setMaxTabSwitches(5);
      setDisableCopyPaste(false);
      setEnableWatermark(false);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setIsSequential(false);
      setNegativeMarking(false);
    }
  };

  // استخراج تمام زیرمباحث برای انتخاب مبحث
  const flatTopics: Array<{ id: string; title: string; book: string }> = [];
  textbooks.forEach((book) => {
    (book.topics || []).forEach((t: any) => {
      if (t.subTopics && t.subTopics.length > 0) {
        t.subTopics.forEach((st: any) => {
          flatTopics.push({
            id: st.id,
            title: `${t.title} ⬅ ${st.title}`,
            book: book.title,
          });
        });
      } else {
        flatTopics.push({
          id: t.id,
          title: t.title,
          book: book.title,
        });
      }
    });
  });

  // افزودن سوال نوشته‌شده دستی به لیست آزمون
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) {
      alert("صورت سوال الزامی است.");
      return;
    }

    let finalOptions: any[] = [];
    if (manualType === "MULTIPLE_CHOICE") {
      const hasEmpty = manualOptions.some((o) => !o.text.trim());
      if (hasEmpty) {
        alert("لطفاً متن هر ۴ گزینه تستی را وارد کنید.");
        return;
      }
      finalOptions = manualOptions;
    } else if (manualType === "TRUE_FALSE") {
      finalOptions = [
        { orderIndex: 1, text: "صحیح", isCorrect: manualTFCorrect === "true" },
        { orderIndex: 2, text: "غلط", isCorrect: manualTFCorrect === "false" },
      ];
    } else if (manualType === "FILL_BLANK") {
      if (!manualBlankAnswer.trim()) {
        alert("لطفاً پاسخ صحیح (کلید) جای‌خالی را وارد کنید.");
        return;
      }
      finalOptions = [{ orderIndex: 1, text: manualBlankAnswer.trim(), isCorrect: true }];
    }

    const newQ: QuestionDraft = {
      id: `manual-${Date.now()}`,
      content: manualContent.trim(),
      type: manualType,
      difficulty: manualDifficulty,
      options: finalOptions,
      explanation: manualExplanation.trim(),
      isNew: true,
    };

    setExamQuestions((prev) => [...prev, newQ]);

    // بازنشانی فرم
    setManualContent("");
    setManualExplanation("");
    setManualBlankAnswer("");
    setManualOptions([
      { orderIndex: 1, text: "", isCorrect: true },
      { orderIndex: 2, text: "", isCorrect: false },
      { orderIndex: 3, text: "", isCorrect: false },
      { orderIndex: 4, text: "", isCorrect: false },
    ]);
  };

  // پردازش و استخراج هوشمند فایل Word/PDF یا متن کپی‌شده
  const handleExtractQuestions = async () => {
    if (!pasteRawText.trim() && !uploadFile) {
      alert("لطفاً یک فایل (Word / PDF) انتخاب کنید یا متن سوالات را پیست نمایید.");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      let res: Response;
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        if (pasteRawText.trim()) {
          formData.append("rawText", pasteRawText.trim());
        }
        res = await fetch("/api/exams/extract-questions", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/exams/extract-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: pasteRawText.trim() }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success && data.questions && data.questions.length > 0) {
        setExtractedStaging(
          data.questions.map((q: any) => ({
            ...q,
            isNew: true,
          }))
        );
      } else {
        setExtractError(data.error || "سوالی در متن یا فایل شناسایی نشد.");
      }
    } catch (err: any) {
      console.error(err);
      setExtractError("خطای غیرمنتظره در ارتباط با سرور یا هوش مصنوعی");
    } finally {
      setIsExtracting(false);
    }
  };

  // افزودن تمام سوالات استخراج‌شده به آزمون
  const handleAddAllExtractedToExam = () => {
    if (extractedStaging.length === 0) return;
    setExamQuestions((prev) => [...prev, ...extractedStaging]);
    setExtractedStaging([]);
    setPasteRawText("");
    setUploadFile(null);
  };

  // افزودن سوال از بانک سوالات
  const handleToggleBankQuestion = (q: any) => {
    const isAlready = examQuestions.some((eq) => eq.id === q.id);
    if (isAlready) {
      setExamQuestions((prev) => prev.filter((eq) => eq.id !== q.id));
    } else {
      setExamQuestions((prev) => [
        ...prev,
        {
          id: q.id,
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            orderIndex: o.orderIndex,
            text: o.optionText || o.text,
            isCorrect: Boolean(o.isCorrect),
          })),
          explanation: q.explanation || "",
          isNew: false,
        },
      ]);
    }
  };

  // حذف سوال از آزمون
  const handleRemoveQuestionFromExam = (index: number) => {
    setExamQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ثبت و انتشار نهایی آزمون
  const handlePublishExam = async () => {
    if (examQuestions.length === 0) {
      alert("آزمون باید حداقل شامل ۱ سوال باشد.");
      return;
    }
    if (!selectedClassroomId) {
      alert("لطفاً کلاس هدف را مشخص کنید.");
      return;
    }

    setIsSubmittingExam(true);
    try {
      const antiCheatSettings = {
        enableFullscreen,
        detectTabSwitch,
        maxTabSwitches,
        disableCopyPaste,
        enableWatermark,
        shuffleQuestions,
        shuffleOptions,
        isSequential,
        negativeMarking,
      };

      // تفکیک سوالات موجود در بانک از سوالات جدید نوشته‌شده
      const existingIds = examQuestions.filter((q) => !q.isNew).map((q) => q.id);
      const newQuestionsPayload = examQuestions
        .filter((q) => q.isNew)
        .map((q) => ({
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          topicId: selectedTopicId || null,
          options: q.options,
          explanation: q.explanation,
        }));

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          classroomId: selectedClassroomId,
          teacherId,
          topicId: selectedTopicId || null,
          durationMinutes,
          isSequential,
          enableAntiCheat: detectTabSwitch || enableFullscreen,
          maxTabSwitches,
          questionIds: existingIds,
          newQuestions: newQuestionsPayload,
          antiCheatSettings,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedExamId(data.exam?.id || "exam-ready");
      } else {
        alert(data.error || "خطا در ثبت آزمون");
      }
    } catch (err) {
      console.error(err);
      alert("خطای غیرمنتظره در ایجاد آزمون");
    } finally {
      setIsSubmittingExamExam: false;
      setIsSubmittingExam(false);
    }
  };

  const countMCQ = examQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const countTF = examQuestions.filter((q) => q.type === "TRUE_FALSE").length;
  const countBlank = examQuestions.filter((q) => q.type === "FILL_BLANK").length;
  const countDesc = examQuestions.filter((q) => q.type === "DESCRIPTIVE").length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return {
          label: "تستی چهارگزینه‌ای",
          icon: <CheckSquare className="w-3.5 h-3.5" />,
          style: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "TRUE_FALSE":
        return {
          label: "صحیح / غلط",
          icon: <HelpCircle className="w-3.5 h-3.5" />,
          style: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "DESCRIPTIVE":
        return {
          label: "تشریحی (بازپاسخ)",
          icon: <FileText className="w-3.5 h-3.5" />,
          style: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "FILL_BLANK":
        return {
          label: "جای‌خالی (کوتاه‌پاسخ)",
          icon: <PenTool className="w-3.5 h-3.5" />,
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          label: "تستی",
          icon: <CheckSquare className="w-3.5 h-3.5" />,
          style: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">در حال بارگذاری استودیوی طراحی آزمون...</p>
        </div>
      </div>
    );
  }

  // مودال موفقیت انتشار آزمون
  if (createdExamId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">آزمون آنلاین با موفقیت منتشر شد! 🚀</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              اتاق آزمون امن با تمام تدابیر ضدتقلب فعال شد و دانش‌آموزان کلاس هم‌اکنون به این آزمون دسترسی دارند.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 text-right font-medium">
            <div>• عنوان آزمون: <span className="font-bold text-slate-900">{title}</span></div>
            <div>• تعداد کل سوالات: <span className="font-bold text-indigo-700">{examQuestions.length} سوال</span></div>
            <div>• مدت زمان: <span className="font-bold text-rose-700">{durationMinutes} دقیقه</span></div>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/student/exams/${createdExamId}`}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              ورود به اتاق آزمون (پیش‌نمایش زنده دانش‌آموز)
            </Link>
            <Link
              href="/teacher"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت به پنل دبیر
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      {/* نوار جابجایی نقش */}
      <RoleSwitcherBar />

      {/* سربرگ اختصاصی استودیو */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/teacher"
                  className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1 font-bold"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت به داشبورد دبیر
                </Link>
              </div>
              <h1 className="text-base md:text-lg font-black mt-0.5">
                استودیوی اختصاصی طراحی آزمون آنلاین ضدتقلب (Zero-Cheat Exam Studio)
              </h1>
            </div>
          </div>

          {/* نشانگر گام‌های ویزارد */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 self-stretch md:self-auto justify-around">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentStep === 1
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center">
                ۱
              </span>
              <span>تنظیمات و ضدتقلب</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentStep === 2
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center">
                ۲
              </span>
              <span>تدوین و گردآوری سوالات ({examQuestions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentStep === 3
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 text-[10px] flex items-center justify-center">
                ۳
              </span>
              <span>پیش‌نمایش و انتشار</span>
            </button>
          </div>
        </div>
      </header>

      {/* بدنه اصلی ۳ مرحله‌ای */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ========================================================================= */}
        {/* گام ۱: مشخصات کلی آزمون و تدابیر ضدتقلب */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            {/* کارت مشخصات آزمون */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                مشخصات پایه و کلاس هدف آزمون
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">عنوان رسمی آزمون:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">کلاس هدف آزمون:</label>
                  <select
                    value={selectedClassroomId}
                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 font-bold"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeLevel ? `پایه ${c.gradeLevel}` : "دبیرستان"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">مبحث کتاب درسی:</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
                  >
                    <option value="">تمام سرفصل‌ها و مباحث</option>
                    {flatTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.book}: {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    مدت زمان آزمون (دقیقه):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-center font-black text-indigo-700 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">توضیحات و پیام به دانش‌آموز:</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* کارت جعبه‌ابزار تدابیر ضدتقلب */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm md:text-base">
                      تنظیمات اختصاصی ضدتقلب و امنیت آزمون (Anti-Cheat Suite)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      معلم گرامی، هر یک از سازوکارهای امنیتی زیر را می‌توانید به دلخواه برای این آزمون فعال یا غیرفعال کنید.
                    </p>
                  </div>
                </div>

                {/* پیش‌تنظیم‌های سریع */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold px-2">الگوهای آماده:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("strict")}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                  >
                    کنکوری سخت‌گیرانه
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("standard")}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    استاندارد کلاسی
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("practice")}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  >
                    آزمونک سبک
                  </button>
                </div>
              </div>

              {/* شبکه چک‌باکس‌های تفکیکی ۸ تایی */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* ۱. قفل تمام‌صفحه */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    enableFullscreen
                      ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enableFullscreen}
                    onChange={(e) => setEnableFullscreen(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-rose-600" />
                      قفل تمام‌صفحه اجباری
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      اجبار دانش‌آموز به ماندن در حالت Fullscreen و ثبت تخلف در صورت خروج
                    </span>
                  </div>
                </label>

                {/* ۲. رصد خروج از تب */}
                <div
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    detectTabSwitch
                      ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <label className="cursor-pointer flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={detectTabSwitch}
                      onChange={(e) => setDetectTabSwitch(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        شمارش خروج از تب
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                        ثبت زمان و اخطار تخلف هنگام ترک صفحه آزمون
                      </span>
                    </div>
                  </label>

                  {detectTabSwitch && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">سقف اخطار:</span>
                      <select
                        value={maxTabSwitches}
                        onChange={(e) => setMaxTabSwitches(Number(e.target.value))}
                        className="p-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-rose-700"
                      >
                        <option value={1}>۱ بار (قطع فوری)</option>
                        <option value={2}>۲ بار</option>
                        <option value={3}>۳ بار اخطار</option>
                        <option value={5}>۵ بار</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* ۳. مسدودسازی کپی و پیست */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    disableCopyPaste
                      ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={disableCopyPaste}
                    onChange={(e) => setDisableCopyPaste(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5 text-rose-600" />
                      مسدودسازی کپی/پیست
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      قفل کلیدهای ترکیبی، راست‌کلیک و کلید F12
                    </span>
                  </div>
                </label>

                {/* ۴. واترمارک امنیتی شناور */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    enableWatermark
                      ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-rose-600" />
                      واترمارک شناور کدملی
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      نمایش نیمه‌شفاف کدملی و نام دانش‌آموز روی صفحه جهت جلوگیری از عکاسی
                    </span>
                  </div>
                </label>

                {/* ۵. بهم‌ریختن تصادفی سوالات */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    shuffleQuestions
                      ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                      ترتیب تصادفی سوالات
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      ترتیب نمایش سوالات برای هر دانش‌آموز متفاوت خواهد بود
                    </span>
                  </div>
                </label>

                {/* ۶. بهم‌ریختن تصادفی گزینه‌ها */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    shuffleOptions
                      ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      بهم‌ریختن گزینه‌ها
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      چینش گزینه‌های ۱ تا ۴ برای هر دانش‌آموز جابجا می‌شود
                    </span>
                  </div>
                </label>

                {/* ۷. ناوبری ترتیبی خطی */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    isSequential
                      ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSequential}
                    onChange={(e) => setIsSequential(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                      ناوبری خطی (بدون بازگشت)
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      دانش‌آموز پس از عبور از سوال امکان بازگشت و تغییر پاسخ را ندارد
                    </span>
                  </div>
                </label>

                {/* ۸. نمره منفی کنکوری */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                    negativeMarking
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      نمره منفی کنکوری (۱/۳)
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                      کسر یک‌سوم نمره به ازای هر پاسخ غلط در تستی‌ها و محاسبه تراز سنجش
                    </span>
                  </div>
                </label>
              </div>

              {/* دکمه رفتن به مرحله ۲ */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  در مرحله بعد می‌توانید سوالات را به صورت دستی بنویسید یا از فایل PDF/Word آپلود کنید.
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2"
                >
                  <span>ادامه به استودیوی تدوین سوالات</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* گام ۲: میز تدوین سوالات (نوشتن دستی، آپلود PDF/Word، بانک سوالات) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            {/* نوار بالایی انتخاب نحوه ورود سوالات */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-rose-600" />
                  میز تدوین و گردآوری سوالات آزمون
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  روش مورد نظر خود را برای افزودن سوالات انتخاب نمایید.
                </p>
              </div>

              {/* دکمه‌های زبانه روش ورود */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveAuthorTab("MANUAL")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeAuthorTab === "MANUAL"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>✍️ نوشتن دستی سوال جدید</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAuthorTab("UPLOAD")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeAuthorTab === "UPLOAD"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>📂 آپلود فایل (Word / PDF) و کپی متن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAuthorTab("BANK")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeAuthorTab === "BANK"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📚 گزینش از بانک سوالات ({bankQuestions.length})</span>
                </button>
              </div>
            </div>

            {/* محتوای زبانه ۱: نوشتن دستی سوال جدید با تعیین جواب درست */}
            {activeAuthorTab === "MANUAL" && (
              <form
                onSubmit={handleAddManualQuestion}
                className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    طراحی مستقیم سوال جدید و تعیین پاسخ صحیح (کلید)
                  </h3>

                  {/* انتخاب نوع سوال */}
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setManualType("MULTIPLE_CHOICE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        manualType === "MULTIPLE_CHOICE"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>تستی (چهارگزینه‌ای)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType("TRUE_FALSE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        manualType === "TRUE_FALSE"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>صحیح / غلط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType("FILL_BLANK")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        manualType === "FILL_BLANK"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>جای‌خالی</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType("DESCRIPTIVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        manualType === "DESCRIPTIVE"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>تشریحی (دبیر)</span>
                    </button>
                  </div>
                </div>

                {/* صورت سوال */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">صورت سوال (با پشتیبانی فرمول KaTeX مانند $x^2$):</label>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>نمونه فرمول‌ها:</span>
                      <button
                        type="button"
                        onClick={() => setManualContent((prev) => prev + " $f'(x) = 2x$ ")}
                        className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                      >
                        مشتق
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualContent((prev) => prev + " $\\frac{a}{b}$ ")}
                        className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                      >
                        کسر
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualContent((prev) => prev + " $\\sqrt{x}$ ")}
                        className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                      >
                        رادیکال
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualContent((prev) => prev + " $\\lim_{x \\to 0}$ ")}
                        className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                      >
                        حد
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="صورت سوال را تایپ کنید. فرمول‌های ریاضی را بین دو علامت $ بنویسید..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed bg-slate-50"
                  />

                  {/* پیش‌نمایش زنده KaTeX */}
                  {manualContent.trim() && (
                    <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs">
                      <span className="text-[10px] text-indigo-600 font-bold block mb-1">پیش‌نمایش فرمول:</span>
                      <KaTeXRenderer content={manualContent} />
                    </div>
                  )}
                </div>

                {/* تعیین گزینه‌ها و پاسخ صحیح بر حسب نوع سوال */}
                {manualType === "MULTIPLE_CHOICE" && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      گزینه‌های تستی (گزینه صحیح را با دکمه رادیویی مشخص کنید):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {manualOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                            opt.isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="correct_option"
                            checked={opt.isCorrect}
                            onChange={() => {
                              setManualOptions((prev) =>
                                prev.map((o, i) => ({ ...o, isCorrect: i === idx }))
                              );
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`متن گزینه ${idx + 1}...`}
                            value={opt.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualOptions((prev) =>
                                prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                              );
                            }}
                            className="flex-1 bg-transparent text-xs outline-none font-medium"
                          />
                          {opt.isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                              پاسخ درست ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {manualType === "TRUE_FALSE" && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      تعیین وضعیت درست گزاره:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setManualTFCorrect("true")}
                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold text-xs transition ${
                          manualTFCorrect === "true"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                          ✓
                        </div>
                        <span>گزاره «صحیح» است (پاسخ درست)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualTFCorrect("false")}
                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold text-xs transition ${
                          manualTFCorrect === "false"
                            ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-black">
                          ✗
                        </div>
                        <span>گزاره «غلط» است (پاسخ درست)</span>
                      </button>
                    </div>
                  </div>
                )}

                {manualType === "FILL_BLANK" && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      پاسخ صحیح (کلید دقیق برای تصحیح خودکار):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="عدد یا کلمه کلیدی پاسخ صحیح (مثال: ۶ یا مشتق‌پذیر)..."
                      value={manualBlankAnswer}
                      onChange={(e) => setManualBlankAnswer(e.target.value)}
                      className="w-full p-3.5 rounded-2xl border-2 border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 bg-emerald-50/20 text-xs font-bold outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      سامانه به صورت هوشمند اعداد فارسی و انگلیسی و فاصله‌ها را یکسان‌سازی کرده و با این کلید تطبیق می‌دهد.
                    </p>
                  </div>
                )}

                {manualType === "DESCRIPTIVE" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      سوال تشریحی با تصحیح دبیر:
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      پاسخ این سوال توسط دانش‌آموز در کارتابل میز تصحیح دبیر قرار می‌گیرد تا بارم‌بندی و نمره تشریحی آن را ثبت فرمایید.
                    </p>
                  </div>
                )}

                {/* سطح سختی و راهنمای تشریحی */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">سطح دشواری سوال:</label>
                    <select
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="EASY">ساده (مفاهیم پایه کتاب)</option>
                      <option value="MEDIUM">متوسط (امتحان نهایی)</option>
                      <option value="HARD">دشوار (کنکوری / ترکیبی)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      راه حل تشریحی یا راهنمای تصحیح:
                    </label>
                    <input
                      type="text"
                      placeholder="راه حل تشریحی جهت نمایش در کارنامه پس از آزمون..."
                      value={manualExplanation}
                      onChange={(e) => setManualExplanation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>

                {/* دکمه افزودن سوال */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن این سوال به آزمون ➔</span>
                  </button>
                </div>
              </form>
            )}

            {/* محتوای زبانه ۲: آپلود فایل Word / PDF و کپی-پیست هوشمند */}
            {activeAuthorTab === "UPLOAD" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-rose-600" />
                    استخراج هوشمند سوالات از فایل Word (.docx)، PDF یا متن کپی‌شده
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    هوش مصنوعی فرمول‌ها، گزینه‌ها و کلید سوالات را به صورت خودکار شناسایی کرده و به آزمون اضافه می‌کند.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* آپلود فایل */}
                  <div className="space-y-3">
                    <label className="font-bold text-slate-700 text-xs block">
                      ۱. آپلود فایل سوالات (Word .docx یا PDF):
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center hover:border-rose-500 hover:bg-rose-50/20 transition cursor-pointer relative">
                      <input
                        type="file"
                        accept=".docx,.pdf,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      {uploadFile ? (
                        <div className="text-xs">
                          <span className="font-black text-slate-900 block">{uploadFile.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {(uploadFile.size / 1024).toFixed(1)} کیلوبایت • برای تغییر فایل کلیک کنید
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <span className="font-bold text-slate-700 block">فایل Word (.docx) یا PDF را اینجا بکشید</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">یا برای انتخاب فایل کلیک کنید</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* کپی-پیست متن خام */}
                  <div className="space-y-3">
                    <label className="font-bold text-slate-700 text-xs block">
                      ۲. یا کپی و پیست مستقیم متن سوالات:
                    </label>
                    <textarea
                      rows={6}
                      placeholder={`نمونه قالب متنی:
۱- مشتق تابع f(x) = x^2 در نقطه ۳ کدام است؟
الف) ۲
ب) ۴
ج) ۶ * (کلید)
د) ۹`}
                      value={pasteRawText}
                      onChange={(e) => setPasteRawText(e.target.value)}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs leading-relaxed bg-slate-50 font-sans"
                    />
                  </div>
                </div>

                {/* دکمه پردازش */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    💡 نکته: علامت ستاره (*) در کنار گزینه نشان‌دهنده پاسخ صحیح است.
                  </div>

                  <button
                    type="button"
                    disabled={isExtracting || (!pasteRawText.trim() && !uploadFile)}
                    onClick={handleExtractQuestions}
                    className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>هوش مصنوعی در حال پردازش سوالات...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>پردازش و استخراج هوشمند سوالات 🤖</span>
                      </>
                    )}
                  </button>
                </div>

                {extractError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}

                {/* پیش‌نمایش سوالات استخراج‌شده */}
                {extractedStaging.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        پیش‌نمایش {extractedStaging.length} سوال استخراج‌شده:
                      </h4>

                      <button
                        type="button"
                        onClick={handleAddAllExtractedToExam}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید و افزودن همه {extractedStaging.length} سوال به آزمون ➔</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto p-1">
                      {extractedStaging.map((q, idx) => {
                        const typeBadge = getTypeBadge(q.type);
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${typeBadge.style}`}
                              >
                                {typeBadge.icon}
                                {typeBadge.label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setExtractedStaging((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                              >
                                حذف این سوال
                              </button>
                            </div>
                            <div className="font-semibold text-slate-900">
                              <KaTeXRenderer content={q.content} />
                            </div>
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-lg border ${
                                      opt.isCorrect
                                        ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                                        : "bg-white border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {opt.orderIndex}. {opt.text} {opt.isCorrect && "✓ (صحیح)"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* محتوای زبانه ۳: گزینش از بانک سوالات */}
            {activeAuthorTab === "BANK" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      بانک سوالات طبقه‌بندی‌شده
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      سوالات مورد نظر را از بانک انتخاب نموده تا به آزمون اضافه شوند.
                    </p>
                  </div>

                  {/* نوار فیلتر انواع سوال در بانک */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setBankTypeFilter("ALL")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        bankTypeFilter === "ALL"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      همه
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankTypeFilter("MULTIPLE_CHOICE")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        bankTypeFilter === "MULTIPLE_CHOICE"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      تستی
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankTypeFilter("TRUE_FALSE")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        bankTypeFilter === "TRUE_FALSE"
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      صحیح/غلط
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankTypeFilter("DESCRIPTIVE")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        bankTypeFilter === "DESCRIPTIVE"
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      تشریحی
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankTypeFilter("FILL_BLANK")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        bankTypeFilter === "FILL_BLANK"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      جای‌خالی
                    </button>
                  </div>
                </div>

                {/* لیست سوالات بانک */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto p-1 text-xs">
                  {bankQuestions
                    .filter((q) => {
                      if (bankTypeFilter !== "ALL" && q.type !== bankTypeFilter) return false;
                      if (bankSearch && !q.content.includes(bankSearch)) return false;
                      return true;
                    })
                    .map((q, idx) => {
                      const isSelected = examQuestions.some((eq) => eq.id === q.id);
                      const typeBadge = getTypeBadge(q.type);

                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleBankQuestion(q)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                              : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 rounded text-emerald-600 w-4 h-4 shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${typeBadge.style}`}
                              >
                                {typeBadge.icon}
                                {typeBadge.label}
                              </span>
                              <span className="text-[11px] font-bold text-slate-600">
                                {q.topic?.title || "حسابان و ریاضی"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-900 leading-relaxed font-medium">
                              <KaTeXRenderer content={q.content} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* کارت جمع‌بندی سوالات آزمون جاری */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-black text-sm">
                      سوالات انتخاب‌شده برای این آزمون ({examQuestions.length} سوال)
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>{countMCQ} تستی</span>
                      <span>•</span>
                      <span>{countTF} صحیح/غلط</span>
                      <span>•</span>
                      <span>{countBlank} جای‌خالی</span>
                      <span>•</span>
                      <span>{countDesc} تشریحی</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={examQuestions.length === 0}
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>پیش‌نمایش نهایی آزمون ➔</span>
                  </button>
                </div>
              </div>

              {/* لیست سوالات افزوده شده به این آزمون */}
              {examQuestions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl">
                  هنوز هیچ سوالی به این آزمون اضافه نکرده‌اید. از زبانه‌های بالا سوال جدید بنویسید یا از بانک انتخاب کنید.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto p-1 text-xs">
                  {examQuestions.map((q, idx) => {
                    const typeBadge = getTypeBadge(q.type);
                    return (
                      <div
                        key={idx}
                        className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 shrink-0 ${typeBadge.style}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span className="truncate text-slate-200 text-xs font-medium">
                            {q.content.slice(0, 80)}...
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionFromExam(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/30 transition shrink-0"
                          title="حذف از آزمون"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* گام ۳: مرور نهایی برگه و انتشار رسمی آزمون */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            {/* کارت سربرگ خلاصه آزمون */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs bg-rose-50 text-rose-700 font-black px-3 py-1 rounded-full border border-rose-200">
                    پیش‌نمایش برگه امتحانی دانش‌آموز (Student View Preview)
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">{title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    کلاس: {classrooms.find((c) => c.id === selectedClassroomId)?.name || "کلاس منتخب"} • مدت: {durationMinutes} دقیقه
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    ویرایش سوالات
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingExam}
                    onClick={handlePublishExam}
                    className="px-7 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/25 transition flex items-center gap-2"
                  >
                    {isSubmittingExam ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>در حال انتشار و ثبت نهایی...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>تایید و فعال‌سازی رسمی اتاق آزمون 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* نوار وضعیت تدابیر امنیتی فعال */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  تدابیر امنیتی و ضدتقلب فعال برای این آزمون:
                </span>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {enableFullscreen && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      ✓ قفل تمام‌صفحه
                    </span>
                  )}
                  {detectTabSwitch && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      ✓ رصد خروج تب (حداکثر {maxTabSwitches} بار)
                    </span>
                  )}
                  {disableCopyPaste && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      ✓ قفل کپی/پیست و F12
                    </span>
                  )}
                  {enableWatermark && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      ✓ واترمارک شناور کدملی
                    </span>
                  )}
                  {shuffleQuestions && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold">
                      ✓ ترتیب تصادفی سوالات
                    </span>
                  )}
                  {shuffleOptions && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold">
                      ✓ ترتیب تصادفی گزینه‌ها
                    </span>
                  )}
                  {isSequential && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">
                      ✓ ناوبری خطی بدون بازگشت
                    </span>
                  )}
                  {negativeMarking && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      ✓ نمره منفی یک‌سوم
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* پیش‌نمایش سوالات به همان شکل واقعی دانش‌آموز */}
            <div className="space-y-4">
              {examQuestions.map((q, idx) => {
                const typeBadge = getTypeBadge(q.type);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${typeBadge.style}`}
                        >
                          {typeBadge.icon}
                          {typeBadge.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        بارم: {(20 / (examQuestions.length || 1)).toFixed(2)} نمره
                      </span>
                    </div>

                    {/* صورت سوال با KaTeX */}
                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                      <KaTeXRenderer content={q.content} />
                    </div>

                    {/* گزینه‌ها یا پاسخ */}
                    {q.type === "MULTIPLE_CHOICE" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                              opt.isCorrect
                                ? "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                                opt.isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white border border-slate-300 text-slate-600"
                              }`}
                            >
                              {opt.orderIndex}
                            </span>
                            <div className="flex-1 font-medium">
                              <KaTeXRenderer content={opt.text} />
                            </div>
                            {opt.isCorrect && (
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                                پاسخ صحیح ✓
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "TRUE_FALSE" && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3.5 rounded-2xl border text-center font-black ${
                              opt.isCorrect
                                ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            <span>{opt.text}</span>
                            {opt.isCorrect && <span className="block text-[10px] text-emerald-700 mt-0.5">کلید صحیح آزمون</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "FILL_BLANK" && (
                      <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-emerald-900 block">کلید پاسخ صحیح جای‌خالی:</span>
                        <div className="font-black text-slate-900">
                          {q.options.find((o) => o.isCorrect)?.text || "پاسخ عددی/متنی"}
                        </div>
                      </div>
                    )}

                    {q.type === "DESCRIPTIVE" && (
                      <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-amber-900 block">سوال تشریحی:</span>
                        <div className="text-slate-600 text-[11px]">
                          کادر پاسخ تشریحی متنی برای دانش‌آموز نمایش داده می‌شود و پاسخ در کارتابل تصحیح دبیر قرار خواهد گرفت.
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-bold text-indigo-700">راهنما و پاسخ تشریحی: </span>
                        <KaTeXRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
