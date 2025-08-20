import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Fetch latest round
    const lastRound = await prisma.round.findFirst({
      orderBy: { startTime: "desc" },
      include: { bets: true },
    });

    if (lastRound) {
      // 1. Close if expired
      if (lastRound.status === "OPEN" && lastRound.endTime <= now) {
        await prisma.round.update({
          where: { id: lastRound.id },
          data: { status: "CLOSED" },
        });
      }

      // 2. Decide winner + payout
      if (
        lastRound.status === "CLOSED" &&
        lastRound.endTime.getTime() + 5000 <= now.getTime()
      ) {
        const winningColor = Math.random() > 0.5 ? "RED" : "GREEN";

        await prisma.round.update({
          where: { id: lastRound.id },
          data: { status: "RESULT_DECLARED", resultColor: winningColor },
        });

        // Payout winners
        for (const bet of lastRound.bets) {
          if (bet.colorChoice === winningColor) {
            const payout = bet.amount * 2;
            await prisma.bet.update({
              where: { id: bet.id },
              data: { status: "WON", payout },
            });

            await prisma.wallet.update({
              where: { userId: bet.userId },
              data: { mainBalance: { increment: payout } },
            });
          } else {
            await prisma.bet.update({
              where: { id: bet.id },
              data: { status: "LOST" },
            });
          }
        }
      }
    }

    // 3. Create new round if none running
    if (!lastRound || lastRound.endTime <= now) {
      const startTime = now;
      const endTime = new Date(startTime.getTime() + 30 * 1000);

      await prisma.round.create({
        data: {
          type: "THIRTY_SEC",
          startTime,
          endTime,
          status: "OPEN",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Engine executed ✅" });
  } catch (err) {
    console.error("Game engine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
