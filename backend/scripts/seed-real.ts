import "dotenv/config";
import { RealDataSeeder } from "../src/utils/real-data-seeder";

async function runSeeder() {
  console.log("Starting Real Data Seed...");
  try {
    await RealDataSeeder.syncMarketData();
    await RealDataSeeder.syncBinaryConfigs();
    console.log("Seeding completed.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
runSeeder().catch((e) => {
  console.error(e);
  process.exit(1);
});
