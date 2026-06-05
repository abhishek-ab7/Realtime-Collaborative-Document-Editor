import { prisma } from './src';

async function main() {
  try {
    console.log('Testing insert...');
    const randomEmail = `test-${Math.random()}@example.com`;
    const newUser = await prisma.user.create({
      data: {
        email: randomEmail,
        name: 'Test User',
      },
    });
    console.log('Insert successful!', newUser);
    // clean up
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    console.log('Cleanup successful!');
  } catch (error) {
    console.error('Insert failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
