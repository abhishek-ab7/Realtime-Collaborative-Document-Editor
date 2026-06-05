/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@collabdoc/database', () => {
  const mockPrisma = {
    document: { findUnique: vi.fn() },
    collaborator: { findUnique: vi.fn() },
  };
  return { prisma: mockPrisma };
});

// Mock shared
vi.mock('@collabdoc/shared', () => ({
  hasMinRole: vi.fn((userRole: string | null, requiredRole: string) => {
    const hierarchy: Record<string, number> = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
    if (!userRole) return false;
    return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 999);
  }),
}));

import { getDocumentRole, withPermission } from '@/lib/permissions';
import { prisma } from '@collabdoc/database';
import { auth } from '@/lib/auth';

describe('getDocumentRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns null when document does not exist', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

    const role = await getDocumentRole('doc-1', 'user-1');
    expect(role).toBeNull();
  });

  test('returns OWNER when user is the document owner', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'user-1',
    } as any);

    const role = await getDocumentRole('doc-1', 'user-1');
    expect(role).toBe('OWNER');
  });

  test('returns EDITOR when user is an editor collaborator', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'other-user',
    } as any);
    vi.mocked(prisma.collaborator.findUnique).mockResolvedValue({
      role: 'EDITOR',
    } as any);

    const role = await getDocumentRole('doc-1', 'user-1');
    expect(role).toBe('EDITOR');
  });

  test('returns VIEWER when user is a viewer collaborator', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'other-user',
    } as any);
    vi.mocked(prisma.collaborator.findUnique).mockResolvedValue({
      role: 'VIEWER',
    } as any);

    const role = await getDocumentRole('doc-1', 'user-1');
    expect(role).toBe('VIEWER');
  });

  test('returns null when user is not owner or collaborator', async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'other-user',
    } as any);
    vi.mocked(prisma.collaborator.findUnique).mockResolvedValue(null);

    const role = await getDocumentRole('doc-1', 'user-1');
    expect(role).toBeNull();
  });
});

describe('withPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const handler = vi.fn();
    const wrapped = withPermission('VIEWER', handler);

    const request = new Request('http://localhost/api/documents/doc-1');
    const response = await wrapped(request, {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  test('returns 404 when document does not exist (no role)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

    const handler = vi.fn();
    const wrapped = withPermission('VIEWER', handler);

    const request = new Request('http://localhost/api/documents/doc-1');
    const response = await wrapped(request, {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(response.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  test('returns 403 when user has insufficient permissions', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'other-user',
    } as any);
    vi.mocked(prisma.collaborator.findUnique).mockResolvedValue({
      role: 'VIEWER',
    } as any);

    const handler = vi.fn();
    const wrapped = withPermission('EDITOR', handler);

    const request = new Request('http://localhost/api/documents/doc-1');
    const response = await wrapped(request, {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  test('calls handler with correct context when user has sufficient role', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'user-1',
    } as any);

    const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const wrapped = withPermission('VIEWER', handler);

    const request = new Request('http://localhost/api/documents/doc-1');
    await wrapped(request, {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(handler).toHaveBeenCalledWith(request, {
      params: { id: 'doc-1' },
      userId: 'user-1',
      role: 'OWNER',
    });
  });

  test('OWNER role passes EDITOR permission check', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'owner-1' },
    } as any);
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      ownerId: 'owner-1',
    } as any);

    const handler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const wrapped = withPermission('EDITOR', handler);

    const request = new Request('http://localhost/api/documents/doc-1');
    const response = await wrapped(request, {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  test('returns 400 when document ID is missing', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const handler = vi.fn();
    const wrapped = withPermission('VIEWER', handler);

    const request = new Request('http://localhost/api/documents/');
    const response = await wrapped(request, {
      params: Promise.resolve({} as any),
    });

    expect(response.status).toBe(400);
  });
});
