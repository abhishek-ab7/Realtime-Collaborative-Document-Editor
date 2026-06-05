import { prisma } from './src';

async function main() {
  const docs = await prisma.document.findMany();
  console.log('All Documents in DB:', docs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
