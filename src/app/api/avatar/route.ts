import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "کاربر";
  const bg = searchParams.get("bg") || "4f46e5";
  const fg = searchParams.get("fg") || "ffffff";

  const initial = name.trim().charAt(0) || "ک";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <defs>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#${bg}" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="url(#avatarGrad)" />
    <circle cx="64" cy="64" r="50" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.25" />
    <text x="64" y="78" font-family="Tahoma, Arial, sans-serif" font-size="44" font-weight="900" fill="#${fg}" text-anchor="middle">
      ${initial}
    </text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
