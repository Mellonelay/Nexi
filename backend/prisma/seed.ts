import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding Database ---');

  // 1. Create Default Mining Plans
  const plans = [
    { name: 'Basic Plan', dailyYield: 0.5, lockupPeriod: 7, minDeposit: 10, maxDeposit: 1000 },
    { name: 'Pro Plan', dailyYield: 1.0, lockupPeriod: 30, minDeposit: 500, maxDeposit: 5000 },
    { name: 'Whale Plan', dailyYield: 1.5, lockupPeriod: 90, minDeposit: 5000, maxDeposit: 50000 },
  ];

  for (const p of plans) {
    const exists = await prisma.miningPlan.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.miningPlan.create({
        data: { ...p, currency: 'USDT' }
      });
      console.log(`Created Plan: ${p.name}`);
    }
  }

  // 1b. Create the canonical staging loan product already used by the
  // Admin mock provider. Keep this idempotent so VM/Neon recovery does not
  // create duplicate products.
  const loanPlan = {
    name: 'Standard 30D',
    durationDays: 30,
    interestRate: 0.1,
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
  };
  const existingLoanPlan = await prisma.loanPlan.findFirst({ where: { name: loanPlan.name } });
  if (existingLoanPlan) {
    await prisma.loanPlan.update({ where: { id: existingLoanPlan.id }, data: loanPlan });
  } else {
    await prisma.loanPlan.create({ data: loanPlan });
  }

  // 2. Seed Binary/Contract Pairs
  const pairs = [
    { symbol: 'BTC/USDT', minLeverage: 1, maxLeverage: 125, makerFee: 0.0002, takerFee: 0.0004 },
    { symbol: 'ETH/USDT', minLeverage: 1, maxLeverage: 100, makerFee: 0.0002, takerFee: 0.0004 },
    { symbol: 'SOL/USDT', minLeverage: 1, maxLeverage: 50, makerFee: 0.0002, takerFee: 0.0004 },
  ];

  for (const p of pairs) {
    const exists = await prisma.contractPair.findUnique({ where: { symbol: p.symbol } });
    if (!exists) {
      await prisma.contractPair.create({ data: p });
      console.log(`Created Contract Pair: ${p.symbol}`);
    }
  }

  // 3. Seed the authoritative NEXI Binary/Options configurations for all
  // canonical crypto pairs. Binary is strictly WIN or LOSS: losses return
  // zero, and equal expiry prices resolve deterministically to LOSS in the
  // settlement service. Keep this idempotent for VM/Neon staging recovery.
  const binaryPairs = [
    'BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'XRPUSDT', 'BCHUSDT', 'ETCUSDT',
    'FILUSDT', 'USDCUSDT', 'SUNUSDT', 'DOTUSDT', 'ADAUSDT', 'SOLUSDT',
    'MATICUSDT', 'AVAXUSDT', 'LINKUSDT', 'TRXUSDT', 'DOGEUSDT',
  ];
  const binaryDurations = [30, 60, 180, 280, 420];
  for (const pair of binaryPairs) {
    for (const durationSeconds of binaryDurations) {
      const existing = await prisma.gate2BinaryConfiguration.findFirst({
        where: { pair, durationSeconds, version: 1 },
      });
      if (existing) {
        await prisma.gate2BinaryConfiguration.update({
          where: { id: existing.id },
          data: { enabled: true, lossRate: 0 },
        });
      } else {
        await prisma.gate2BinaryConfiguration.create({
          data: {
            pair,
            durationSeconds,
            payoutRate: 0.85,
            lossRate: 0,
            minStake: 1,
            maxStake: 1000,
            settlementDelaySeconds: 0,
            version: 1,
            enabled: true,
          },
        });
      }
    }
  }

  // 4. Create Admin User (Optional)
  // ...

  console.log('--- Seed Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
