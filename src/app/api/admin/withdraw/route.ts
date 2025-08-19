import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { withdrawId, action } = await req.json(); // APPROVE | REJECT
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawId } });

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid withdrawal" }, { status: 400 });
    }

    let updated;
    if (action === "APPROVE") {
      updated = await prisma.withdrawal.update({
        where: { id: withdrawId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });

      // Deduct balance
      await prisma.wallet.update({
        where: { userId: withdrawal.userId },
        data: { mainBalance: { decrement: withdrawal.amount } },
      });
    } else {
      updated = await prisma.withdrawal.update({
        where: { id: withdrawId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ message: `Withdrawal ${action}`, updated });
  } catch (err) {
    console.error("Admin withdraw error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
