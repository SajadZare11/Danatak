"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, WifiOff, Check } from "lucide-react";

export const PwaRegistration: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // ۱. ثبت Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // ۲. شنود وضعیت اتصال شبکه (آنلاین / آفلاین)
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // ۳. شنود رویداد قبل از نصب PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // نمایش بنر نصب اگر کاربر قبلا رد نکرده باشد
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // ۴. شنود رویداد نصب موفق
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App successfully installed!");
      setShowInstallBanner(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  return (
    <>
      {/* نشانگر حالت آفلاین */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-3.5 h-3.5" />
          ارتباط اینترنتی قطع است — حالت آفلاین PWA فعال بوده و اطلاعات از حافظه دستگاه فراخوانی می‌شود.
        </div>
      )}

      {/* بنر هوشمند نصب اپلیکیشن PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-50 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black tracking-tight">نصب اپلیکیشن داناتک (PWA)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                دسترسی سریع، باز شدن تمام‌صفحه و عملکرد آفلاین روی موبایل و رایانه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              نصب
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* پیام تایید نصب موفق */}
      {installedSuccess && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <Check className="w-4 h-4" />
          اپلیکیشن داناتک با موفقیت روی دستگاه شما نصب گردید.
        </div>
      )}
    </>
  );
};
