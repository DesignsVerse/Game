import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request, { params }: { params: { ids: string } }) {
  try {
    const withdrawalId = params.ids;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    if (withdrawal.status !== "PENDING") return NextResponse.json({ error: "Already processed" }, { status: 400 });

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "REJECTED" },
    });

    await prisma.transaction.updateMany({
      where: { userId: withdrawal.userId, type: "WITHDRAW", meta: { path: ["withdrawalId"], equals: withdrawalId } },
      data: { meta: { status: "REJECTED" } },
    });

    return NextResponse.json({ message: "Withdrawal rejected", withdrawal: updated });
  } catch (err) {
    console.error("Reject withdrawal error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
