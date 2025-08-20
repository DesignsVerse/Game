import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { round: true },
    });

    return NextResponse.json(bets, { status: 200 });
  } catch (err) {
    console.error("My bets error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
