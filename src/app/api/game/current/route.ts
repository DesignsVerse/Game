import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const round = await prisma.round.findFirst({
      where: {
        status: "OPEN",
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { startTime: "desc" },
    });

    if (!round) {
      return NextResponse.json({ message: "No active round" }, { status: 404 });
    }

    return NextResponse.json(round, { status: 200 });
  } catch (err) {
    console.error("Current round error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
