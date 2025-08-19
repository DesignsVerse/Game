import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const deposits = await prisma.transaction.groupBy({
    by: ["status"],
    where: { type: "DEPOSIT" },
    _sum: { amount: true },
  });

  const withdrawals = await prisma.withdrawal.groupBy({
    by: ["status"],
    _sum: { amount: true },
  });

  return NextResponse.json({ deposits, withdrawals });
}
