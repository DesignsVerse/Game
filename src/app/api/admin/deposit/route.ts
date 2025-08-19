import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { txnId, action } = await req.json(); // action = APPROVE | REJECT
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });

    if (!txn || txn.type !== "DEPOSIT" || txn.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid txn" }, { status: 400 });
    }

    let updatedTxn;
    if (action === "APPROVE") {
      updatedTxn = await prisma.transaction.update({
        where: { id: txnId },
        data: { status: "APPROVED" },
      });

      // Add to user wallet
      await prisma.wallet.update({
        where: { userId: txn.userId },
        data: { mainBalance: { increment: txn.amount } },
      });
    } else {
      updatedTxn = await prisma.transaction.update({
        where: { id: txnId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ message: `Deposit ${action}`, updatedTxn });
  } catch (err) {
    console.error("Admin deposit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
