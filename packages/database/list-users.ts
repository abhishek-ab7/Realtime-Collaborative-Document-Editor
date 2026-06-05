import { prisma } from './src';

async function main() {
  const users = await prisma.user.findMany();
  console.log('All Users in DB:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
