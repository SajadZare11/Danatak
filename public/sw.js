// Service Worker for Danatak Smart School LMS (PWA)
const CACHE_NAME = "danatak-v1";
const OFFLINE_URL = "/";

const STATIC_ASSETS = [
  "/",
  "/teacher",
  "/student",
  "/principal",
  "/counselor",
  "/parent",
  "/mastery",
  "/questions",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
];

// Install Event: پیش‌کش کردن دارایی‌های اصلی
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA ServiceWorker] Pre-caching offline app shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: پاک‌سازی نسخه‌های قدیمی کش
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: راهبرد ترکیبی بهینه‌شده
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // نادیده گرفتن درخواست‌های غیر GET
  if (request.method !== "GET") return;

  // ۱. برای فایل‌های استاتیک نکست و آیکون‌ها: Cache First
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // ۲. برای صفحات و APIها: Network First با Fallback به Cache در صورت قطعی اینترنت
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // ذخیره نسخه تازه در کش در صورت پاسخ معتبر
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // در صورت قطع اینترنت (آفلاین)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // اگر درخواست صفحه بود، صفحه اصلی را برگردان
        if (request.mode === "navigate") {
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
        }

        return new Response("ارتباط با سرور برقرار نشد (حالت آفلاین)", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
