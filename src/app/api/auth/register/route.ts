import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, phone, password, referralCode } = await req.json();

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const myReferral = "REF" + Math.floor(100000 + Math.random() * 900000);

    const referrerBonus = 50;
    const welcomeBonus = 100;

    let referredById: string | null = null;

    // 🚀 Wrap everything in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // check referral code
      if (referralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode },
          include: { wallet: true },
        });

        if (referrer) {
          referredById = referrer.id;

          // ensure referrer wallet exists
          if (referrer.wallet) {
            await tx.wallet.update({
              where: { userId: referrer.id },
              data: { referralBalance: { increment: referrerBonus } },
            });
          } else {
            await tx.wallet.create({
              data: {
                userId: referrer.id,
                mainBalance: 0,
                referralBalance: referrerBonus,
              },
            });
          }

          // record referral bonus txn
          await tx.transaction.create({
            data: {
              userId: referrer.id,
              type: "REFERRAL_BONUS",
              amount: referrerBonus,
              meta: { from: "referral signup", newUser: email || phone },
            },
          });
        }
      }

      // create user + wallet
      const newUser = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash: hashed,
          referralCode: myReferral,
          referredBy: referredById,
          wallet: {
            create: {
              mainBalance: welcomeBonus,
            },
          },
        },
      });

      // log welcome bonus txn
      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: "BONUS",
          amount: welcomeBonus,
          meta: { from: "welcome bonus" },
        },
      });

      // record referral relationship
      if (referredById) {
        await tx.referral.create({
          data: {
            referrerId: referredById,
            refereeId: newUser.id,
            level: 1,
            commissionAmount: referrerBonus,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      walletBalance: welcomeBonus,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
