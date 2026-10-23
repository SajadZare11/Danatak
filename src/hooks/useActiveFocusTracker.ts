"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type FocusStatus = "ACTIVE" | "IDLE_TAB_HIDDEN" | "IDLE_NO_INPUT";

interface UseActiveFocusTrackerProps {
  studentId?: string;
  studyPackId?: string;
  topicTag?: string;
  idleThresholdSeconds?: number; // پیش‌فرض: ۳۰ ثانیه
  heartbeatIntervalSeconds?: number; // پیش‌فرض: ۱۵ ثانیه
}

export function useActiveFocusTracker({
  studentId,
  studyPackId,
  topicTag = "عمومی",
  idleThresholdSeconds = 30,
  heartbeatIntervalSeconds = 15,
}: UseActiveFocusTrackerProps) {
  const [status, setStatus] = useState<FocusStatus>("ACTIVE");
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);

  const lastActivityRef = useRef<number>(Date.now());
  const pendingActiveRef = useRef<number>(0);
  const pendingIdleRef = useRef<number>(0);
  const statusRef = useRef<FocusStatus>("ACTIVE");

  statusRef.current = status;

  // ارسال داده‌های دورسنجی به سرور (Heartbeat)
  const sendHeartbeat = useCallback(
    async (eventType: string = "active_heartbeat") => {
      const activeDelta = pendingActiveRef.current;
      const idleDelta = pendingIdleRef.current;

      if (!studentId || (activeDelta === 0 && idleDelta === 0)) return;

      pendingActiveRef.current = 0;
      pendingIdleRef.current = 0;

      try {
        await fetch("/api/study-studio/telemetry/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            studyPackId,
            topicTag,
            activeDurationSeconds: activeDelta,
            idleDurationSeconds: idleDelta,
            eventType,
          }),
        });
      } catch (err) {
        console.error("Telemetry heartbeat failed:", err);
      }
    },
    [studentId, studyPackId, topicTag]
  );

  // پایش رویدادهای کاربر برای تشخیص بی‌حرکتی (۳۰ ثانیه بدون ورودی)
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // اگر به دلیل عدم ورودی در حالت غیرفعال بودیم، به حالت فعال بازگردیم
    if (statusRef.current === "IDLE_NO_INPUT" && !document.hidden) {
      setStatus("ACTIVE");
    }
  }, []);

  useEffect(() => {
    // ۱. پایش Page Visibility API (خروج از برگه یا Minimize کردن مرورگر)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStatus("IDLE_TAB_HIDDEN");
        sendHeartbeat("tab_hidden");
      } else {
        lastActivityRef.current = Date.now();
        setStatus("ACTIVE");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ۲. شنود رویدادهای تعامل کاربر (ماوس، کیبورد، تاچ، اسکرول)
    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // ۳. تایمر ثانیه‌شمار برای تفکیک دقیق زمان فعال و غیرفعال
    const secondTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = (now - lastActivityRef.current) / 1000;

      if (document.hidden) {
        if (statusRef.current !== "IDLE_TAB_HIDDEN") {
          setStatus("IDLE_TAB_HIDDEN");
        }
        setIdleSeconds((prev) => prev + 1);
        pendingIdleRef.current += 1;
      } else if (timeSinceLastActivity >= idleThresholdSeconds) {
        if (statusRef.current !== "IDLE_NO_INPUT") {
          setStatus("IDLE_NO_INPUT");
        }
        setIdleSeconds((prev) => prev + 1);
        pendingIdleRef.current += 1;
      } else {
        if (statusRef.current !== "ACTIVE") {
          setStatus("ACTIVE");
        }
        setActiveSeconds((prev) => prev + 1);
        pendingActiveRef.current += 1;
      }
    }, 1000);

    // ۴. تایمر ضربان قلب دورسنجی (Heartbeat) هر ۱۵ ثانیه
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat("active_heartbeat");
    }, heartbeatIntervalSeconds * 1000);

    // ۵. ارسال نهایی در هنگام خروج از صفحه
    const handleBeforeUnload = () => {
      sendHeartbeat("session_end");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(secondTimer);
      clearInterval(heartbeatTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendHeartbeat("session_end");
    };
  }, [idleThresholdSeconds, heartbeatIntervalSeconds, handleUserActivity, sendHeartbeat]);

  const totalTime = activeSeconds + idleSeconds;
  const focusRatio = totalTime > 0 ? Math.round((activeSeconds / totalTime) * 100) : 100;

  return {
    status,
    isActive: status === "ACTIVE",
    activeSeconds,
    idleSeconds,
    focusRatio,
    sendHeartbeat,
  };
}
