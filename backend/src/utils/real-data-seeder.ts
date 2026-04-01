import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const BASE_URL = "https://www.coindefgie15eg.qpon/api";
const HEADERS = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://dexixz.com",
    "Referer": "https://dexixz.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0",
    "Content-Type": "application/json",
    "authorization": "c8d37fa8ec36eedbb903eefe9b9359e0",
    "Cookie": "php_exchange_session=ne4goyzD9bGM0KV3RYe4HsxdGwIUgb0hmZIPr2JA"
};

export class RealDataSeeder {
    static async syncMarketData() {
        const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public';
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });
        console.log("Fetching Market Data...");
        try {
            const { data } = await axios.get(`${BASE_URL}/getHbList`, { headers: HEADERS });
            // API might return array directly or inside data field
            // Python script: r.json() -> save. Logic didn't specify.
            // Common pattern: data.data or data
            const items = Array.isArray(data) ? data : (data.data || []);

            if (Array.isArray(items)) {
                console.log(`Received ${items.length} market items.`);
                for (const item of items) {
                    const symbol = item.symbol || item.name;
                    if (!symbol) continue;

                    // Helper to parse float safely
                    const parse = (val: any) => {
                        const f = Number.parseFloat(val);
                        return Number.isNaN(f) ? 0 : f;
                    };

                    await prisma.marketData.upsert({
                        where: { symbol },
                        update: {
                            price: parse(item.close || item.price),
                            change: parse(item.change || item.rate || item.ratio),
                            vol: parse(item.vol || item.volume || item.amount),
                            high: parse(item.high),
                            low: parse(item.low),
                            rawData: item
                        },
                        create: {
                            symbol,
                            price: parse(item.close || item.price),
                            change: parse(item.change || item.rate || item.ratio),
                            vol: parse(item.vol || item.volume || item.amount),
                            high: parse(item.high),
                            low: parse(item.low),
                            rawData: item
                        }
                    });
                }
            } else {
                console.log("Market Data format unknown:", data);
            }
        } catch (error) {
            console.error("Error syncing market data:", error);
        }
    }

    static async syncBinaryConfigs() {
        const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public';
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });
        console.log("Fetching Binary Configs...");
        try {
            // We can fetch for multiple currencies if needed, but starting with BTC (32)
            const params = {
                "currency_id": 32, // BTC
                "match_id": 61,
                "status": 1,
                "page": "",
                "limit": 10,
            };
            const { data } = await axios.get(`${BASE_URL}/microtrade/listsV2`, {
                headers: HEADERS,
                params
            });

            const list = Array.isArray(data) ? data : (data.data || []);

            if (Array.isArray(list) && list.length > 0) {
                console.log(`Received ${list.length} binary configs.`);

                // Clear existing for this specific config set to avoid duplicates
                await prisma.optionGameSettings.deleteMany({
                    where: { currencyId: 32, matchId: 61 }
                });

                for (const item of list) {
                    await prisma.optionGameSettings.create({
                        data: {
                            currencyId: item.currency_id || 32,
                            matchId: item.match_id || 61,
                            status: item.status || 1,
                            symbol: "BTC/USDT",
                            payoutRate: Number.parseFloat(item.profit_ratio || 0),
                            duration: Number.parseInt(item.seconds || 0),
                            rawData: item
                        }
                    });
                }
            } else {
                console.log("No binary configs found (or API failed). Seeding MOCK data.");
                // Clear existing
                await prisma.optionGameSettings.deleteMany({
                    where: { currencyId: 32, matchId: 61 }
                });

                const mocks = [
                    { seconds: 30, profit_ratio: 0.8 },
                    { seconds: 60, profit_ratio: 0.82 },
                    { seconds: 180, profit_ratio: 0.85 },
                    { seconds: 300, profit_ratio: 0.9 }
                ];

                for (const m of mocks) {
                    await prisma.optionGameSettings.create({
                        data: {
                            currencyId: 32,
                            matchId: 61,
                            status: 1,
                            symbol: "BTC/USDT",
                            payoutRate: m.profit_ratio,
                            duration: m.seconds,
                            rawData: { mock: true }
                        }
                    });
                }
                console.log("Mock binary configs seeded.");
            }
        } catch (error) {
            console.error("Error syncing binary configs:", error);
        }
    }
}
