
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Wallet Logic Test ---');

  // 1. Create Dummy User
  const email = `testuser_${Date.now()}@example.com`;
  console.log(`Creating user: ${email}`);
  const user = await prisma.user.create({
    data: {
      userCode: 100001,
      email,
      password: 'hashed_password',
      wallet: {
        create: {
          balances: {},
        }
      }
    },
    include: { wallet: true }
  });
  console.log('User created:', user.id);
  console.log('Wallet created:', user.wallet?.id);

  if (!user.wallet) throw new Error('Wallet creation failed');
  const walletId = user.wallet.id;

  // 2. Deposit Funds
  console.log('\n--- Testing Deposit ---');
  // Simulating Service Logic
  let wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  let balances = wallet?.balances as any || {};
  
  const amount = 1000;
  const currency = 'USDT';
  
  balances[currency] = { available: (balances[currency]?.available || 0) + amount, locked: 0 };
  
  await prisma.wallet.update({
    where: { id: walletId },
    data: { balances }
  });
  
  await prisma.ledger.create({
    data: {
      walletId,
      currency,
      amount,
      type: 'DEPOSIT',
      referenceId: 'TEST-DEP-1'
    }
  });
  console.log(`Deposited ${amount} ${currency}`);

  // 3. Lock Funds
  console.log('\n--- Testing Lock ---');
  const lockAmount = 100;
  balances[currency].available -= lockAmount;
  balances[currency].locked += lockAmount;
  
  await prisma.wallet.update({
    where: { id: walletId },
    data: { balances }
  });
  console.log(`Locked ${lockAmount} ${currency}`);

  // 4. Verify Final State
  const finalWallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  console.log('Final Balances:', finalWallet?.balances);
  
  const ledger = await prisma.ledger.findMany({ where: { walletId } });
  console.log('Ledger Entries:', ledger.length);

  console.log('\n--- Test Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
