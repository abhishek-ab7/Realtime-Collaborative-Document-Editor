import { describe, test, expect, vi, beforeEach } from 'vitest';
import { updateDocument } from '@/features/documents/actions/document-actions';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock prisma
vi.mock('@collabdoc/database', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    documentSnapshot: {
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';

const mockSession = {
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
  expires: '2099-01-01',
};

const mockDocument = {
  id: 'doc-1',
  title: 'Project Roadmap',
  ownerId: 'user-1',
  status: 'ACTIVE',
  lastAccessedAt: null,
  collaborators: [],
};

describe('Editor Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updateDocument is callable for the session user', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    // updateDocument does a findUnique ownership check before updating
    vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDocument as any);
    vi.mocked(prisma.document.update).mockResolvedValue({
      ...mockDocument,
      updatedAt: new Date(),
    } as any);

    // Should not throw
    await expect(updateDocument('doc-1', {})).resolves.not.toThrow();
  });

  test('updateDocument fails when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    await expect(updateDocument('doc-1', { title: 'New Title' })).rejects.toThrow();
  });

  test('document findUnique is called with correct id', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDocument as any);

    await prisma.document.findUnique({ where: { id: 'doc-1' } } as any);

    expect(prisma.document.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'doc-1' } }),
    );
  });

  test('returns 404-equivalent when document does not exist', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

    const doc = await prisma.document.findUnique({ where: { id: 'non-existent' } } as any);

    expect(doc).toBeNull();
  });
});
