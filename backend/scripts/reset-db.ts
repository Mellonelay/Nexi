import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function main() {
  console.log('🔄 Starting Database Reset...');

  try {
    console.log('1. Generating Prisma Client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma Client Generated.');

    console.log('2. Pushing Schema to DB...');
    await execAsync('npx prisma db push');
    console.log('✅ Schema Pushed.');

    console.log('3. Seeding Database...');
    await execAsync('npx prisma db seed');
    console.log('✅ Database Seeded.');

    console.log('🎉 Database Reset Complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

main();
