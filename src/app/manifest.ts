import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "داناتک؛ سامانه هوشمند تسلط و ارتقای تحصیلی",
    short_name: "داناتک",
    description: "داناتک؛ پلتفرم جامع یادگیری شخصی‌سازی‌شده، رادار تسلط و ارتقای تحصیلی دانش‌آموزان منطبق با آموزش و پرورش ایران",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4338ca",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
