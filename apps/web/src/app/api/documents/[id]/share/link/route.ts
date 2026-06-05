import { NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { canShareDocument } from '@collabdoc/shared';
import { getDocumentRole } from '@/lib/permissions';
import { generateShareToken } from '@/lib/share-token';
import { auth } from '@/lib/auth';

const EXPIRY_MAP: Record<string, number | null> = {
  never: null,
  '1d': 1 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// GET /api/documents/[id]/share/link — List active share links
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);

  if (!canShareDocument(role)) {
    return NextResponse.json({ error: 'Only the owner can manage share links' }, { status: 403 });
  }

  const links = await prisma.shareLink.findMany({
    where: { documentId, isActive: true },
    select: {
      id: true,
      permission: true,
      expiresAt: true,
      createdAt: true,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ links });
}

// POST /api/documents/[id]/share/link — Generate a new share link
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);

  if (!canShareDocument(role)) {
    return NextResponse.json({ error: 'Only the owner can generate share links' }, { status: 403 });
  }

  const body = await request.json();
  const { permission, expiresIn } = body;

  if (!permission || !['VIEW', 'EDIT'].includes(permission)) {
    return NextResponse.json({ error: 'Permission must be VIEW or EDIT' }, { status: 400 });
  }

  if (expiresIn && !Object.keys(EXPIRY_MAP).includes(expiresIn)) {
    return NextResponse.json(
      { error: 'expiresIn must be one of: never, 1d, 7d, 30d' },
      { status: 400 },
    );
  }

  const expiryMs = EXPIRY_MAP[expiresIn || 'never'];
  const expiresAt = expiryMs ? new Date(Date.now() + expiryMs) : null;

  const { rawToken, tokenHash } = generateShareToken();

  const link = await prisma.shareLink.create({
    data: {
      documentId,
      createdBy: session.user.id,
      tokenHash,
      permission,
      expiresAt,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'SHARE_LINK_CREATED',
      metadata: { permission, expiresIn: expiresIn || 'never', linkId: link.id },
    },
  });

  // Build the full share URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${rawToken}`;

  return NextResponse.json(
    {
      id: link.id,
      shareUrl,
      permission: link.permission,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
    { status: 201 },
  );
}

// DELETE /api/documents/[id]/share/link — Revoke all active share links
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);

  if (!canShareDocument(role)) {
    return NextResponse.json({ error: 'Only the owner can revoke share links' }, { status: 403 });
  }

  const result = await prisma.shareLink.updateMany({
    where: { documentId, isActive: true },
    data: { isActive: false },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'SHARE_LINK_REVOKED',
      metadata: { revokedCount: result.count },
    },
  });

  return NextResponse.json({ success: true, revokedCount: result.count });
}
