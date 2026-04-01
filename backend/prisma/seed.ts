import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public';
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

  // 3. Create Admin User (Optional)
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
