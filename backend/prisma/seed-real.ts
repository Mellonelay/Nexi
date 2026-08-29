
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Real Dexixz Data ---');

  // Clear existing data to ensure clean slate (optional but recommended for fixing "wrong names")
  await prisma.binaryPair.deleteMany({});
  await prisma.currency.deleteMany({});
  await prisma.binaryTimeframe.deleteMany({});
  console.log('Cleared old data.');

  // 1. Currencies
  const currencies = [
    { symbol: 'USDT', name: 'Tether', rate: 1.0, logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
    { symbol: 'BTC', name: 'Bitcoin', rate: 89800.0, logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { symbol: 'ETH', name: 'Ethereum', rate: 3200.0, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { symbol: 'BNB', name: 'Binance Coin', rate: 650.0, logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
    { symbol: 'SOL', name: 'Solana', rate: 180.0, logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { symbol: 'XRP', name: 'Ripple', rate: 1.10, logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
    { symbol: 'ADA', name: 'Cardano', rate: 0.85, logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { symbol: 'DOGE', name: 'Dogecoin', rate: 0.35, logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
    { symbol: 'TRX', name: 'TRON', rate: 0.22, logo: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
    { symbol: 'LTC', name: 'Litecoin', rate: 150.0, logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  ];

  console.log('Seeding Currencies...');
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { symbol: c.symbol },
      update: { ...c },
      create: { ...c, minDeposit: 10, maxDeposit: 10000 },
    });
  }

  // 2. Binary Pairs (Crypto, Forex, Metal, Stocks)
  const pairs = [
    // Crypto (Top 15 + Stablecoins)
    { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { symbol: 'BNB/USDT', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
    { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { symbol: 'XRP/USDT', baseAsset: 'XRP', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
    { symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { symbol: 'DOGE/USDT', baseAsset: 'DOGE', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
    { symbol: 'TRX/USDT', baseAsset: 'TRX', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
    { symbol: 'LTC/USDT', baseAsset: 'LTC', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
    { symbol: 'DOT/USDT', baseAsset: 'DOT', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
    { symbol: 'AVAX/USDT', baseAsset: 'AVAX', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
    { symbol: 'LINK/USDT', baseAsset: 'LINK', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
    { symbol: 'MATIC/USDT', baseAsset: 'MATIC', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
    { symbol: 'SHIB/USDT', baseAsset: 'SHIB', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
    { symbol: 'BCH/USDT', baseAsset: 'BCH', quoteAsset: 'USDT', category: 'crypto', rate: 1.85, logo: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png' },
    
    // Forex (Major Pairs)
    { symbol: 'EUR/USD', baseAsset: 'EUR', quoteAsset: 'USD', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/255px-Flag_of_Europe.svg.png' },
    { symbol: 'GBP/USD', baseAsset: 'GBP', quoteAsset: 'USD', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/255px-Flag_of_the_United_Kingdom.svg.png' },
    { symbol: 'USD/JPY', baseAsset: 'USD', quoteAsset: 'JPY', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/255px-Flag_of_the_United_States.svg.png' },
    { symbol: 'AUD/USD', baseAsset: 'AUD', quoteAsset: 'USD', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Australia.svg/255px-Flag_of_Australia.svg.png' },
    { symbol: 'USD/CAD', baseAsset: 'USD', quoteAsset: 'CAD', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/255px-Flag_of_Canada.svg.png' },
    { symbol: 'USD/CHF', baseAsset: 'USD', quoteAsset: 'CHF', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Switzerland.svg/100px-Flag_of_Switzerland.svg.png' },
    { symbol: 'NZD/USD', baseAsset: 'NZD', quoteAsset: 'USD', category: 'forex', rate: 1.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Flag_of_New_Zealand.svg/255px-Flag_of_New_Zealand.svg.png' },
    
    // Metal
    { symbol: 'XAU/USD', baseAsset: 'XAU', quoteAsset: 'USD', category: 'metal', rate: 1.82, logo: 'https://cdn-icons-png.flaticon.com/512/1165/1165623.png' }, // Gold
    { symbol: 'XAG/USD', baseAsset: 'XAG', quoteAsset: 'USD', category: 'metal', rate: 1.82, logo: 'https://cdn-icons-png.flaticon.com/512/1165/1165666.png' }, // Silver
    { symbol: 'XPT/USD', baseAsset: 'XPT', quoteAsset: 'USD', category: 'metal', rate: 1.82, logo: 'https://cdn-icons-png.flaticon.com/512/731/731056.png' }, // Platinum
    { symbol: 'XPD/USD', baseAsset: 'XPD', quoteAsset: 'USD', category: 'metal', rate: 1.82, logo: 'https://cdn-icons-png.flaticon.com/512/731/731056.png' }, // Palladium

    // Shares
    { symbol: 'AAPL/USDT', baseAsset: 'AAPL', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/100px-Apple_logo_black.svg.png' },
    { symbol: 'TSLA/USDT', baseAsset: 'TSLA', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
    { symbol: 'GOOGL/USDT', baseAsset: 'GOOGL', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/100px-Google_2015_logo.svg.png' },
    { symbol: 'AMZN/USDT', baseAsset: 'AMZN', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/100px-Amazon_logo.svg.png' },
    { symbol: 'MSFT/USDT', baseAsset: 'MSFT', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/100px-Microsoft_logo.svg.png' },
    { symbol: 'NVDA/USDT', baseAsset: 'NVDA', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/100px-Nvidia_logo.svg.png' },
    { symbol: 'META/USDT', baseAsset: 'META', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/100px-Meta_Platforms_Inc._logo.svg.png' },
    { symbol: 'NFLX/USDT', baseAsset: 'NFLX', quoteAsset: 'USDT', category: 'stock', rate: 1.75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/100px-Netflix_2015_logo.svg.png' },
  ];

  console.log('Seeding Binary Pairs...');
  for (const p of pairs) {
    await prisma.binaryPair.upsert({
      where: { symbol: p.symbol },
      update: { ...p },
      create: { ...p },
    });
  }

  // 3. Binary Timeframes
  const timeframes = [
    { name: '30s', seconds: 30, payoutRate: 0.60 },
    { name: '1m', seconds: 60, payoutRate: 0.75 },
    { name: '3m', seconds: 180, payoutRate: 0.85 },
    { name: '5m', seconds: 300, payoutRate: 1.00 }, // Special high payout for longer term? Or adjusted
  ];

  console.log('Seeding Timeframes...');
  for (const t of timeframes) {
    await prisma.binaryTimeframe.upsert({
      where: { seconds: t.seconds },
      update: { ...t },
      create: { ...t },
    });
  }

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
