import { expect, test } from 'vitest';
import { MAX_DOCUMENT_TITLE_LENGTH, ROLES } from '../src/constants';

test('shared constants are correctly defined', () => {
  expect(MAX_DOCUMENT_TITLE_LENGTH).toBe(255);
  expect(ROLES.OWNER).toBe('OWNER');
  expect(ROLES.EDITOR).toBe('EDITOR');
  expect(ROLES.VIEWER).toBe('VIEWER');
});
