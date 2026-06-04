import { expect, test } from 'vitest';
import { prisma } from '../src/index';

test('database connection and schema model query succeeds', async () => {
  // Query users populated by the seeding script
  const users = await prisma.user.findMany({ take: 5 });
  expect(Array.isArray(users)).toBe(true);
  expect(users.length).toBeGreaterThan(0);
});
