import { PrismaClient } from '@prisma/client';

const regions = ['ap-south-1', 'eu-west-2', 'us-east-1'];
const ports = [5432, 6543];

async function testConfig(region: string, port: number) {
  const url = `postgresql://postgres.trjloubazxygxfhxbtey:CollabdocSecureDBPass2026!@aws-0-${region}.pooler.supabase.com:${port}/postgres${port === 6543 ? '?pgbouncer=true' : ''}`;
  console.log(`Testing ${region} on port ${port}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    console.log(`   ✅ SUCCESS: Count is ${count}`);
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message.split('\n')[0]}`);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  for (const region of regions) {
    for (const port of ports) {
      const success = await testConfig(region, port);
      if (success) {
        console.log(`🎉 FOUND WORKING CONFIGURATION! Region: ${region}, Port: ${port}`);
        return;
      }
    }
  }
}

main();
