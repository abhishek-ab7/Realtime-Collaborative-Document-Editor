import { expect, test } from 'vitest';
import { createDocumentSchema, updateDocumentSchema } from '../src/schemas/document';

test('schemas validate input correctly', () => {
  const validCreate = createDocumentSchema.safeParse({ title: 'Test Doc' });
  expect(validCreate.success).toBe(true);

  const invalidTitle = createDocumentSchema.safeParse({ title: 'a'.repeat(300) });
  expect(invalidTitle.success).toBe(false);

  const validUpdate = updateDocumentSchema.safeParse({ isStarred: true, status: 'ACTIVE' });
  expect(validUpdate.success).toBe(true);

  const invalidUpdate = updateDocumentSchema.safeParse({ status: 'INVALID_STATUS' });
  expect(invalidUpdate.success).toBe(false);
});
