import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tuitionId, installmentNumber } = body as {
      tuitionId: string;
      installmentNumber: number;
    };

    if (!tuitionId || installmentNumber === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const tuition = await prisma.tuitionRecord.findUnique({
      where: { id: tuitionId },
      include: {
        student: true,
      },
    });

    if (!tuition) {
      return NextResponse.json({ error: "Tuition record not found" }, { status: 404 });
    }

    let plan: any[] = [];
    try {
      plan = JSON.parse(tuition.planJson || "[]");
    } catch {
      plan = [];
    }

    const installment = plan.find((p: any) => p.installmentNumber === installmentNumber);
    if (!installment) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    if (installment.status === "PAID") {
      return NextResponse.json({ error: "این قسط قبلاً پرداخت شده است." }, { status: 400 });
    }

    // صدور شماره پیگیری شتابی
    const trackingCode = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowFa = new Date().toLocaleDateString("fa-IR");

    installment.status = "PAID";
    installment.trackingCode = trackingCode;
    installment.paymentDate = nowFa;

    const newPaidAmount = tuition.paidAmount + installment.amount;
    const newStatus = newPaidAmount >= tuition.totalAmount ? "تسویه" : "جاری";

    await prisma.tuitionRecord.update({
      where: { id: tuition.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        planJson: JSON.stringify(plan),
      },
    });

    // ثبت پیامک تایید پرداخت برای ولی
    await prisma.smsLog.create({
      data: {
        recipientPhone: tuition.student.phoneNumber || "09127777777",
        recipientName: `ولی محترم ${tuition.student.fullName}`,
        studentId: tuition.student.id,
        type: "TUITION_PAYMENT",
        message: `دبیرستان علامه حلی ۱: پرداخت قسط به مبلغ ${installment.amount.toLocaleString(
          "fa-IR"
        )} تومان با کد پیگیری ${trackingCode} با موفقیت ثبت و تایید گردید.`,
        status: "DELIVERED",
        providerRef: `MAGFA-${Math.floor(10000 + Math.random() * 90000)}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "پرداخت با موفقیت انجام شد و رسید دیجیتال صادر گردید.",
      receipt: {
        trackingCode,
        amount: installment.amount,
        title: installment.title,
        paymentDate: nowFa,
        studentName: tuition.student.fullName,
        newRemainingAmount: Math.max(0, tuition.totalAmount - newPaidAmount),
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/parent/pay:", error);
    return NextResponse.json({ error: error.message || "Payment processing failed" }, { status: 500 });
  }
}
