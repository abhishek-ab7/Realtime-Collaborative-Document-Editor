import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionManager } from '../src/rooms/version-manager';
import { prisma } from '@collabdoc/database';
import { roomManager } from '../src/rooms/room-manager';
import * as Y from 'yjs';

// Mock dependencies
vi.mock('@collabdoc/database', () => ({
  prisma: {
    $transaction: vi.fn(),
    documentSnapshot: {
      findFirst: vi.fn(),
    },
    document: {
      findUnique: vi.fn(),
    },
    documentVersion: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../src/rooms/room-manager', () => ({
  roomManager: {
    getRoom: vi.fn(),
  },
}));

describe('VersionManager', () => {
  let versionManager: VersionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    versionManager = new VersionManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startVersionTimer', () => {
    it('should start a periodic timer and create AUTO versions', async () => {
      const documentId = 'doc-1';
      const mockRoom = { isEmpty: false, getFullState: vi.fn(), doc: new Y.Doc() };
      vi.mocked(roomManager.getRoom).mockReturnValue(mockRoom as any);

      // Spy on createVersion
      const createVersionSpy = vi.spyOn(versionManager, 'createVersion').mockResolvedValue();

      versionManager.startVersionTimer(documentId);

      expect(createVersionSpy).not.toHaveBeenCalled();

      // Fast forward 30 minutes
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

      expect(createVersionSpy).toHaveBeenCalledTimes(1);
      expect(createVersionSpy).toHaveBeenCalledWith(documentId, 'AUTO');

      // Cleanup
      versionManager.clearVersionTimer(documentId);
    });
  });

  describe('createVersion', () => {
    it('should create a version from active room state', async () => {
      const documentId = 'doc-2';
      const doc = new Y.Doc();
      const fragment = doc.getXmlFragment('default');
      const paragraph = new Y.XmlElement('paragraph');
      const text = new Y.XmlText('Hello world');
      paragraph.insert(0, [text]);
      fragment.insert(0, [paragraph]);

      const mockRoom = {
        isEmpty: false,
        getFullState: () => Y.encodeStateAsUpdate(doc),
        doc,
      };

      vi.mocked(roomManager.getRoom).mockReturnValue(mockRoom as any);

      // Mock transaction behavior
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(prisma as any);
      });

      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: documentId,
        ownerId: 'user-1',
        title: 'My Doc',
      } as any);

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.documentVersion.findMany).mockResolvedValue([]);

      await versionManager.createVersion(documentId, 'MANUAL');

      expect(prisma.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentId,
            createdBy: 'user-1',
            versionNum: 1,
            trigger: 'MANUAL',
            wordCount: 2,
            plainText: expect.stringContaining('Hello world'),
          }),
        }),
      );
    });
  });
});
