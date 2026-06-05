import { expect, test, describe } from 'vitest';
import {
  createDocumentSchema,
  updateDocumentSchema,
  listDocumentsSchema,
} from '../src/schemas/document';
import { MAX_DOCUMENT_TITLE_LENGTH, MAX_DOCUMENTS_PER_PAGE } from '../src/constants';

describe('Document Schemas', () => {
  describe('createDocumentSchema', () => {
    test('allows valid creation inputs', () => {
      const valid = createDocumentSchema.safeParse({ title: 'Test Document' });
      expect(valid.success).toBe(true);
      expect(valid.data?.title).toBe('Test Document');
    });

    test('allows missing title (optional)', () => {
      const valid = createDocumentSchema.safeParse({});
      expect(valid.success).toBe(true);
      expect(valid.data?.title).toBeUndefined();
    });

    test('enforces max title length', () => {
      const invalid = createDocumentSchema.safeParse({
        title: 'a'.repeat(MAX_DOCUMENT_TITLE_LENGTH + 1),
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('updateDocumentSchema', () => {
    test('allows partial valid updates', () => {
      const valid = updateDocumentSchema.safeParse({ isStarred: true });
      expect(valid.success).toBe(true);
    });

    test('disallows empty title if specified', () => {
      const invalid = updateDocumentSchema.safeParse({ title: '' });
      expect(invalid.success).toBe(false);
    });

    test('disallows invalid statuses', () => {
      const invalid = updateDocumentSchema.safeParse({ status: 'DELETED' });
      expect(invalid.success).toBe(false);
    });

    test('allows valid status ACTIVE and TRASHED', () => {
      const active = updateDocumentSchema.safeParse({ status: 'ACTIVE' });
      expect(active.success).toBe(true);

      const trashed = updateDocumentSchema.safeParse({ status: 'TRASHED' });
      expect(trashed.success).toBe(true);
    });
  });

  describe('listDocumentsSchema', () => {
    test('uses defaults for empty queries', () => {
      const result = listDocumentsSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'ACTIVE',
        sort: 'accessed',
        order: 'desc',
        page: 1,
        limit: 20,
      });
    });

    test('coerces and validates numbers', () => {
      const result = listDocumentsSchema.safeParse({
        page: '2',
        limit: '15',
        starred: 'true',
      });
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(2);
      expect(result.data?.limit).toBe(15);
      expect(result.data?.starred).toBe(true);
    });

    test('enforces limits and bounds', () => {
      const negativePage = listDocumentsSchema.safeParse({ page: 0 });
      expect(negativePage.success).toBe(false);

      const excessLimit = listDocumentsSchema.safeParse({ limit: MAX_DOCUMENTS_PER_PAGE + 1 });
      expect(excessLimit.success).toBe(false);
    });

    test('validates search criteria length limits', () => {
      const longSearch = listDocumentsSchema.safeParse({ search: 'a'.repeat(101) });
      expect(longSearch.success).toBe(false);
    });
  });
});
