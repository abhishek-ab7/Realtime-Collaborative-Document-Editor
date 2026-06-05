/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock shared library functions
vi.mock('@collabdoc/shared', () => {
  return {
    extractPlainText: vi.fn((doc) => {
      const xmlFragment = doc.getXmlFragment('default');
      if (xmlFragment && xmlFragment.length > 0) {
        let text = '';
        for (let i = 0; i < xmlFragment.length; i++) {
          const child = xmlFragment.get(i);
          if (child instanceof Y.XmlText) {
            text += child.toString();
          } else if (child instanceof Y.XmlElement) {
            const childText = child.get(0);
            if (childText instanceof Y.XmlText) {
              text += childText.toString();
            }
          }
        }
        return text;
      }
      return 'Hello brave new world!';
    }),
    countWords: vi.fn((text) => text.trim().split(/\s+/).filter(Boolean).length),
    computeDiff: vi.fn((oldText, newText) => {
      if (oldText === 'Hello world!' && newText === 'Hello brave new world!') {
        return [
          { value: 'Hello ', added: undefined, removed: undefined },
          { value: 'brave new ', added: true, removed: undefined },
          { value: 'world', added: undefined, removed: undefined },
          { value: '!', added: undefined, removed: undefined },
        ];
      }
      return [
        { value: oldText, removed: true },
        { value: newText, added: true },
      ];
    }),
  };
});

// Mock Database
vi.mock('@collabdoc/database', () => {
  const mockPrisma = {
    document: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    documentVersion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    documentSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  };
  return { prisma: mockPrisma };
});

import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';

// Import handlers
import { GET as getVersions, POST as postVersions } from '@/app/api/documents/[id]/versions/route';
import { GET as getVersion } from '@/app/api/documents/[id]/versions/[versionId]/route';
import { GET as getDiff } from '@/app/api/documents/[id]/versions/[versionId]/diff/route';
import { POST as restoreVersion } from '@/app/api/documents/[id]/versions/[versionId]/restore/route';

