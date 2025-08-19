import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const deposits = await prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "PENDING" } });
  const withdrawals = await prisma.withdrawal.findMany({ where: { status: "PENDING" } });

  return NextResponse.json({ deposits, withdrawals });
}
