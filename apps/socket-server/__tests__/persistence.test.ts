import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client — factory must not reference module-scoped variables
vi.mock('@collabdoc/database', () => {
  const mockPrisma = {
    documentSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    document: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { prisma: mockPrisma };
});

// Mock logger
vi.mock('../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

// Import AFTER mocks are declared
import { prisma } from '@collabdoc/database';
import { loadDocumentState, saveDocumentState } from '../src/rooms/persistence';

// Type the mocked prisma for convenience
const mockPrisma = prisma as unknown as {
  documentSnapshot: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  document: {
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe('Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadDocumentState', () => {
    it('returns null when no snapshot exists', async () => {
      mockPrisma.documentSnapshot.findFirst.mockResolvedValue(null);
      const result = await loadDocumentState('doc-1');
      expect(result).toBeNull();
    });

    it('returns Uint8Array when snapshot exists', async () => {
      const mockState = Buffer.from([1, 2, 3, 4, 5]);
      mockPrisma.documentSnapshot.findFirst.mockResolvedValue({
        yjsState: mockState,
      });

      const result = await loadDocumentState('doc-1');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result?.length).toBe(5);
    });

    it('returns null on error', async () => {
      mockPrisma.documentSnapshot.findFirst.mockRejectedValue(new Error('DB error'));
      const result = await loadDocumentState('doc-1');
      expect(result).toBeNull();
    });

    it('queries with correct parameters', async () => {
      mockPrisma.documentSnapshot.findFirst.mockResolvedValue(null);
      await loadDocumentState('doc-xyz');

      expect(mockPrisma.documentSnapshot.findFirst).toHaveBeenCalledWith({
        where: { documentId: 'doc-xyz' },
        orderBy: { createdAt: 'desc' },
        select: { yjsState: true },
      });
    });
  });

  describe('saveDocumentState', () => {
    it('creates snapshot in a transaction', async () => {
      const mockTx = {
        documentSnapshot: {
          create: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
          deleteMany: vi.fn(),
        },
        document: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        await fn(mockTx);
      });

      const state = new Uint8Array([10, 20, 30]);
      const vector = new Uint8Array([1, 2]);

      await saveDocumentState('doc-1', state, vector);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTx.documentSnapshot.create).toHaveBeenCalledWith({
        data: {
          documentId: 'doc-1',
          yjsState: expect.any(Buffer),
          stateVector: expect.any(Buffer),
          byteSize: 3,
        },
      });
      expect(mockTx.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('garbage collects old snapshots when exceeding limit', async () => {
      const oldSnapshots = [{ id: 'old-1' }, { id: 'old-2' }];
      const mockTx = {
        documentSnapshot: {
          create: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue(oldSnapshots),
          deleteMany: vi.fn().mockResolvedValue({}),
        },
        document: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        await fn(mockTx);
      });

      await saveDocumentState('doc-1', new Uint8Array([1]), new Uint8Array([1]));

      expect(mockTx.documentSnapshot.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-1', 'old-2'] } },
      });
    });
  });
});
