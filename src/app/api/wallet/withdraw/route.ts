import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const userId = req.headers.get("x-user-id");

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // Check balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.mainBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Create withdrawal request
    const withdraw = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        status: "PENDING",
      },
    });

    // Log transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: "WITHDRAW",
        amount,
        meta: { withdrawalId: withdraw.id, status: "PENDING" },
      },
    });

    return NextResponse.json({ message: "Withdrawal request submitted", withdraw });
  } catch (err) {
    console.error("Withdraw error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
