import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, roundId, colorChoice, amount } = await req.json();

    // Validate
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round || round.status !== "OPEN") {
      return NextResponse.json({ error: "Round not open" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.mainBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Deduct balance immediately
    await prisma.wallet.update({
      where: { userId },
      data: { mainBalance: { decrement: amount } },
    });

    // Create bet
    const bet = await prisma.bet.create({
      data: {
        userId,
        roundId,
        colorChoice,
        amount,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Bet placed", bet }, { status: 201 });
  } catch (err) {
    console.error("Place bet error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
