import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USERS, UserRole } from "@/types";

export async function POST(req: Request) {
  try {
    const { nationalId, password } = await req.json();

    if (!nationalId || !password) {
      return NextResponse.json(
        { error: "لطفاً کد ملی و رمز عبور را وارد فرمایید." },
        { status: 400 }
      );
    }

    // بررسی کدملی در پایگاه داده
    const dbUser = await prisma.user.findUnique({
      where: { nationalId: nationalId.trim() },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "کاربری با این کد ملی در سامانه داناتک یافت نشد." },
        { status: 404 }
      );
    }

    // تایید رمز عبور (در حالت دمو و لوکال رمز پیش‌فرض demo1234 یا 123456 یا تطابق با دیتابیس)
    const validPasswords = ["demo1234", "123456", dbUser.passwordHash];
    if (!validPasswords.includes(password.trim())) {
      return NextResponse.json(
        { error: "رمز عبور وارد شده نادرست است." },
        { status: 401 }
      );
    }

    // تطابق مشخصات نقش
    const role = dbUser.role as UserRole;
    const fallbackUser = DEMO_USERS[role] || DEMO_USERS.STUDENT;

    const authPayload = {
      id: dbUser.id,
      nationalId: dbUser.nationalId,
      fullName: dbUser.fullName,
      role: dbUser.role,
      roleTitleFa: fallbackUser.roleTitleFa,
      avatarUrl: dbUser.avatarUrl || fallbackUser.avatarUrl,
      schoolName: fallbackUser.schoolName,
      targetRoute:
        role === "TEACHER"
          ? "/teacher"
          : role === "PRINCIPAL"
          ? "/principal"
          : role === "COUNSELOR"
          ? "/counselor"
          : role === "PARENT"
          ? "/parent"
          : "/student",
    };

    return NextResponse.json({
      success: true,
      user: authPayload,
      message: `ورود موفقیت‌آمیز، درود بر شما ${dbUser.fullName}`,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش احراز هویت سرور." },
      { status: 500 }
    );
  }
}