describe('Version API routes', () => {
  const mockUserId = 'user-123';
  const mockDocId = 'doc-456';
  const mockVersionId = 'ver-789';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/documents/[id]/versions', () => {
    test('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    test('returns 404 if document not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Document not found' });
    });

    test('returns 403 if user has no access to the document', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'different-user',
        collaborators: [],
      } as any);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'Forbidden' });
    });

    test('returns versions list successfully (as owner)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      const mockVersions = [
        {
          id: mockVersionId,
          versionNum: 1,
          titleAtTime: 'Test Doc',
          wordCount: 10,
          trigger: 'MANUAL',
          createdAt: new Date(),
          creator: { name: 'Test User', email: 'test@example.com', avatarUrl: null },
        },
      ];
      vi.mocked(prisma.documentVersion.findMany).mockResolvedValue(mockVersions as any);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(mockVersionId);
    });

    test('returns versions list successfully (as collaborator)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'owner-id',
        collaborators: [{ userId: mockUserId, role: 'VIEWER' }],
      } as any);

      vi.mocked(prisma.documentVersion.findMany).mockResolvedValue([]);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(200);
    });

    test('returns 500 on database connection failure', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockRejectedValue(new Error('Connection error'));

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await getVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/documents/[id]/versions', () => {
    test('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(401);
    });

    test('returns 404 if document not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(404);
    });

    test('returns 403 if user is collaborator but not EDITOR', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'different-user',
        collaborators: [{ userId: mockUserId, role: 'VIEWER' }],
      } as any);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(403);
    });

    test('returns 400 if no snapshot is available to version', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);
      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'No snapshot available to version' });
    });

    test('creates manual version successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        title: 'Document Title',
        collaborators: [],
      } as any);

      const ydoc = new Y.Doc();
      const xmlFragment = ydoc.getXmlFragment('default');
      const xmlText = new Y.XmlText();
      xmlText.insert(0, 'Hello world from test!');
      const xmlElement = new Y.XmlElement('paragraph');
      xmlElement.insert(0, [xmlText]);
      xmlFragment.insert(0, [xmlElement]);
      const mockState = Y.encodeStateAsUpdate(ydoc);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue({
        id: 'snap-1',
        yjsState: Buffer.from(mockState),
        byteSize: mockState.length,
      } as any);

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue({
        versionNum: 2,
      } as any);

      vi.mocked(prisma.documentVersion.create).mockImplementation((args: any) => {
        return Promise.resolve({
          id: mockVersionId,
          ...args.data,
        });
      });

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.versionNum).toBe(3);
      expect(data.createdBy).toBe(mockUserId);
      expect(data.trigger).toBe('MANUAL');
      expect(data.plainText).toBe('Hello world from test!');
      expect(data.titleAtTime).toBe('Document Title');
    });

    test('creates version successfully when version list is empty (sets versionNum = 1)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        title: 'Document Title',
        collaborators: [],
      } as any);

      const ydoc = new Y.Doc();
      const mockState = Y.encodeStateAsUpdate(ydoc);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue({
        id: 'snap-1',
        yjsState: Buffer.from(mockState),
        byteSize: mockState.length,
      } as any);

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.documentVersion.create).mockImplementation((args: any) =>
        Promise.resolve(args.data),
      );

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.versionNum).toBe(1);
    });

    test('returns 500 on database failure', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockRejectedValue(new Error('Internal database error'));

      const req = new NextRequest(`http://localhost/api/documents/${mockDocId}/versions`);
      const res = await postVersions(req, { params: Promise.resolve({ id: mockDocId }) });
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/documents/[id]/versions/[versionId]', () => {
    test('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      const res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(401);
    });

    test('returns 404 if document not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      const res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('returns 403 if user has no access', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'other-owner',
        collaborators: [],
      } as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      const res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(403);
    });

    test('returns 404 if version does not exist or documentId mismatch', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      // Version not found
      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue(null);
      let req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      let res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Version not found' });

      // DocumentId mismatch
      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue({
        id: mockVersionId,
        documentId: 'wrong-doc-id',
      } as any);
      req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('returns version details successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      const mockVersion = {
        id: mockVersionId,
        documentId: mockDocId,
        versionNum: 1,
        plainText: 'Hello',
        creator: { name: 'User', email: 'user@example.com' },
      };
      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue(mockVersion as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      const res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockVersion);
    });

    test('returns 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockRejectedValue(new Error('DB Fail'));

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}`,
      );
      const res = await getVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/documents/[id]/versions/[versionId]/diff', () => {
    test('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(401);
    });

    test('returns 404 if document not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('returns 403 if user has no access', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'other',
        collaborators: [],
      } as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(403);
    });

    test('returns 404 if version does not exist or documentId mismatch', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('returns computed diff between version and current state (with snapshot)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue({
        id: mockVersionId,
        documentId: mockDocId,
        plainText: 'Hello world!',
      } as any);

      const ydoc = new Y.Doc();
      ydoc.getText('prosemirror').insert(0, 'Hello brave new world!');
      const mockState = Y.encodeStateAsUpdate(ydoc);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue({
        yjsState: Buffer.from(mockState),
      } as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(200);

      const { diff } = await res.json();
      expect(diff).toBeDefined();
      expect(diff).toHaveLength(4); // "Hello ", "brave new ", "world", "!" / removals-additions
    });

    test('returns diff even if current snapshot is missing (diff against empty string)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue({
        id: mockVersionId,
        documentId: mockDocId,
        plainText: 'Hello world!',
      } as any);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(200);

      const { diff } = await res.json();
      expect(diff).toBeDefined();
    });

    test('returns 500 on database error during diff', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockRejectedValue(new Error('Internal DB failure'));

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/diff`,
      );
      const res = await getDiff(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/documents/[id]/versions/[versionId]/restore', () => {
    test('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(401);
    });

    test('returns 404 if document not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('returns 403 if user is collaborator but not EDITOR', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: 'different-owner',
        collaborators: [{ userId: mockUserId, role: 'VIEWER' }],
      } as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(403);
    });

    test('returns 404 if version does not exist or documentId mismatch', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(404);
    });

    test('restores version successfully with auto backup creation and socket notifications (happy path)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        title: 'Restoring Doc',
        wordCount: 100,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue({
        id: mockVersionId,
        documentId: mockDocId,
        versionNum: 1,
        yjsSnapshot: Buffer.from([1, 2, 3]),
        byteSize: 3,
        wordCount: 10,
      } as any);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue({
        id: 'snap-old',
        yjsState: Buffer.from([9, 8, 7]),
        byteSize: 3,
      } as any);

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue({
        versionNum: 4,
      } as any);

      vi.mocked(prisma.documentVersion.create).mockResolvedValue({} as any);
      vi.mocked(prisma.documentSnapshot.create).mockResolvedValue({} as any);
      vi.mocked(prisma.document.update).mockResolvedValue({} as any);

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(200);

      expect(await res.json()).toEqual({ success: true });
      expect(prisma.documentVersion.create).toHaveBeenCalled(); // Created backup version
      expect(prisma.documentSnapshot.create).toHaveBeenCalled(); // Inserted new snapshot
      expect(prisma.document.update).toHaveBeenCalled(); // Updated word count
      expect(global.fetch).toHaveBeenCalled(); // Called force-reload on socket server
    });

    test('restores version successfully even if socket server notification fails (catch block)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: mockDocId,
        ownerId: mockUserId,
        title: 'Restoring Doc',
        wordCount: 100,
        collaborators: [],
      } as any);

      vi.mocked(prisma.documentVersion.findUnique).mockResolvedValue({
        id: mockVersionId,
        documentId: mockDocId,
        versionNum: 1,
        yjsSnapshot: Buffer.from([1, 2, 3]),
        byteSize: 3,
        wordCount: 10,
      } as any);

      vi.mocked(prisma.documentSnapshot.findFirst).mockResolvedValue(null); // No backup version created

      vi.mocked(prisma.documentSnapshot.create).mockResolvedValue({} as any);
      vi.mocked(prisma.document.update).mockResolvedValue({} as any);

      // Force fetch to reject/fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Socket server offline'));

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(prisma.documentVersion.create).not.toHaveBeenCalled(); // No current snapshot so no backup
    });

    test('returns 500 on database transaction/query error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(prisma.document.findUnique).mockRejectedValue(new Error('Transaction timeout'));

      const req = new NextRequest(
        `http://localhost/api/documents/${mockDocId}/versions/${mockVersionId}/restore`,
      );
      const res = await restoreVersion(req, {
        params: Promise.resolve({ id: mockDocId, versionId: mockVersionId }),
      });
      expect(res.status).toBe(500);
    });
  });
});
