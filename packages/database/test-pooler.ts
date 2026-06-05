import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.trjloubazxygxfhxbtey:CollabdocSecureDBPass2026!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
});

async function main() {
  try {
    console.log('Connecting to pooler...');
    const userCount = await prisma.user.count();
    console.log(`Pooler Connection successful! User count: ${userCount}`);
  } catch (error) {
    console.error('Pooler Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
