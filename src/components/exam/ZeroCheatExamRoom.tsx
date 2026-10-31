"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldAlert,
  Clock,
  Lock,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  RotateCcw,
  Zap,
  Copy,
  Shuffle,
  FileText,
  CheckSquare,
  BookOpen,
  PenTool,
  Check,
  Eye,
  Camera,
  Mic,
  Monitor,
  Users,
  Minimize2,
  Volume2,
} from "lucide-react";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

interface AntiCheatSettings {
  enableFullscreen?: boolean;
  detectTabSwitch?: boolean;
  maxTabSwitches?: number;
  disableCopyPaste?: boolean;
  enableWatermark?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  isSequential?: boolean;
  negativeMarking?: boolean;
  enableWebcamProctoring?: boolean;
  enableAudioMonitoring?: boolean;
  detectDualScreen?: boolean;
  blockConcurrentLogin?: boolean;
}

interface ExamDetail {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  isSequential: boolean;
  enableAntiCheat: boolean;
  maxTabSwitches: number;
  antiCheatSettings?: AntiCheatSettings;
  classroom?: {
    name: string;
    school?: { name: string };
  };
  teacher?: {
    fullName: string;
  };
  topic?: {
    title: string;
  };
}

interface QuestionItem {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  explanation?: string | null;
  options: Array<{
    id: string;
    orderIndex: number;
    optionText?: string;
    text?: string;
    isCorrect: boolean;
  }>;
}

interface ZeroCheatExamRoomProps {
  exam: ExamDetail;
  questions: QuestionItem[];
  studentId: string;
  studentName: string;
  studentNationalId: string;
  schoolName: string;
  initialAttempt?: any;
  onExit?: () => void;
}

