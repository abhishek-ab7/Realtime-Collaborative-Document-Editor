/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  duplicateDocument,
} from '../actions/document-actions';

vi.mock('@/lib/auth', () => {
  return {
    auth: vi.fn(),
  };
});

vi.mock('next/cache', () => {
  return {
    revalidatePath: vi.fn(),
  };
});

vi.mock('@collabdoc/database', () => {
  return {
    prisma: {
      document: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      documentSnapshot: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      activityLog: {
        create: vi.fn(),
      },
      collaborator: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';

describe('Document Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('createDocument fails if user is unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    await expect(createDocument()).rejects.toThrow('Unauthorized');
  });

  test('createDocument creates a new document and initial snapshot', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.document.create).mockResolvedValue({
      id: 'doc-101',
      title: 'Untitled Document',
      ownerId: 'user-1',
    } as any);

    const doc = await createDocument();

    expect(doc).toEqual({
      id: 'doc-101',
      title: 'Untitled Document',
      ownerId: 'user-1',
    });
    expect(prisma.document.create).toHaveBeenCalled();
    expect(prisma.documentSnapshot.create).toHaveBeenCalled();
    expect(prisma.activityLog.create).toHaveBeenCalled();
  });

  test('updateDocument renames active document', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-101',
      ownerId: 'user-1',
      title: 'Old Title',
      status: 'ACTIVE',
    } as any);
    vi.mocked(prisma.document.update).mockResolvedValue({
      id: 'doc-101',
      title: 'New Title',
    } as any);

    const doc = await updateDocument('doc-101', { title: 'New Title' });

    expect(doc.title).toBe('New Title');
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-101' },
      data: { title: 'New Title' },
    });
  });

  test('deleteDocument deletes trashed document', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-101',
      ownerId: 'user-1',
      status: 'TRASHED',
    } as any);

    await deleteDocument('doc-101');

    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-101' },
    });
  });

  test('deleteDocument fails if document is not TRASHED', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-101',
      ownerId: 'user-1',
      status: 'ACTIVE',
    } as any);

    await expect(deleteDocument('doc-101')).rejects.toThrow('Document must be trashed first');
  });

  test('duplicateDocument duplicates owned document with snapshot copy', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-101',
      ownerId: 'user-1',
      title: 'Document Title',
      wordCount: 150,
    } as any);
    vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue({
      yjsState: Buffer.from([1, 2, 3]),
      stateVector: Buffer.from([4, 5]),
      byteSize: 3,
    } as any);
    vi.mocked(prisma.document.create).mockResolvedValue({
      id: 'doc-copy',
      title: 'Document Title — Copy',
    } as any);

    const copy = await duplicateDocument('doc-101');

    expect(copy.title).toBe('Document Title — Copy');
    expect(prisma.document.create).toHaveBeenCalled();
    expect(prisma.documentSnapshot.create).toHaveBeenCalled();
  });
});
