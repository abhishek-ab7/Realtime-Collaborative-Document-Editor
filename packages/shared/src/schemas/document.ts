import { z } from 'zod';
import { MAX_DOCUMENT_TITLE_LENGTH, MAX_DOCUMENTS_PER_PAGE } from '../constants';

export const createDocumentSchema = z.object({
  title: z.string().max(MAX_DOCUMENT_TITLE_LENGTH).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(MAX_DOCUMENT_TITLE_LENGTH).optional(),
  isStarred: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'TRASHED']).optional(),
});

export const listDocumentsSchema = z.object({
  status: z.enum(['ACTIVE', 'TRASHED']).default('ACTIVE'),
  starred: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['updated', 'created', 'title', 'accessed']).default('accessed'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_DOCUMENTS_PER_PAGE).default(20),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
