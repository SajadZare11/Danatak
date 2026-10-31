import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// انبار درون‌حافظه‌ای نشست‌های فعال آزمون‌ها
// ساختار کلید: `${examId}:${studentId}`
interface ActiveSession {
  examId: string;
  studentId: string;
  sessionId: string;
  clientIp: string;
  userAgent: string;
  startedAt: number;
  lastHeartbeatAt: number;
}

// نگهداری سراسری نشست‌های فعال در محیط Node.js / Next.js
const globalSessions = globalThis as unknown as {
  _examActiveSessions?: Map<string, ActiveSession>;
};

if (!globalSessions._examActiveSessions) {
  globalSessions._examActiveSessions = new Map<string, ActiveSession>();
}

const activeSessions = globalSessions._examActiveSessions;

// استخراج IP کلاینت از هدرها
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

// تمیزکاری نشست‌های منقضی‌شده (نشست‌هایی که بیش از ۳۰ ثانیه تپش قلب نداشته‌اند)
function cleanupStaleSessions() {
  const now = Date.now();
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastHeartbeatAt > 35000) {
      activeSessions.delete(key);
    }
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await req.json();
    const { action, studentId, sessionId } = body;

    if (!examId || !studentId || !sessionId) {
      return NextResponse.json(
        { error: "پارامترهای جلسه آزمون ناقص است" },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const sessionKey = `${examId}:${studentId}`;

    cleanupStaleSessions();

    const existingSession = activeSessions.get(sessionKey);
    const now = Date.now();

    // ۱. شروع یا ثبت نشست اولیه
    if (action === "start") {
      // اگر نشستی از قبل وجود دارد، فعال است و شناسه آن با شناسه جدید متفاوت است
      if (
        existingSession &&
        existingSession.sessionId !== sessionId &&
        now - existingSession.lastHeartbeatAt < 25000
      ) {
        return NextResponse.json({
          success: false,
          blocked: true,
          reason: `نشست همزمان فعال دیگری برای این حساب کاربری شناسایی شد (IP قبلی: ${existingSession.clientIp}). ورود همزمان از چند مرورگر یا دستگاه غیرمجاز است.`,
          clientIp,
          activeSince: new Date(existingSession.startedAt).toLocaleTimeString("fa-IR"),
        });
      }

      // ثبت نشست جاری
      activeSessions.set(sessionKey, {
        examId,
        studentId,
        sessionId,
        clientIp,
        userAgent,
        startedAt: now,
        lastHeartbeatAt: now,
      });

      return NextResponse.json({
        success: true,
        blocked: false,
        clientIp,
        registeredAt: now,
      });
    }

    // ۲. پالس تپش قلب دوره‌ای (Heartbeat)
    if (action === "heartbeat") {
      // اگر نشستی برای کاربر ثبت نشده باشد (احتمالاً به دلیل ریست سرور یا تایم‌اوت)، مجدداً ثبت می‌کنیم
      if (!existingSession) {
        activeSessions.set(sessionKey, {
          examId,
          studentId,
          sessionId,
          clientIp,
          userAgent,
          startedAt: now,
          lastHeartbeatAt: now,
        });

        return NextResponse.json({
          success: true,
          status: "RE_REGISTERED",
          clientIp,
        });
      }

      // اگر نشست دیگری با شناسه دیگر جایگزین شده یا وارد شده باشد:
      if (existingSession.sessionId !== sessionId) {
        return NextResponse.json({
          success: false,
          blocked: true,
          reason: "نشست شما به دلیل ورود همزمان از دستگاه یا تب دیگری با این حساب کاربری متوقف شد.",
          clientIp,
        });
      }

      // بررسی تطبیق IP در صورتی که IP کاربر تغییر فاحش کرده باشد (مثلاً سوئیچ به VPN یا پروکسی)
      const ipChanged = existingSession.clientIp !== clientIp;
      if (ipChanged) {
        // بروزرسانی IP ولی می‌توان اخطار صادر کرد
        existingSession.clientIp = clientIp;
      }

      existingSession.lastHeartbeatAt = now;
      return NextResponse.json({
        success: true,
        status: "ACTIVE",
        ipWarning: ipChanged ? "تغییر آدرس IP در حین آزمون ثبت گردید." : null,
      });
    }

    // ۳. پایان آزمون و خروج (End Session)
    if (action === "end") {
      if (existingSession && existingSession.sessionId === sessionId) {
        activeSessions.delete(sessionKey);
      }
      return NextResponse.json({ success: true, message: "نشست با موفقیت خاتمه یافت" });
    }

    return NextResponse.json({ error: "اکشن نامعتبر است" }, { status: 400 });
  } catch (error) {
    console.error("Exam Session API error:", error);
    return NextResponse.json(
      { error: "خطا در مدیریت نشست ضدتقلب" },
      { status: 500 }
    );
  }
}
