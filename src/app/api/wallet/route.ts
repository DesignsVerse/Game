import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/app/lib/prisma";
import { authMiddleware } from "@/app/lib/auth"; 

export async function GET(req: NextRequest) {
  try {
    const user = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId },
    });
    console.log("x-user-id header:", req.headers.get("x-user-id"));

    if (!wallet) {
      return NextResponse.json(
        { mainBalance: 0, referralBalance: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(wallet, { status: 200 });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
