/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock permissions
vi.mock('@/lib/permissions', () => ({
  getDocumentRole: vi.fn(),
}));

// Mock shared
vi.mock('@collabdoc/shared', () => ({
  canShareDocument: vi.fn((role: string | null) => role === 'OWNER'),
  SHARE_TOKEN_BYTES: 32,
}));

// Mock share-token
vi.mock('@/lib/share-token', () => ({
  generateShareToken: vi.fn(() => ({
    rawToken: 'test-raw-token-abc123',
    tokenHash: 'hash-abc123',
  })),
}));

// Mock database
vi.mock('@collabdoc/database', () => {
  const mockPrisma = {
    shareLink: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    activityLog: { create: vi.fn() },
  };
  return { prisma: mockPrisma };
});

import { auth } from '@/lib/auth';
import { getDocumentRole } from '@/lib/permissions';
import { prisma } from '@collabdoc/database';
import { GET, POST, DELETE } from '@/app/api/documents/[id]/share/link/route';

describe('Share Link API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'owner-1' } } as any);
  });

  // ─── GET /api/documents/[id]/share/link ───
  describe('GET — List share links', () => {
    test('returns active share links for owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.shareLink.findMany).mockResolvedValue([
        {
          id: 'link-1',
          permission: 'VIEW',
          expiresAt: null,
          createdAt: new Date(),
          isActive: true,
        },
      ] as any);

      const request = new Request('http://localhost');
      const response = await GET(request, { params: Promise.resolve({ id: 'doc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.links).toHaveLength(1);
      expect(data.links[0].permission).toBe('VIEW');
    });

    test('returns 403 for non-owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('EDITOR');

      const request = new Request('http://localhost');
      const response = await GET(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(403);
    });
  });

  // ─── POST /api/documents/[id]/share/link ───
  describe('POST — Generate share link', () => {
    test('creates a VIEW share link with no expiration', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.shareLink.create).mockResolvedValue({
        id: 'link-1',
        permission: 'VIEW',
        expiresAt: null,
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ permission: 'VIEW', expiresIn: 'never' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.shareUrl).toContain('/share/test-raw-token-abc123');
      expect(prisma.activityLog.create).toHaveBeenCalled();
    });

    test('creates an EDIT share link with 7d expiration', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.shareLink.create).mockResolvedValue({
        id: 'link-2',
        permission: 'EDIT',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ permission: 'EDIT', expiresIn: '7d' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(201);
      expect(prisma.shareLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permission: 'EDIT',
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });

    test('returns 400 for invalid permission', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ permission: 'ADMIN' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(400);
    });

    test('returns 403 for non-owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('VIEWER');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ permission: 'VIEW' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /api/documents/[id]/share/link ───
  describe('DELETE — Revoke share links', () => {
    test('revokes all active share links', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.shareLink.updateMany).mockResolvedValue({ count: 3 } as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'doc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revokedCount).toBe(3);
      expect(prisma.shareLink.updateMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-1', isActive: true },
        data: { isActive: false },
      });
    });

    test('returns 403 for non-owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('EDITOR');

      const request = new Request('http://localhost', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(403);
    });
  });
});
