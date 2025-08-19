// src/app/api/user/me/route.ts
import { prisma } from "@/app/lib/prisma"; // adjust if your prisma client is elsewhere

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id"); // injected by middleware
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      wallet: {
        select: { mainBalance: true, referralBalance: true },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
}
