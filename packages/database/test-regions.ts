import { PrismaClient } from '@prisma/client';

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ca-central-1',
  'sa-east-1',
];

async function testRegion(region: string) {
  const url = `postgresql://postgres.trjloubazxygxfhxbtey:CollabdocSecureDBPass2026!@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });
  try {
    await prisma.$connect();
    // try a query
    await prisma.user.count();
    console.log(`✅ SUCCESS connecting to pooler in ${region}!`);
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    console.log(`❌ FAILED in ${region}:`, error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      console.log(`FOUND REGION: ${region}`);
      break;
    }
  }
}

main();
