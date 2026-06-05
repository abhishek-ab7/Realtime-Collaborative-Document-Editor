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
  canManageCollaborators: vi.fn((role: string | null) => role === 'OWNER'),
}));

// Mock database
vi.mock('@collabdoc/database', () => {
  const mockPrisma = {
    document: { findUnique: vi.fn() },
    collaborator: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    activityLog: { create: vi.fn() },
  };
  return { prisma: mockPrisma };
});

import { auth } from '@/lib/auth';
import { getDocumentRole } from '@/lib/permissions';
import { prisma } from '@collabdoc/database';
import { GET, POST } from '@/app/api/documents/[id]/collaborators/route';
import { PATCH, DELETE } from '@/app/api/documents/[id]/collaborators/[userId]/route';

describe('Collaborators API', () => {
  const mockOwner = {
    id: 'owner-1',
    name: 'Alice Owner',
    email: 'alice@test.com',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'owner-1' } } as any);
  });

  // ─── GET /api/documents/[id]/collaborators ───
  describe('GET — List collaborators', () => {
    test('returns owner and collaborators for authorized user', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.collaborator.findMany).mockResolvedValue([
        {
          user: { id: 'user-2', name: 'Bob', email: 'bob@test.com', avatarUrl: null },
          role: 'EDITOR',
          createdAt: new Date('2024-01-01'),
        },
      ] as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        owner: mockOwner,
      } as any);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators');
      const response = await GET(request, { params: Promise.resolve({ id: 'doc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.owner.role).toBe('OWNER');
      expect(data.collaborators).toHaveLength(1);
      expect(data.collaborators[0].role).toBe('EDITOR');
    });

    test('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators');
      const response = await GET(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(401);
    });

    test('returns 404 when user has no access', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue(null);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators');
      const response = await GET(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(404);
    });
  });

  // ─── POST /api/documents/[id]/collaborators ───
  describe('POST — Add collaborator', () => {
    test('adds a collaborator successfully as owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        name: 'Bob',
        email: 'bob@test.com',
        avatarUrl: null,
      } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        ownerId: 'owner-1',
      } as any);
      vi.mocked(prisma.collaborator.upsert).mockResolvedValue({
        id: 'collab-1',
        role: 'EDITOR',
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators', {
        method: 'POST',
        body: JSON.stringify({ email: 'bob@test.com', role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(201);
      expect(prisma.collaborator.upsert).toHaveBeenCalled();
      expect(prisma.activityLog.create).toHaveBeenCalled();
    });

    test('returns 403 when non-owner tries to add', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('EDITOR');

      const request = new Request('http://localhost/api/documents/doc-1/collaborators', {
        method: 'POST',
        body: JSON.stringify({ email: 'bob@test.com', role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(403);
    });

    test('returns 404 when invited user does not exist', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@test.com', role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('sign up first');
    });

    test('returns 400 when adding owner as collaborator', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'owner-1',
        email: 'alice@test.com',
      } as any);
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        ownerId: 'owner-1',
      } as any);

      const request = new Request('http://localhost/api/documents/doc-1/collaborators', {
        method: 'POST',
        body: JSON.stringify({ email: 'alice@test.com', role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(400);
    });

    test('returns 400 for invalid role', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');

      const request = new Request('http://localhost/api/documents/doc-1/collaborators', {
        method: 'POST',
        body: JSON.stringify({ email: 'bob@test.com', role: 'ADMIN' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'doc-1' }) });

      expect(response.status).toBe(400);
    });
  });

  // ─── PATCH /api/documents/[id]/collaborators/[userId] ───
  describe('PATCH — Change role', () => {
    test('changes collaborator role as owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.collaborator.findUnique).mockResolvedValue({
        role: 'VIEWER',
      } as any);
      vi.mocked(prisma.collaborator.update).mockResolvedValue({
        role: 'EDITOR',
      } as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'doc-1', userId: 'user-2' }),
      });

      expect(response.status).toBe(200);
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'COLLABORATOR_ROLE_CHANGED',
          }),
        }),
      );
    });

    test('returns 403 when non-owner tries to change role', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('EDITOR');

      const request = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'VIEWER' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'doc-1', userId: 'user-2' }),
      });

      expect(response.status).toBe(403);
    });

    test('returns 404 when collaborator does not exist', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.collaborator.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'EDITOR' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'doc-1', userId: 'nonexistent' }),
      });

      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE /api/documents/[id]/collaborators/[userId] ───
  describe('DELETE — Remove collaborator', () => {
    test('removes collaborator as owner', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('OWNER');
      vi.mocked(prisma.collaborator.findUnique).mockResolvedValue({
        user: { email: 'bob@test.com' },
      } as any);
      vi.mocked(prisma.collaborator.delete).mockResolvedValue({} as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const request = new Request('http://localhost', { method: 'DELETE' });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'doc-1', userId: 'user-2' }),
      });

      expect(response.status).toBe(200);
      expect(prisma.collaborator.delete).toHaveBeenCalled();
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'COLLABORATOR_REMOVED',
          }),
        }),
      );
    });

    test('returns 403 when non-owner tries to remove', async () => {
      vi.mocked(getDocumentRole).mockResolvedValue('VIEWER');

      const request = new Request('http://localhost', { method: 'DELETE' });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'doc-1', userId: 'user-2' }),
      });

      expect(response.status).toBe(403);
    });
  });
});
