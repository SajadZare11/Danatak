"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen,
  Highlighter,
  Eraser,
  Minus,
  Square,
  Circle,
  Triangle,
  Grid,
  Sparkles,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Image as ImageIcon,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Type,
  Maximize2,
  Compass,
} from "lucide-react";
import { KaTeXEquationModal } from "./KaTeXEquationModal";
import { KaTeXRenderer } from "@/components/common/KaTeXRenderer";

export type BoardTool =
  | "pen"
  | "highlighter"
  | "eraser"
  | "line"
  | "rect"
  | "circle"
  | "triangle"
  | "coords"
  | "text";

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: "stroke" | "line" | "rect" | "circle" | "triangle" | "coords" | "text";
  tool: BoardTool;
  color: string;
  width: number;
  points?: Point[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
}

export interface KaTeXElement {
  id: string;
  latex: string;
  x: number;
  y: number;
}

export interface BoardSlide {
  id: string;
  name: string;
  elements: BoardElement[];
  katexElements: KaTeXElement[];
  bgImage?: string;
}

interface InteractiveWhiteboardProps {
  sessionId: string;
  canDraw?: boolean;
  onSaveSnapshot?: (snapshotJson: string) => void;
}

export const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({
  sessionId,
  canDraw = true,
  onSaveSnapshot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // وضعیت اسلایدها و تخته
  const [slides, setSlides] = useState<BoardSlide[]>([
    { id: "slide-1", name: "اسلاید ۱: مبانی و تعاریف", elements: [], katexElements: [] },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // ابزارها و رنگ‌ها
  const [currentTool, setCurrentTool] = useState<BoardTool>("pen");
  const [currentColor, setCurrentColor] = useState<string>("#facc15"); // زرد نئونی مناسب تخته تیره
  const [currentWidth, setCurrentWidth] = useState<number>(3);
  const [bgStyle, setBgStyle] = useState<"dark" | "green" | "white">("dark");
  const [gridType, setGridType] = useState<"none" | "grid" | "dots">("grid");

  // وضعیت فرمول و ورودی‌ها
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");

  // آندو / ریدو
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);

  // متغیرهای موقت رسم
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const startPosRef = useRef<Point>({ x: 0, y: 0 });

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const colorPalette = [
    { color: "#ffffff", label: "گچ سفید" },
    { color: "#facc15", label: "زرد نئونی" },
    { color: "#38bdf8", label: "آبی فیروزه‌ای" },
    { color: "#4ade80", label: "سبز لیمویی" },
    { color: "#f87171", label: "قرمز روشن" },
    { color: "#fb923c", label: "نارنجی" },
    { color: "#c084fc", label: "بنفش" },
  ];

  // محاسبه مختصات دقیق ماوس نسبت به رزولوشن Canvas
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // بازترسیم کامل بوم نقاشی
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ۱. پاکسازی پس‌زمینه
    const bgColor =
      bgStyle === "dark" ? "#0f172a" : bgStyle === "green" ? "#064e3b" : "#f8fafc";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ۲. رسم خطوط شطرنجی یا نقطه‌ای
    if (gridType === "grid") {
      ctx.strokeStyle = bgStyle === "white" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (gridType === "dots") {
      ctx.fillStyle = bgStyle === "white" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)";
      const step = 32;
      for (let x = step / 2; x < canvas.width; x += step) {
        for (let y = step / 2; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ۳. رسم المان‌های ذخیره‌شده روی اسلاید
    currentSlide.elements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.tool === "highlighter") {
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (el.type === "stroke" && el.points && el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === "line" && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.type === "rect" && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
      } else if (el.type === "circle" && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        const radius = Math.sqrt(Math.pow(el.x2 - el.x1, 2) + Math.pow(el.y2 - el.y1, 2));
        ctx.beginPath();
        ctx.arc(el.x1, el.y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === "triangle" && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y2);
        ctx.lineTo((el.x1 + el.x2) / 2, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.closePath();
        ctx.stroke();
      } else if (el.type === "coords" && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
        // رسم دستگاه مختصات دو بعدی دکارتی با فلش محورها
        const cx = (el.x1 + el.x2) / 2;
        const cy = (el.y1 + el.y2) / 2;
        ctx.beginPath();
        // محور x
        ctx.moveTo(el.x1, cy);
        ctx.lineTo(el.x2, cy);
        // محور y
        ctx.moveTo(cx, el.y2);
        ctx.lineTo(cx, el.y1);
        ctx.stroke();

        // فلش محور X
        ctx.beginPath();
        ctx.moveTo(el.x2 - 8, cy - 5);
        ctx.lineTo(el.x2, cy);
        ctx.lineTo(el.x2 - 8, cy + 5);
        ctx.stroke();

        // فلش محور Y
        ctx.beginPath();
        ctx.moveTo(cx - 5, el.y1 + 8);
        ctx.lineTo(cx, el.y1);
        ctx.lineTo(cx + 5, el.y1 + 8);
        ctx.stroke();
      } else if (el.type === "text" && el.x1 !== undefined && el.y1 !== undefined && el.text) {
        ctx.font = `${el.width * 5}px Vazirmatn, sans-serif`;
        ctx.fillText(el.text, el.x1, el.y1);
      }

      ctx.globalAlpha = 1.0;
    });
  }, [bgStyle, gridType, currentSlide]);

  // انطباق رزولوشن هنگام تغییر سایز پنجره
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [currentSlide, bgStyle, gridType, redrawCanvas]);

  // شروع رسم با ماوس یا لمس
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    startPosRef.current = pos;

    if (currentTool === "text") {
      setTextInputPos(pos);
      return;
    }

    if (currentTool === "pen" || currentTool === "highlighter" || currentTool === "eraser") {
      currentStrokeRef.current = [pos];
    }
  };

  // حرکت ماوس
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return;
    const pos = getCanvasCoords(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (currentTool === "pen" || currentTool === "highlighter" || currentTool === "eraser") {
      currentStrokeRef.current.push(pos);

      ctx.strokeStyle =
        currentTool === "eraser"
          ? bgStyle === "dark"
            ? "#0f172a"
            : bgStyle === "green"
            ? "#064e3b"
            : "#f8fafc"
          : currentColor;
      ctx.lineWidth = currentTool === "eraser" ? currentWidth * 5 : currentWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = currentTool === "highlighter" ? 0.35 : 1.0;

      const pts = currentStrokeRef.current;
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    } else {
      // برای اشکال هندسی، بوم پاکسازی و شکل در حال رسم نمایش داده می‌شود
      redrawCanvas();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
      ctx.lineCap = "round";

      const start = startPosRef.current;
      if (currentTool === "line") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (currentTool === "rect") {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      } else if (currentTool === "circle") {
        const radius = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentTool === "triangle") {
        ctx.beginPath();
        ctx.moveTo(start.x, pos.y);
        ctx.lineTo((start.x + pos.x) / 2, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.closePath();
        ctx.stroke();
      } else if (currentTool === "coords") {
        const cx = (start.x + pos.x) / 2;
        const cy = (start.y + pos.y) / 2;
        ctx.beginPath();
        ctx.moveTo(start.x, cy);
        ctx.lineTo(pos.x, cy);
        ctx.moveTo(cx, pos.y);
        ctx.lineTo(cx, start.y);
        ctx.stroke();
      }
    }
  };

  // پایان رسم
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return;
    setIsDrawing(false);
    const endPos = getCanvasCoords(e);
    const startPos = startPosRef.current;

    let newElement: BoardElement | null = null;
    const id = "elem-" + Date.now();

    if (currentTool === "pen" || currentTool === "highlighter" || currentTool === "eraser") {
      if (currentStrokeRef.current.length > 0) {
        newElement = {
          id,
          type: "stroke",
          tool: currentTool,
          color:
            currentTool === "eraser"
              ? bgStyle === "dark"
                ? "#0f172a"
                : bgStyle === "green"
                ? "#064e3b"
                : "#f8fafc"
              : currentColor,
          width: currentTool === "eraser" ? currentWidth * 5 : currentWidth,
          points: [...currentStrokeRef.current],
        };
      }
      currentStrokeRef.current = [];
    } else if (currentTool === "line") {
      newElement = { id, type: "line", tool: currentTool, color: currentColor, width: currentWidth, x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
    } else if (currentTool === "rect") {
      newElement = { id, type: "rect", tool: currentTool, color: currentColor, width: currentWidth, x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
    } else if (currentTool === "circle") {
      newElement = { id, type: "circle", tool: currentTool, color: currentColor, width: currentWidth, x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
    } else if (currentTool === "triangle") {
      newElement = { id, type: "triangle", tool: currentTool, color: currentColor, width: currentWidth, x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
    } else if (currentTool === "coords") {
      newElement = { id, type: "coords", tool: currentTool, color: currentColor, width: currentWidth, x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y };
    }

    if (newElement) {
      setUndoStack((prev) => [...prev, currentSlide.elements]);
      setRedoStack([]);

      const updatedElements = [...currentSlide.elements, newElement];
      updateCurrentSlideElements(updatedElements);
    }
  };

  const updateCurrentSlideElements = (newElements: BoardElement[]) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentSlideIndex ? { ...s, elements: newElements } : s))
    );
  };

  // ثبت متن روی تخته
  const handleConfirmText = () => {
    if (textInputPos && textValue.trim()) {
      const newElem: BoardElement = {
        id: "text-" + Date.now(),
        type: "text",
        tool: "text",
        color: currentColor,
        width: currentWidth,
        x1: textInputPos.x,
        y1: textInputPos.y,
        text: textValue.trim(),
      };
      setUndoStack((prev) => [...prev, currentSlide.elements]);
      updateCurrentSlideElements([...currentSlide.elements, newElem]);
    }
    setTextInputPos(null);
    setTextValue("");
  };

  // اضافه کردن فرمول KaTeX به اسلاید
  const handleInsertKaTeX = (latexCode: string) => {
    const newK: KaTeXElement = {
      id: "katex-" + Date.now(),
      latex: latexCode,
      x: 60,
      y: 60 + currentSlide.katexElements.length * 70,
    };

    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentSlideIndex
          ? { ...s, katexElements: [...s.katexElements, newK] }
          : s
      )
    );
  };

  // حذف فرمول KaTeX
  const handleDeleteKaTeX = (katexId: string) => {
    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentSlideIndex
          ? { ...s, katexElements: s.katexElements.filter((k) => k.id !== katexId) }
          : s
      )
    );
  };

  // آندو (Undo)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevElements = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, currentSlide.elements]);
    setUndoStack((prev) => prev.slice(0, -1));
    updateCurrentSlideElements(prevElements);
  };

  // ریدو (Redo)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextElements = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, currentSlide.elements]);
    setRedoStack((prev) => prev.slice(0, -1));
    updateCurrentSlideElements(nextElements);
  };

  // پاک‌کردن کل تخته
  const handleClearBoard = () => {
    if (confirm("آیا از پاک کردن کامل محتوای این اسلاید اطمینان دارید؟")) {
      setUndoStack((prev) => [...prev, currentSlide.elements]);
      updateCurrentSlideElements([]);
      setSlides((prev) =>
        prev.map((s, idx) =>
          idx === currentSlideIndex ? { ...s, katexElements: [] } : s
        )
      );
    }
  };

  // ایجاد اسلاید جدید
  const handleAddNewSlide = () => {
    const newSlide: BoardSlide = {
      id: "slide-" + (slides.length + 1),
      name: `اسلاید ${slides.length + 1}: حل مسئله`,
      elements: [],
      katexElements: [],
    };
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  // دانلود تصویر تخته به صورت فایل تصویری PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${sessionId}-slide-${currentSlideIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 relative select-none">
      {/* نوار ابزار بالای تخته‌سیاه (Tools Ribbon) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* ۱. ابزارهای رسم قلم و اشکال هندسی */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("pen")}
            className={`p-2 rounded-xl transition ${
              currentTool === "pen"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="قلم معمولی"
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("highlighter")}
            className={`p-2 rounded-xl transition ${
              currentTool === "highlighter"
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="هایلایتر فسفری"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("eraser")}
            className={`p-2 rounded-xl transition ${
              currentTool === "eraser"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="پاک‌کن تخته"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1" />

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("line")}
            className={`p-2 rounded-xl transition ${
              currentTool === "line" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="خط مستقیم"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("rect")}
            className={`p-2 rounded-xl transition ${
              currentTool === "rect" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="مستطیل / کادر"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("circle")}
            className={`p-2 rounded-xl transition ${
              currentTool === "circle" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="دایره و بیضی"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("triangle")}
            className={`p-2 rounded-xl transition ${
              currentTool === "triangle" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="مثلث هندسی"
          >
            <Triangle className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("coords")}
            className={`p-2 rounded-xl transition ${
              currentTool === "coords" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="دستگاه مختصات ۲ بعدی دکارتی (X-Y)"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setCurrentTool("text")}
            className={`p-2 rounded-xl transition ${
              currentTool === "text" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="درج متن تایپی"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* دکمه اختصاصی درج فرمول ریاضی با KaTeX */}
          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setIsEquationModalOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
            title="درج فرمول KaTeX"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>فرمول KaTeX</span>
          </button>
        </div>

        {/* ۲. پالت رنگ‌های تخته‌سیاه و ضخامت قلم */}
        {canDraw && (
          <div className="flex items-center gap-3">
            {/* انتخاب رنگ */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {colorPalette.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setCurrentColor(p.color)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    currentColor === p.color ? "border-white scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.label}
                />
              ))}
            </div>

            {/* ضخامت قلم */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setCurrentWidth(w)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-[11px] transition ${
                    currentWidth === w ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ۳. اکشن‌های مدیریت اسلاید، آندو و اکسپورت */}
        <div className="flex items-center gap-1.5">
          {canDraw && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-30"
                title="بازگردانی (Undo)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-30"
                title="تکرار (Redo)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClearBoard}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                title="پاک کردن کل تخته"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* استایل پس‌زمینه تخته */}
          <select
            value={bgStyle}
            onChange={(e: any) => setBgStyle(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-[11px] px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="dark">تخته تیره (Slate)</option>
            <option value="green">تخته سبز سنتی</option>
            <option value="white">وایت‌برد سفید</option>
          </select>

          {/* دانلود تصویر اسلاید */}
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="دانلود تصویر اسلاید (PNG)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ناحیه تعاملی ترسیم بوم (Canvas Container) */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 block w-full h-full"
        />

        {/* جعبه‌های فرمول KaTeX درج‌شده روی بوم */}
        {currentSlide.katexElements.map((katex) => (
          <div
            key={katex.id}
            style={{ left: katex.x, top: katex.y }}
            className="absolute z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-indigo-400/50 shadow-xl text-white group animate-in fade-in select-none"
          >
            {canDraw && (
              <button
                type="button"
                onClick={() => handleDeleteKaTeX(katex.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-sm"
                title="حذف فرمول"
              >
                ×
              </button>
            )}
            <div className="text-sm font-mono overflow-x-auto">
              <KaTeXRenderer content={`$$${katex.latex}$$`} />
            </div>
          </div>
        ))}

        {/* فیلد ورودی متن در صورت کلیک روی صفحه با ابزار متن */}
        {textInputPos && (
          <div
            style={{ left: textInputPos.x, top: textInputPos.y }}
            className="absolute z-30 flex items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-indigo-500 shadow-2xl"
          >
            <input
              type="text"
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmText();
                if (e.key === "Escape") setTextInputPos(null);
              }}
              placeholder="متن یادداشت..."
              className="bg-transparent text-white text-xs border-none outline-hidden px-2 w-48"
            />
            <button
              type="button"
              onClick={handleConfirmText}
              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold"
            >
              ثبت
            </button>
          </div>
        )}
      </div>

      {/* نوار پایین: مدیریت ورق زدن اسلایدها (Slide Navigation Dock) */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-xs">{currentSlide.name}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            (صفحه {currentSlideIndex + 1} از {slides.length})
          </span>
        </div>

        {/* دکمه‌های اسلاید بعد و قبل */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentSlideIndex === 0}
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-30"
            title="اسلاید قبلی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold px-2">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          <button
            type="button"
            disabled={currentSlideIndex === slides.length - 1}
            onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-30"
            title="اسلاید بعدی"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {canDraw && (
            <button
              type="button"
              onClick={handleAddNewSlide}
              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm mr-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>اسلاید جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* مدال درج کدهای KaTeX */}
      <KaTeXEquationModal
        isOpen={isEquationModalOpen}
        onClose={() => setIsEquationModalOpen(false)}
        onInsert={handleInsertKaTeX}
      />
    </div>
  );
};
