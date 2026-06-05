import { prisma } from './src';

async function main() {
  try {
    console.log('Connecting to database...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Current user count: ${userCount}`);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
