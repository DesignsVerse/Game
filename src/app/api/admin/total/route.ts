// import { NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";

// export async function GET() {
//   const deposits = await prisma.transaction.groupBy({
//     by: ["status"],
//     where: { type: "DEPOSIT" },
//     _sum: { amount: true },
//   });

//   const withdrawals = await prisma.withdrawal.groupBy({
//     by: ["status"],
//     _sum: { amount: true },
//   });

//   return NextResponse.json({ deposits, withdrawals });
// }

// ------------new------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type TxStatus = "PENDING" | "APPROVED" | "REJECTED";
type TxType = "DEPOSIT" | "WITHDRAWAL";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = (searchParams.get("type")?.toUpperCase() as TxType | "ALL") || "ALL";
    const statusParam = (searchParams.get("status")?.toUpperCase() as TxStatus | "ALL") || "ALL";
    const userId = searchParams.get("userId"); // optional, if needed
    const take = Number(searchParams.get("take") || "100");
    const skip = Number(searchParams.get("skip") || "0");
    const sort = (searchParams.get("sort") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    // Build filters
    const statusFilter = statusParam === "ALL" ? undefined : statusParam;
    const userFilter = userId ? { userId } : undefined;

    // Decide which queries to run based on "type"
    const needDeposits = typeParam === "ALL" || typeParam === "DEPOSIT";
    const needWithdrawals = typeParam === "ALL" || typeParam === "WITHDRAWAL";

    const [deposits, withdrawals] = await Promise.all([
      needDeposits
        ? prisma.transaction.findMany({
            where: {
              type: "DEPOSIT",
              ...(statusFilter ? { status: statusFilter } : {}),
              ...(userFilter || {}),
            },
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
              userId: true,
              // include any other fields you need
            },
            take: take + skip, // fetch enough to merge/sort client-side
            orderBy: { createdAt: sort },
          })
        : Promise.resolve([]),
      needWithdrawals
        ? prisma.withdrawal.findMany({
            where: {
              ...(statusFilter ? { status: statusFilter } : {}),
              ...(userFilter || {}),
            },
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
              userId: true,
              // include any other fields you need
            },
            take: take + skip,
            orderBy: { createdAt: sort },
          })
        : Promise.resolve([]),
    ]);

    // Normalize to a single array
    const normalized = [
      ...deposits.map((d) => ({
        id: `dep_${d.id}`,
        type: "DEPOSIT" as TxType,
        status: d.status as TxStatus,
        amount: d.amount,
        createdAt: d.createdAt,
        userId: d.userId,
        // extra: source: 'transaction'
      })),
      ...withdrawals.map((w) => ({
        id: `wd_${w.id}`,
        type: "WITHDRAWAL" as TxType,
        status: w.status as TxStatus,
        amount: w.amount,
        createdAt: w.createdAt,
        userId: w.userId,
        // extra: source: 'withdrawal'
      })),
    ];

    // Merge sort and paginate consistently
    normalized.sort((a, b) => {
      const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "asc" ? cmp : -cmp;
    });

    const page = normalized.slice(skip, skip + take);

    // Optional: Aggregates per status for quick UI summary chips
    const totals = page.reduce(
      (acc, t) => {
        acc.all += t.amount;
        acc.byType[t.type] = (acc.byType[t.type] || 0) + t.amount;
        acc.byStatus[t.status] = (acc.byStatus[t.status] || 0) + t.amount;
        return acc;
      },
      {
        all: 0,
        byType: { DEPOSIT: 0, WITHDRAWAL: 0 } as Record<TxType, number>,
        byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<TxStatus, number>,
      }
    );

    return NextResponse.json({
      data: page,
      pagination: { skip, take, total: normalized.length },
      totals,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Failed to fetch transactions" }, { status: 500 });
  }
}
