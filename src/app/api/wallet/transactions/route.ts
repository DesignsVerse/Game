// import { NextResponse } from "next/server";
// import { prisma } from "@/app/lib/prisma";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get("type"); // DEPOSIT | WITHDRAW | null
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");

//     const userId = req.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const where: any = { userId };
//     if (type && type !== "ALL") {
//       where.type = type;
//     }

//     const [transactions, total] = await Promise.all([
//       prisma.transaction.findMany({
//         where,
//         orderBy: { createdAt: "desc" },
//         skip: (page - 1) * limit,
//         take: limit,
//       }),
//       prisma.transaction.count({ where }),
//     ]);

//     return NextResponse.json({
//       page,
//       limit,
//       total,
//       transactions,
//     });
//   } catch (err) {
//     console.error("Transaction history error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }




import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");   // DEPOSIT | WITHDRAW | ALL
    const status = searchParams.get("status"); // SUCCESS | PENDING | FAILED | ALL
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // filter bana rahe hai
    const where: any = { userId };

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      transactions,
    });
  } catch (err) {
    console.error("Transaction history error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
