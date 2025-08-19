// src/app/api/admin/deposits/approve/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { txnId } = await req.json();

    // Find transaction
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (txn.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    // Approve transaction
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: txnId },
        data: { status: "APPROVED" },
      }),
      prisma.wallet.update({
        where: { userId: txn.userId },
        data: { mainBalance: { increment: txn.amount } },
      }),
    ]);

    return NextResponse.json({ message: "Deposit approved" });
  } catch (err) {
    console.error("Approve deposit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
