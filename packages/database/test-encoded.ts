import { PrismaClient } from '@prisma/client';

const url =
  'postgresql://postgres.trjloubazxygxfhxbtey:CollabdocSecureDBPass2026%21@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
console.log('Testing connection with URL-encoded password...');

const prisma = new PrismaClient({
  datasources: {
    db: { url },
  },
});

async function main() {
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    console.log(`✅ SUCCESS: count is ${count}`);
  } catch (error: any) {
    console.error('❌ FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
