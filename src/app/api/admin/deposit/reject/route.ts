// src/app/api/admin/deposits/reject/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { txnId } = await req.json();

    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (txn.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    await prisma.transaction.update({
      where: { id: txnId },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ message: "Deposit rejected" });
  } catch (err) {
    console.error("Reject deposit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
