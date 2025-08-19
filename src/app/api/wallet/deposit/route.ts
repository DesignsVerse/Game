import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { amount, paymentDetails } = await req.json();
    const userId = req.headers.get("x-user-id");

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create deposit txn (PENDING)
    const txn = await prisma.transaction.create({
      data: {
        userId: userId!,
        type: "DEPOSIT",
        amount,
        status: "PENDING",
        meta: { paymentDetails }, // QR proof, UPI id, screenshot reference etc.
      },
    });

    return NextResponse.json({ message: "Deposit request submitted", txn });
  } catch (err) {
    console.error("Deposit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
