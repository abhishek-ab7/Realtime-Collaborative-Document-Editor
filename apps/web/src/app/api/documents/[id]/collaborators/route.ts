import { NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { canManageCollaborators } from '@collabdoc/shared';
import { getDocumentRole } from '@/lib/permissions';
import { auth } from '@/lib/auth';

// GET /api/documents/[id]/collaborators — List all collaborators + owner
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);
  if (!role) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const collaborators = await prisma.collaborator.findMany({
    where: { documentId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    owner: { ...doc!.owner, role: 'OWNER' as const },
    collaborators: collaborators.map((c) => ({
      ...c.user,
      role: c.role,
      addedAt: c.createdAt,
    })),
  });
}

// POST /api/documents/[id]/collaborators — Add collaborator by email
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;
  const callerRole = await getDocumentRole(documentId, session.user.id);

  if (!canManageCollaborators(callerRole)) {
    return NextResponse.json({ error: 'Only the owner can manage collaborators' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!role || !['EDITOR', 'VIEWER'].includes(role)) {
    return NextResponse.json({ error: 'Role must be EDITOR or VIEWER' }, { status: 400 });
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: 'User not found. They must sign up first.' },
      { status: 404 },
    );
  }

  // Cannot add owner as collaborator
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (user.id === doc?.ownerId) {
    return NextResponse.json(
      { error: 'Cannot add document owner as collaborator' },
      { status: 400 },
    );
  }

  // Upsert collaborator (update role if already exists)
  const collaborator = await prisma.collaborator.upsert({
    where: { documentId_userId: { documentId, userId: user.id } },
    update: { role },
    create: {
      documentId,
      userId: user.id,
      role,
      invitedBy: session.user.id,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'COLLABORATOR_ADDED',
      metadata: { collaboratorEmail: email, collaboratorId: user.id, role },
    },
  });

  return NextResponse.json(
    {
      id: collaborator.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: collaborator.role,
      addedAt: collaborator.createdAt,
    },
    { status: 201 },
  );
}
