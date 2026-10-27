import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import { RoleSwitcherBar } from "@/components/common/RoleSwitcherBar";
import { PwaRegistration } from "@/components/common/PwaRegistration";

export const viewport: Viewport = {
  themeColor: "#4338ca",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "داناتک | سامانه هوشمند تسلط و ارتقای تحصیلی",
  description: "داناتک؛ پلتفرم جامع یادگیری شخصی‌سازی‌شده، رادار تسلط و ارتقای تحصیلی دانش‌آموزان منطبق با آموزش و پرورش ایران",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "داناتک",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192" },
      { url: "/icons/icon-512.svg", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-vazir">
        <RoleProvider>
          <PwaRegistration />
          <RoleSwitcherBar />
          <main className="min-h-[calc(100vh-56px)]">{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
