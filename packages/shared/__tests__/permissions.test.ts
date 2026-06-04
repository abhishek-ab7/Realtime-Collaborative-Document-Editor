import { expect, test } from 'vitest';
import {
  canViewDocument,
  canEditDocument,
  canDeleteDocument,
  canShareDocument,
} from '../src/permissions';

test('permission helper logic checks roles correctly', () => {
  expect(canViewDocument('VIEWER')).toBe(true);
  expect(canViewDocument('EDITOR')).toBe(true);
  expect(canViewDocument('OWNER')).toBe(true);
  expect(canViewDocument(null)).toBe(false);

  expect(canEditDocument('VIEWER')).toBe(false);
  expect(canEditDocument('EDITOR')).toBe(true);
  expect(canEditDocument('OWNER')).toBe(true);

  expect(canDeleteDocument('EDITOR')).toBe(false);
  expect(canDeleteDocument('OWNER')).toBe(true);

  expect(canShareDocument('EDITOR')).toBe(false);
  expect(canShareDocument('OWNER')).toBe(true);
});
