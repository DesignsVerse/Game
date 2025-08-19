import { PrismaClient, Role, Status, TransactionType, GameType, Color, RoundStatus, BetStatus, WithdrawalStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // 1. Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: "hashedpassword",
      role: Role.ADMIN,
      status: Status.ACTIVE,
      referralCode: "ADMIN123"
    }
  })

  const user1 = await prisma.user.create({
    data: {
      email: "user1@example.com",
      passwordHash: "hashedpassword",
      role: Role.USER,
      status: Status.ACTIVE,
      referralCode: "USER123",
      referredBy: admin.id
    }
  })

  // 2. Wallets
  await prisma.wallet.createMany({
    data: [
      { userId: admin.id, mainBalance: 1000, referralBalance: 500 },
      { userId: user1.id, mainBalance: 200, referralBalance: 50 }
    ]
  })

  // 3. Rounds
  const round1 = await prisma.round.create({
    data: {
      type: GameType.THIRTY_SEC,
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() - 30000),
      resultColor: Color.RABBIT,
      status: RoundStatus.SETTLED
    }
  })

  // 4. Bets
  await prisma.bet.create({
    data: {
      userId: user1.id,
      roundId: round1.id,
      colorChoice: Color.RABBIT,
      amount: 50,
      payout: 100,
      status: BetStatus.WON
    }
  })

  // 5. Transactions
  await prisma.transaction.createMany({
    data: [
      { userId: user1.id, type: TransactionType.DEPOSIT, amount: 200 },
      { userId: user1.id, type: TransactionType.BET, amount: -50 },
      { userId: user1.id, type: TransactionType.WIN, amount: 100 }
    ]
  })

  // 6. Withdrawal
  await prisma.withdrawal.create({
    data: {
      userId: user1.id,
      amount: 50,
      status: WithdrawalStatus.APPROVED,
      approvedAt: new Date()
    }
  })

  // 7. Referral
  await prisma.referral.create({
    data: {
      referrerId: admin.id,
      refereeId: user1.id,
      level: 1,
      commissionAmount: 10
    }
  })

  // 8. AdminAction
  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      actionType: "wallet_adjust",
      payload: { reason: "Test adjustment", amount: 100 }
    }
  })
}

main()
  .then(() => console.log("Seeding complete"))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