export const ZeroCheatExamRoom: React.FC<ZeroCheatExamRoomProps> = ({
  exam,
  questions: initialQuestions,
  studentId,
  studentName,
  studentNationalId,
  schoolName,
  initialAttempt,
  onExit,
}) => {
  // تنظیمات نهایی ضدتقلب از آزمون یا پیش‌فرض‌ها
  const antiCheat = useMemo(() => {
    return (
      exam.antiCheatSettings || {
        enableFullscreen: exam.enableAntiCheat,
        detectTabSwitch: exam.enableAntiCheat,
        maxTabSwitches: exam.maxTabSwitches || 3,
        disableCopyPaste: exam.enableAntiCheat,
        enableWatermark: exam.enableAntiCheat,
        shuffleQuestions: false,
        shuffleOptions: false,
        isSequential: exam.isSequential,
        negativeMarking: true,
        enableWebcamProctoring: exam.enableAntiCheat,
        enableAudioMonitoring: exam.enableAntiCheat,
        detectDualScreen: exam.enableAntiCheat,
        blockConcurrentLogin: true,
      }
    );
  }, [exam]);

  // شناسه یکتای نشست کلاینت جهت جلوگیری از ورود همزمان
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);
  const [sessionBlockReason, setSessionBlockReason] = useState("");

  // پایش مانیتور دوم (Dual-Screen)
  const [dualScreenDetected, setDualScreenDetected] = useState(false);

  // پایش وب‌کم و هوش مصنوعی چهره
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [faceStatus, setFaceStatus] = useState<"NORMAL" | "LOOKING_AWAY" | "NO_FACE" | "MULTIPLE_FACES">("NORMAL");
  const [proctoringMinimzed, setProctoringMinimized] = useState(false);

  // پایش صوتی میکروفون
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // سوالات مرتب شده یا تصادفی بر اساس تنظیم معلم
  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>(initialQuestions);

  // مراحل: لابی پیش‌آزمون (lobby)، حین آزمون (active)، کارنامه نهایی (result)
  const [phase, setPhase] = useState<"lobby" | "active" | "result">(
    initialAttempt?.submittedAt ? "result" : "lobby"
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // شمارش معکوس زمان آزمون
  const [secondsRemaining, setSecondsRemaining] = useState(exam.durationMinutes * 60);

  // نظارت و مانیتورینگ ضدتقلب
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningLogs, setWarningLogs] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningTitle, setWarningTitle] = useState("هشدار تخلف امنیتی!");
  const [warningMessage, setWarningMessage] = useState("");

  // نتایج پس از ارسال
  const [resultData, setResultData] = useState<any>(initialAttempt || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(true);

  // سوالات را در صورت فعال بودن بهم‌ریختن تصادفی مرتب می‌کنیم
  useEffect(() => {
    if (antiCheat.shuffleQuestions && initialQuestions.length > 0) {
      // ایجاد یک کپی و بهم‌ریختن
      const shuffled = [...initialQuestions].sort(() => Math.random() - 0.5);
      setExamQuestions(shuffled);
    } else {
      setExamQuestions(initialQuestions);
    }
  }, [initialQuestions, antiCheat.shuffleQuestions]);

  // بارگذاری پاسخ‌ها از LocalStorage در صورت قطعی اینترنت
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`exam_${exam.id}_answers`);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch {}
      }
    }
  }, [exam.id]);

  // ذخیره پاسخ‌ها در استیت و کش LocalStorage
  const handleAnswerChange = (questionId: string, val: string) => {
    const updated = { ...answers, [questionId]: val };
    setAnswers(updated);
    setIsAutoSaved(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`exam_${exam.id}_answers`, JSON.stringify(updated));
    }
  };

  // تایمر معکوس
  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // پایان زمان و تحویل اجباری
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // ثبت یکپارچه تخلف امنیتی و بررسی سقف خطا
  const recordViolation = (reason: string, isCritical = false) => {
    const timeStr = new Date().toLocaleTimeString("fa-IR");
    const log = `${reason} در ساعت ${timeStr}`;
    setWarningLogs((prev) => [...prev, log]);

    const maxLimit = antiCheat.maxTabSwitches || 3;
    setTabSwitchCount((prev) => {
      const newCount = prev + 1;
      setWarningTitle(isCritical ? "تخلف بحرانی امنیتی!" : "هشدار تخلف ضدتقلب!");
      setWarningMessage(
        `${reason} (اخطار ${newCount} از ${maxLimit}). در صورت تکرار، آزمون به صورت خودکار پایان خواهد یافت.`
      );
      setShowWarningModal(true);

      if (newCount >= maxLimit || isCritical) {
        setTimeout(() => {
          handleSubmitExam(true);
        }, 1200);
      }
      return newCount;
    });
  };

  // شنود ضدتقلب ۱: خروج از تب و تغییر فوکوس (Tab-Switch & Blur Detection)
  useEffect(() => {
    if (phase !== "active" || !antiCheat.detectTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("خروج از صفحه آزمون / تغییر تب");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase, antiCheat.detectTabSwitch]);

  // شنود ضدتقلب ۲: نظارت بر حالت تمام‌صفحه (Fullscreen Monitoring)
  useEffect(() => {
    if (phase !== "active" || !antiCheat.enableFullscreen) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation("خروج از حالت تمام‌صفحه");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [phase, antiCheat.enableFullscreen]);

  // شنود ضدتقلب ۳: مسدودسازی کپی، پیست و کلیدهای میانبر (Copy/Paste & Keydown Blocking)
  useEffect(() => {
    if (phase !== "active" || !antiCheat.disableCopyPaste) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // غیرفعال کردن کلیدهای ترکیبی بازرسی، کپی و اسکرین‌شات
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "a" || e.key === "p")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        e.key === "F12" ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      // جلوگیری از کپی متن سوالات
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
    };
  }, [phase, antiCheat.disableCopyPaste]);

  // شنود ضدتقلب ۴: تشخیص مانیتور دوم و نمایشگر جانبی (Dual-Screen Detection)
  useEffect(() => {
    if (!antiCheat.detectDualScreen) return;

    const checkDualScreen = () => {
      const isExt = (window.screen as any)?.isExtended === true;
      const isWide = window.screen.availWidth > window.screen.width * 1.25;
      const detected = Boolean(isExt || isWide);
      setDualScreenDetected(detected);

      if (phase === "active" && detected) {
        recordViolation("اتصال نمایشگر دوم (Dual-Screen / Extended Display)");
      }
    };

    checkDualScreen();
    const interval = setInterval(checkDualScreen, 4000);
    (window.screen as any)?.addEventListener?.("change", checkDualScreen);

    return () => {
      clearInterval(interval);
      (window.screen as any)?.removeEventListener?.("change", checkDualScreen);
    };
  }, [phase, antiCheat.detectDualScreen]);

  // شنود ضدتقلب ۵: تطبیق IP و جلوگیری از نشست‌های چندگانه (Concurrent Login Block)
  useEffect(() => {
    if (phase !== "active" || !antiCheat.blockConcurrentLogin) return;

    // ۱. ثبت شروع نشست در سرور
    const startSession = async () => {
      try {
        const res = await fetch(`/api/exams/${exam.id}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            studentId,
            sessionId,
          }),
        });
        const data = await res.json();
        if (data.blocked) {
          setIsSessionBlocked(true);
          setSessionBlockReason(data.reason || "نشست همزمان فعال دیگری شناسایی شد.");
          recordViolation("تشخیص نشست همزمان از سیستم دیگر", true);
        }
      } catch (err) {
        console.error("Session start error:", err);
      }
    };

    startSession();

    // ۲. پالس تپش قلب دوره‌ای هر ۸ ثانیه
    const heartbeatInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exams/${exam.id}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            studentId,
            sessionId,
          }),
        });
        const data = await res.json();
        if (data.blocked) {
          setIsSessionBlocked(true);
          setSessionBlockReason(data.reason || "نشست متوقف شد.");
          recordViolation("قطع نشست به دلیل ورود از سیستم دیگر", true);
        } else if (data.ipWarning) {
          recordViolation(data.ipWarning);
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, 8000);

    return () => {
      clearInterval(heartbeatInterval);
      fetch(`/api/exams/${exam.id}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          studentId,
          sessionId,
        }),
      }).catch(() => {});
    };
  }, [phase, antiCheat.blockConcurrentLogin, exam.id, studentId, sessionId]);

  // شنود ضدتقلب ۶: پایش وب‌کم با هوش مصنوعی و پایش صوتی میکروفون (AI Face, Gaze & Audio)
  useEffect(() => {
    if (phase !== "active" || (!antiCheat.enableWebcamProctoring && !antiCheat.enableAudioMonitoring)) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let animationFrameId: number;
    let audioInterval: NodeJS.Timeout;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: antiCheat.enableWebcamProctoring ? { width: { ideal: 320 }, height: { ideal: 240 } } : false,
          audio: antiCheat.enableAudioMonitoring ? true : false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        // اتصال ویدیو
        if (antiCheat.enableWebcamProctoring && videoRef.current && stream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setHasCameraPermission(true);
        }

        // راه‌اندازی Web Audio API
        if (antiCheat.enableAudioMonitoring && stream.getAudioTracks().length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            setHasMicPermission(true);

            let highNoiseTicks = 0;
            audioInterval = setInterval(() => {
              if (!isMounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              const level = Math.min(100, Math.round((avg / 128) * 100));
              setAudioLevel(level);

              // اگر صدا برای بیش از ۱.۵ ثانیه بالای ۴۵ درصد بماند
              if (level > 45) {
                highNoiseTicks++;
                if (highNoiseTicks >= 3) {
                  highNoiseTicks = 0;
                  recordViolation(`ثبت مکالمه یا نویز صوتی نامتعارف در محیط آزمون (سطح صدا: ${level}٪)`);
                }
              } else {
                highNoiseTicks = Math.max(0, highNoiseTicks - 1);
              }
            }, 500);
          } catch (e) {
            console.warn("Audio Context init error:", e);
          }
        }
      } catch (err) {
        console.warn("Camera/Mic access denied or unavailable:", err);
        if (isMounted) {
          setHasCameraPermission(false);
          setHasMicPermission(false);
        }
      }
    };

    initMedia();

    // حلقه پردازش هوش مصنوعی وب‌کم
    let noFaceTicks = 0;
    let gazeShiftTicks = 0;
    let multiFaceTicks = 0;
    let detector: any = null;

    if (typeof window !== "undefined" && (window as any).FaceDetector) {
      try {
        detector = new (window as any).FaceDetector({ maxDetectedFaces: 5, fastMode: true });
      } catch {}
    }

    const processVideoFrame = async () => {
      if (!isMounted) return;

      if (antiCheat.enableWebcamProctoring && videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const width = video.videoWidth || 320;
        let detectedFacesCount = 1;
        let isGazeDeviated = false;

        if (detector) {
          try {
            const faces = await detector.detect(video);
            detectedFacesCount = faces.length;
            if (faces.length === 1) {
              const box = faces[0].boundingBox;
              const centerX = box.x + box.width / 2;
              const relativeX = centerX / width;
              if (relativeX < 0.22 || relativeX > 0.78) {
                isGazeDeviated = true;
              }
            }
          } catch {}
        } else {
          // فال‌بک پردازش رنگ پوست و خوشه‌بندی روی Canvas
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          canvas.width = 80;
          canvas.height = 60;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, 80, 60);
            const imgData = ctx.getImageData(0, 0, 80, 60);
            const data = imgData.data;

            let skinPixelCount = 0;
            let sumX = 0;
            let leftHalfSkin = 0;
            let rightHalfSkin = 0;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const pixelIdx = i / 4;
              const px = pixelIdx % 80;

              const isSkin =
                r > 95 &&
                g > 40 &&
                b > 20 &&
                r - g > 15 &&
                r > b &&
                Math.max(r, g, b) - Math.min(r, g, b) > 15;

              if (isSkin) {
                skinPixelCount++;
                sumX += px;
                if (px < 35) leftHalfSkin++;
                if (px > 45) rightHalfSkin++;
              }
            }

            if (skinPixelCount < 90) {
              detectedFacesCount = 0;
            } else if (leftHalfSkin > 280 && rightHalfSkin > 280 && Math.abs(leftHalfSkin - rightHalfSkin) < 90) {
              detectedFacesCount = 2;
            } else {
              detectedFacesCount = 1;
              const centroidX = sumX / skinPixelCount;
              if (centroidX < 20 || centroidX > 60) {
                isGazeDeviated = true;
              }
            }
          }
        }

        if (detectedFacesCount === 0) {
          setFaceStatus("NO_FACE");
          noFaceTicks++;
          gazeShiftTicks = 0;
          multiFaceTicks = 0;
          if (noFaceTicks >= 3) {
            noFaceTicks = 0;
            recordViolation("عدم حضور چهره مقابل دوربین وب‌کم (خروج از کادر)");
          }
        } else if (detectedFacesCount > 1) {
          setFaceStatus("MULTIPLE_FACES");
          multiFaceTicks++;
          noFaceTicks = 0;
          gazeShiftTicks = 0;
          if (multiFaceTicks >= 2) {
            multiFaceTicks = 0;
            recordViolation("تشخیص حضور فرد دوم یا بیش از یک نفر در کادر دوربین");
          }
        } else if (isGazeDeviated) {
          setFaceStatus("LOOKING_AWAY");
          gazeShiftTicks++;
          noFaceTicks = 0;
          multiFaceTicks = 0;
          if (gazeShiftTicks >= 3) {
            gazeShiftTicks = 0;
            recordViolation("انحراف ممتد زاویه نگاه از صفحه آزمون / چرخش سر به اطراف");
          }
        } else {
          setFaceStatus("NORMAL");
          noFaceTicks = Math.max(0, noFaceTicks - 1);
          gazeShiftTicks = Math.max(0, gazeShiftTicks - 1);
          multiFaceTicks = Math.max(0, multiFaceTicks - 1);
        }
      }

      setTimeout(() => {
        if (isMounted) {
          animationFrameId = requestAnimationFrame(processVideoFrame);
        }
      }, 1000);
    };

    animationFrameId = requestAnimationFrame(processVideoFrame);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      if (audioInterval) clearInterval(audioInterval);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [phase, antiCheat.enableWebcamProctoring, antiCheat.enableAudioMonitoring]);

  // شروع آزمون و ورود به حالت تمام‌صفحه
  const handleStartExam = () => {
    if (antiCheat.enableFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setPhase("active");
  };

  // ارسال نهایی پاسخنامه
  const handleSubmitExam = async (isForced = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // توقف استریم وب‌کم و میکروفون
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }

    try {
      const res = await fetch(`/api/exams/${exam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          answers,
          tabSwitchCount,
          warningLogs,
          sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultData(data);
        setPhase("result");
        // خروج از حالت تمام صفحه
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem(`exam_${exam.id}_answers`);
        }
      } else {
        alert(data.error || "خطا در ثبت پاسخنامه");
      }
    } catch (e) {
      console.error(e);
      alert("خطای غیرمنتظره در ثبت آزمون");
    } finally {
      setIsSubmitting(false);
    }
  };

  // فرمت زمان دقیقه و ثانیه
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeCritical = secondsRemaining < 300; // کمتر از ۵ دقیقه

  const currentQ = examQuestions[currentIndex];
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && String(answers[k]).trim() !== ""
  ).length;

  // دسته‌بندی سوالات موجود در آزمون
  const countMCQ = examQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const countTF = examQuestions.filter((q) => q.type === "TRUE_FALSE").length;
  const countDesc = examQuestions.filter((q) => q.type === "DESCRIPTIVE").length;
  const countBlank = examQuestions.filter((q) => q.type === "FILL_BLANK").length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return {
          label: "چهارگزینه‌ای (تستی)",
          icon: <CheckSquare className="w-3 h-3" />,
          style: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "TRUE_FALSE":
        return {
          label: "صحیح / غلط",
          icon: <HelpCircle className="w-3 h-3" />,
          style: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "DESCRIPTIVE":
        return {
          label: "تشریحی (پاسخ باز)",
          icon: <FileText className="w-3 h-3" />,
          style: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "FILL_BLANK":
        return {
          label: "جای‌خالی (کوتاه‌پاسخ)",
          icon: <PenTool className="w-3 h-3" />,
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          label: "تستی",
          icon: <CheckSquare className="w-3 h-3" />,
          style: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  // =========================================================================
  // ۱. لابی پیش‌آزمون (Pre-Exam Waiting Lobby)
  // =========================================================================
  if (phase === "lobby") {
    return (
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl p-6 md:p-12 border border-slate-200 shadow-xl space-y-7 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-xs bg-rose-50 text-rose-700 font-black px-3 py-1 rounded-full border border-rose-200">
            سامانه آزمون آنلاین امن و چندنوعی (Zero-Cheat Exam Room)
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            {schoolName} • کلاس: {exam.classroom?.name} • دبیر: {exam.teacher?.fullName}
          </p>
        </div>

        {/* اخطار مانیتور دوم در لابی */}
        {antiCheat.detectDualScreen && dualScreenDetected && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-900 animate-pulse">
            <Monitor className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black block mb-0.5">اتصال مانیتور دوم (Dual-Screen) شناسایی شد:</span>
              جهت رعایت پروتکل‌های آزمون امن، لطفاً اتصال نمایشگر دوم یا کابل HDMI را قطع نمایید تا مجوز ورود به اتاق آزمون صادر شود.
            </div>
          </div>
        )}

        {/* جعبه ترکیب سوالات */}
        <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex flex-wrap items-center justify-around gap-3 text-xs">
          <div className="text-center">
            <span className="block text-base font-black text-slate-900">{examQuestions.length}</span>
            <span className="text-[11px] text-slate-500 font-bold">کل سوالات</span>
          </div>
          {countMCQ > 0 && (
            <div className="text-center text-indigo-700">
              <span className="block text-base font-black">{countMCQ}</span>
              <span className="text-[11px] font-bold">تستی</span>
            </div>
          )}
          {countTF > 0 && (
            <div className="text-center text-sky-700">
              <span className="block text-base font-black">{countTF}</span>
              <span className="text-[11px] font-bold">صحیح/غلط</span>
            </div>
          )}
          {countBlank > 0 && (
            <div className="text-center text-emerald-700">
              <span className="block text-base font-black">{countBlank}</span>
              <span className="text-[11px] font-bold">جای‌خالی</span>
            </div>
          )}
          {countDesc > 0 && (
            <div className="text-center text-amber-800">
              <span className="block text-base font-black">{countDesc}</span>
              <span className="text-[11px] font-bold">تشریحی (دبیر)</span>
            </div>
          )}
        </div>

        {/* جعبه راهنما و ضوابط فعال امنیتی تعیین‌شده توسط دبیر */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 text-xs text-slate-700">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            تدابیر امنیتی و ضوابط تعیین‌شده توسط دبیر:
          </h3>
          <ul className="space-y-2.5 list-disc list-inside leading-relaxed text-slate-600">
            <li>
              مدت زمان آزمون <span className="font-bold text-slate-900">{exam.durationMinutes} دقیقه</span> است و با اتمام زمان، برگه به صورت خودکار تحویل خواهد شد.
            </li>
            {antiCheat.negativeMarking && (
              <li>
                <span className="font-bold text-rose-700">نمره منفی کنکوری:</span> برای سوالات تستی و صحیح/غلط، نمره منفی ۱/۳ فعال است.
              </li>
            )}
            {antiCheat.enableFullscreen && (
              <li>
                <span className="font-bold text-indigo-700">قفل تمام‌صفحه:</span> ورود به آزمون منوط به قرارگیری در حالت Fullscreen است.
              </li>
            )}
            {antiCheat.detectTabSwitch && (
              <li>
                <span className="font-bold text-rose-700">رصد خروج از تب:</span> حداکثر سقف مجاز خروج از صفحه آزمون{" "}
                <span className="font-bold text-rose-800">{antiCheat.maxTabSwitches || 3} بار اخطار</span> است و پس از آن برگه مسدود می‌شود.
              </li>
            )}
            {antiCheat.disableCopyPaste && (
              <li>
                <span className="font-bold text-slate-900">مسدودسازی کپی و راست‌کلیک:</span> هرگونه کپی‌برداری از سوالات یا کلیدهای میانبر غیرفعال است.
              </li>
            )}
            {antiCheat.enableWatermark && (
              <li>
                <span className="font-bold text-indigo-700">واترمارک شناور:</span> کدملی و مشخصات هویتی شما به صورت نیمه‌شفاف در زمینه نمایش داده خواهد شد.
              </li>
            )}
            {antiCheat.enableWebcamProctoring && (
              <li>
                <span className="font-bold text-rose-700">پایش هوشمند وب‌کم:</span> وضعیت چهره، انحراف زاویه نگاه، چرخش سر و عدم حضور افراد غیرمجاز توسط پردازش تصویر هوش مصنوعی ارزیابی می‌شود.
              </li>
            )}
            {antiCheat.enableAudioMonitoring && (
              <li>
                <span className="font-bold text-rose-700">پایش صوتی محیط:</span> حجم صدای محیط توسط میکروفون بررسی شده و صحبت یا همیاری کلامی اخطار ثبت می‌کند.
              </li>
            )}
            {antiCheat.detectDualScreen && (
              <li>
                <span className="font-bold text-indigo-700">پایش مانیتور دوم:</span> اتصال هرگونه نمایشگر اکستندد یا کابل HDMI جانبی غیرمجاز و ممنوع است.
              </li>
            )}
            {antiCheat.blockConcurrentLogin && (
              <li>
                <span className="font-bold text-slate-900">قفل نشست همزمان:</span> باز کردن آزمون در چند تب یا ارسال پاسخ همزمان از سیستم دیگر مسدود است.
              </li>
            )}
            {antiCheat.isSequential && (
              <li>
                <span className="font-bold text-amber-700">ناوبری ترتیبی:</span> پس از پاسخ و رفتن به سوال بعدی، امکان بازگشت به سوالات قبل وجود نخواهد داشت.
              </li>
            )}
            <li>
              تمام پاسخ‌ها پس از وارد کردن در حافظه محلی ذخیره می‌شوند تا در صورت قطعی اینترنت مشکلی پیش نیاید.
            </li>
          </ul>
        </div>

        {/* دکمه ورود به آزمون */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              انصراف و بازگشت
            </button>
          )}

          <button
            type="button"
            disabled={antiCheat.detectDualScreen && dualScreenDetected}
            onClick={handleStartExam}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-xs font-black shadow-lg transition transform ${
              antiCheat.detectDualScreen && dualScreenDetected
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-rose-600/25 hover:-translate-y-0.5"
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            {antiCheat.detectDualScreen && dualScreenDetected
              ? "ورود غیرمجاز (مانیتور دوم را قطع کنید)"
              : "ورود به اتاق آزمون 🔒"}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ۳. کارنامه و نتیجه آزمون (Result Screen)
  // =========================================================================
  if (phase === "result") {
    const hasPendingDesc =
      resultData?.hasDescriptive ||
      resultData?.pendingDescriptiveCount > 0 ||
      countDesc > 0;

    return (
      <div className="max-w-4xl mx-auto my-8 bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl space-y-7 animate-in zoom-in-95">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-200">
            کارنامه رسمی آزمون آنلاین
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{exam.title}</h2>
          <p className="text-xs text-slate-500">
            دانش‌آموز: {studentName} ({studentNationalId}) • {schoolName}
          </p>
        </div>

        {/* اعلان وضعیت تصحیح هیبرید */}
        {hasPendingDesc && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-amber-950 block mb-0.5">
                کارنامه اولیه • در انتظار ثبت نمره سوالات تشریحی توسط دبیر:
              </span>
              سوالات تستی، صحیح/غلط و جای‌خالی به صورت هوشمند و آنی تصحیح گردیدند. پاسخ‌های تشریحی شما جهت نمره‌گذاری به کارتابل میز تصحیح دبیر محترم ارسال شدند و نمره نهایی پس از ثبت دبیر به‌روز خواهد شد.
            </div>
          </div>
        )}

        {/* جعبه تراز و درصد */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 text-center">
            <span className="text-xs text-indigo-700 font-bold">تراز تخمینی سنجش</span>
            <div className="text-3xl font-black text-indigo-950 mt-1">
              {resultData?.taraz || resultData?.attempt?.taraz || 6500}
            </div>
            <span className="text-[10px] text-indigo-600 mt-1 block">رتبه ممتاز کلاس</span>
          </div>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 text-center">
            <span className="text-xs text-emerald-700 font-bold">
              درصد تستی / محاسباتی {antiCheat.negativeMarking ? "(با نمره منفی)" : ""}
            </span>
            <div className="text-3xl font-black text-emerald-950 mt-1">
              {resultData?.percentage !== undefined
                ? `${resultData.percentage}٪`
                : `${resultData?.attempt?.percentage || 75}٪`}
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">
              نمره: {resultData?.score || resultData?.attempt?.score || 15} از ۲۰
            </span>
          </div>

          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-100 text-center">
            <span className="text-xs text-amber-800 font-bold">امتیاز تجربه کسب‌شده</span>
            <div className="text-3xl font-black text-amber-950 mt-1 flex items-center justify-center gap-1">
              <Zap className="w-6 h-6 fill-amber-500 text-amber-600" />
              +۵۰ XP
            </div>
            <span className="text-[10px] text-amber-700 mt-1 block">پاداش شرکت در آزمون</span>
          </div>
        </div>

        {/* جزئیات تفکیکی پاسخگویی */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-around text-xs font-bold">
          <div className="text-center text-emerald-700">
            <span className="block text-xl font-black">{resultData?.correctCount || 0}</span>
            <span>پاسخ صحیح</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div className="text-center text-rose-700">
            <span className="block text-xl font-black">{resultData?.wrongCount || 0}</span>
            <span>پاسخ غلط</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div className="text-center text-slate-500">
            <span className="block text-xl font-black">{resultData?.unansweredCount || 0}</span>
            <span>بدون پاسخ</span>
          </div>
          {hasPendingDesc && (
            <>
              <div className="h-8 w-px bg-slate-300" />
              <div className="text-center text-amber-800">
                <span className="block text-xl font-black">
                  {resultData?.pendingDescriptiveCount || countDesc}
                </span>
                <span>در انتظار دبیر</span>
              </div>
            </>
          )}
        </div>

        {/* لیست و مرور سوالات آزمون با پاسخ دانش‌آموز */}
        <div className="space-y-4">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            مرور پاسخنامه و سوالات آزمون:
          </h4>

          <div className="space-y-3 max-h-96 overflow-y-auto p-1">
            {examQuestions.map((q, idx) => {
              const studentAns = answers[q.id];
              const typeBadge = getTypeBadge(q.type);
              const qResult = resultData?.questionResults?.[q.id];

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${typeBadge.style}`}
                      >
                        {typeBadge.icon}
                        {typeBadge.label}
                      </span>
                    </div>

                    <div>
                      {q.type === "DESCRIPTIVE" ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          در انتظار تصحیح دبیر
                        </span>
                      ) : qResult?.isCorrect ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> پاسخ صحیح
                        </span>
                      ) : studentAns ? (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> پاسخ نادرست
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          بدون پاسخ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* صورت سوال */}
                  <div className="text-xs text-slate-900 leading-relaxed font-medium">
                    <KaTeXRenderer content={q.content} />
                  </div>

                  {/* پاسخ وارد شده */}
                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <div className="text-slate-600">
                      <span className="font-bold">پاسخ شما: </span>
                      {studentAns ? (
                        <span className="font-black text-slate-900">
                          {q.type === "TRUE_FALSE"
                            ? studentAns === "true" || studentAns === "صحیح"
                              ? "صحیح"
                              : "غلط"
                            : studentAns}
                        </span>
                      ) : (
                        <span className="text-slate-400">پاسخی ثبت نکرده‌اید</span>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="text-slate-600 pt-1 text-[11px] border-t border-slate-200/80 mt-1">
                        <span className="font-bold text-indigo-700">راهنما و پاسخ تشریحی: </span>
                        <KaTeXRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md transition"
            >
              بازگشت به پنل دانش‌آموز
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ۲. اتاق فعال آزمون با قفل ضدتقلب و پشتیبانی از همه انواع سوالات
  // =========================================================================
  return (
    <div
      onContextMenu={(e) => {
        if (antiCheat.disableCopyPaste) e.preventDefault();
      }}
      className="min-h-screen bg-slate-100 flex flex-col justify-between select-none relative overflow-hidden"
    >
      {/* ===================================================================== */}
      {/* واترمارک امنیتی متحرک (Anti-Leak Floating Watermark) */}
      {/* ===================================================================== */}
      {antiCheat.enableWatermark && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex flex-wrap gap-24 opacity-[0.06] rotate-[-25deg] justify-center items-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="text-xs font-black text-slate-900 select-none whitespace-nowrap">
              {studentName} • {studentNationalId} • {schoolName}
            </div>
          ))}
        </div>
      )}

      {/* مودال خطای قفل نشست همزمان */}
      {isSessionBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-rose-600 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-slate-900">قفل نشست همزمان (Concurrent Login)</h3>
            <p className="text-xs text-rose-700 font-bold leading-relaxed">{sessionBlockReason}</p>
            <p className="text-[11px] text-slate-500">
              این آزمون به دلیل ثبت ورود همزمان از دستگاه، مرورگر یا تب دیگری مسدود شد.
            </p>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition"
              >
                خروج از آزمون
              </button>
            )}
          </div>
        </div>
      )}

      {/* هشدار تخلف خروج از تب / تمام‌صفحه */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-rose-500 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-slate-900">{warningTitle}</h3>
            <p className="text-xs text-rose-700 font-bold leading-relaxed">{warningMessage}</p>
            <p className="text-[11px] text-slate-500">
              توجه داشته باشید که کلیه اقدامات و زمان‌های خروج در لاگ تخلفات امنیتی ثبت می‌گردد.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowWarningModal(false);
                if (antiCheat.enableFullscreen && !document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition"
            >
              متوجه شدم؛ بازگشت به آزمون
            </button>
          </div>
        </div>
      )}

      {/* نوار بالایی HUD آزمون */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 md:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-xs font-black">
            {currentIndex + 1}
          </span>
          <div>
            <h3 className="text-xs font-black">{exam.title}</h3>
            <div className="text-[10px] text-slate-400">
              سوال {currentIndex + 1} از {examQuestions.length} • {answeredCount} پاسخ ثبت‌شده
            </div>
          </div>
        </div>

        {/* زمان‌سنج معکوس */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border font-mono text-xs font-black transition ${
            isTimeCritical
              ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
              : "bg-slate-800 text-amber-400 border-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* دکمه پایان و ارسال */}
        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && (
            <span className="text-[11px] bg-rose-500/30 text-rose-300 border border-rose-400/40 px-2.5 py-1 rounded-full font-bold hidden sm:inline">
              {tabSwitchCount} اخطار تخلف
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm("آیا از پایان آزمون و تحویل نهایی برگه اطمینان دارید؟")) {
                handleSubmitExam(false);
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? "در حال ارسال..." : "پایان آزمون ➔"}
          </button>
        </div>
      </header>

      {/* بدنه اصلی سوال جاری */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1">
        {currentQ ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* نوار سربرگ سوال */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">سوال شماره {currentIndex + 1}</span>
                {/* برچسب نوع سوال */}
                {(() => {
                  const b = getTypeBadge(currentQ.type);
                  return (
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${b.style}`}
                    >
                      {b.icon}
                      {b.label}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFlaggedQuestions((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                    flaggedQuestions[currentQ.id]
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? "نشان‌دار شده" : "نشان‌دار کردن"}</span>
                </button>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    currentQ.difficulty === "HARD"
                      ? "bg-rose-50 text-rose-700"
                      : currentQ.difficulty === "MEDIUM"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {currentQ.difficulty === "HARD"
                    ? "سخت"
                    : currentQ.difficulty === "MEDIUM"
                    ? "متوسط"
                    : "ساده"}
                </span>
              </div>
            </div>

            {/* متن سوال با فرمول KaTeX */}
            <div className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed">
              <KaTeXRenderer content={currentQ.content} />
            </div>

            {/* بخش پاسخگویی بسته به نوع سوال */}
            {/* ۱. سوال تستی چهارگزینه‌ای (MULTIPLE_CHOICE) */}
            {currentQ.type === "MULTIPLE_CHOICE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected =
                    answers[currentQ.id] === opt.id ||
                    answers[currentQ.id] === String(opt.orderIndex);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswerChange(currentQ.id, opt.id)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border text-right text-xs transition-all ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/70 text-rose-950 font-bold ring-2 ring-rose-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                          isSelected
                            ? "bg-rose-600 text-white"
                            : "bg-white border border-slate-300 text-slate-700"
                        }`}
                      >
                        {opt.orderIndex}
                      </span>
                      <div className="flex-1 mt-0.5 font-medium">
                        <KaTeXRenderer content={opt.optionText || opt.text || ""} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ۲. سوال صحیح / غلط (TRUE_FALSE) */}
            {currentQ.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleAnswerChange(currentQ.id, "true")}
                  className={`p-5 rounded-2xl border flex items-center justify-center gap-3 text-sm font-black transition ${
                    answers[currentQ.id] === "true" || answers[currentQ.id] === "صحیح"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30"
                      : "border-slate-200 hover:border-emerald-200 bg-slate-50/60 text-slate-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                      answers[currentQ.id] === "true" || answers[currentQ.id] === "صحیح"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    ✓
                  </div>
                  <span>صحیح (گزاره درست است)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnswerChange(currentQ.id, "false")}
                  className={`p-5 rounded-2xl border flex items-center justify-center gap-3 text-sm font-black transition ${
                    answers[currentQ.id] === "false" || answers[currentQ.id] === "غلط"
                      ? "border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/30"
                      : "border-slate-200 hover:border-rose-200 bg-slate-50/60 text-slate-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                      answers[currentQ.id] === "false" || answers[currentQ.id] === "غلط"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    ✗
                  </div>
                  <span>غلط (گزاره نادرست است)</span>
                </button>
              </div>
            )}

            {/* ۳. سوال جای‌خالی / کوتاه‌پاسخ (FILL_BLANK) */}
            {currentQ.type === "FILL_BLANK" && (
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  پاسخ یا عدد نهایی را در کادر زیر وارد کنید:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="مثال: ۶ یا عبارت نهایی..."
                    className="w-full p-4 rounded-2xl border-2 border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 bg-emerald-50/20 text-slate-900 font-bold text-sm outline-none transition"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                    <PenTool className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  💡 راهنما: عدد یا واژه کلیدی را به صورت دقیق و بدون کلمات اضافه وارد نمایید.
                </p>
              </div>
            )}

            {/* ۴. سوال تشریحی / بازپاسخ (DESCRIPTIVE) */}
            {currentQ.type === "DESCRIPTIVE" && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    پاسخ تشریحی و مراحل استدلال ریاضی:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {(answers[currentQ.id] || "").length} کاراکتر
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="پاسخ تشریحی، فرمول‌ها یا اثبات خود را اینجا بنویسید... (این بخش توسط دبیر محترم بررسی و نمره‌گذاری خواهد شد)"
                  className="w-full p-4 rounded-2xl border-2 border-amber-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 bg-amber-50/10 text-slate-900 text-xs leading-relaxed outline-none transition font-sans"
                />

                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    پاسخ تشریحی شما پس از اتمام آزمون به کارتابل دبیر ارسال و نمره آن به کارنامه افزوده خواهد شد.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">سوالی یافت نشد.</div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* ویجت نظارت و پایش پیشرفته هوش مصنوعی (AI & Media Proctoring HUD) */}
      {/* ===================================================================== */}
      {(antiCheat.enableWebcamProctoring || antiCheat.enableAudioMonitoring) && (
        <aside
          aria-label="پایش زنده وب‌کم و میکروفون"
          className={`fixed bottom-20 left-4 z-40 transition-all duration-300 rounded-2xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border ${
            faceStatus === "NORMAL"
              ? "border-emerald-500/50 shadow-emerald-950/20"
              : faceStatus === "LOOKING_AWAY"
              ? "border-amber-500/70 shadow-amber-950/30"
              : "border-rose-500 shadow-rose-950/40 animate-pulse"
          }`}
        >
          {proctoringMinimzed ? (
            <div className="flex items-center gap-2 p-2 px-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  faceStatus === "NORMAL"
                    ? "bg-emerald-400"
                    : faceStatus === "LOOKING_AWAY"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-[11px] font-bold">پایش هوشمند</span>
              <button
                type="button"
                onClick={() => setProctoringMinimized(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="بزرگ‌نمایی"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3 w-56 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full animate-ping ${
                      faceStatus === "NORMAL"
                        ? "bg-emerald-400"
                        : faceStatus === "LOOKING_AWAY"
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                  />
                  <span>پایش زنده هوش مصنوعی</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProctoringMinimized(true)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="کوچک‌نمایی"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>

              {/* کادر ویدیو وب‌کم */}
              {antiCheat.enableWebcamProctoring && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {/* برچسب وضعیت چهره بر روی تصویر */}
                  <div className="absolute bottom-1 right-1 left-1">
                    <span
                      className={`block text-[9px] font-bold px-2 py-0.5 rounded-md text-center backdrop-blur-md ${
                        faceStatus === "NORMAL"
                          ? "bg-emerald-600/80 text-white"
                          : faceStatus === "LOOKING_AWAY"
                          ? "bg-amber-600/90 text-white"
                          : "bg-rose-600/90 text-white"
                      }`}
                    >
                      {faceStatus === "NORMAL" && "✓ چهره در کادر (امن)"}
                      {faceStatus === "LOOKING_AWAY" && "⚠ انحراف زاویه نگاه"}
                      {faceStatus === "NO_FACE" && "✕ عدم حضور چهره"}
                      {faceStatus === "MULTIPLE_FACES" && "⛔ تشخیص فرد دوم"}
                    </span>
                  </div>
                </div>
              )}

              {/* سنجش صدای محیط و میکروفون */}
              {antiCheat.enableAudioMonitoring && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      صدای محیط:
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        audioLevel > 45 ? "text-rose-400 font-black" : "text-emerald-400"
                      }`}
                    >
                      {audioLevel}٪
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        audioLevel > 45 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}

              {/* نشانگر قفل نشست همزمان */}
              {antiCheat.blockConcurrentLogin && (
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>نشست ایمن:</span>
                  <span className="text-emerald-400 font-mono">تک‌کاربره فعال</span>
                </div>
              )}
            </div>
          )}
        </aside>
      )}

      {/* نوار ناوبری پایینی بین سوالات */}
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          disabled={currentIndex === 0 || antiCheat.isSequential}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
          سوال قبلی
        </button>

        {/* لیست شماره سوالات به صورت حباب‌های کلیک‌پذیر */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-md px-2">
          {examQuestions.map((q, idx) => {
            const isAns =
              answers[q.id] !== undefined &&
              answers[q.id] !== null &&
              String(answers[q.id]).trim() !== "";
            const isCur = idx === currentIndex;
            const isFlg = flaggedQuestions[q.id];

            let badgeStyle = "bg-slate-100 text-slate-600";
            if (isAns) badgeStyle = "bg-emerald-600 text-white font-black";
            if (isCur) badgeStyle = "ring-2 ring-rose-500 font-black";
            if (isFlg) badgeStyle = "bg-amber-400 text-amber-950 font-black";

            return (
              <button
                key={q.id}
                type="button"
                disabled={antiCheat.isSequential && idx < currentIndex}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition shrink-0 ${badgeStyle} ${
                  antiCheat.isSequential && idx < currentIndex ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentIndex + 1 >= examQuestions.length}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40"
        >
          سوال بعدی
          <ChevronLeft className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
