import { NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { canManageCollaborators } from '@collabdoc/shared';
import { getDocumentRole } from '@/lib/permissions';
import { auth } from '@/lib/auth';

// PATCH /api/documents/[id]/collaborators/[userId] — Change collaborator role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId, userId: targetUserId } = await params;
  const callerRole = await getDocumentRole(documentId, session.user.id);

  if (!canManageCollaborators(callerRole)) {
    return NextResponse.json(
      { error: 'Only the owner can change collaborator roles' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { role } = body;

  if (!role || !['EDITOR', 'VIEWER'].includes(role)) {
    return NextResponse.json({ error: 'Role must be EDITOR or VIEWER' }, { status: 400 });
  }

  // Find existing collaborator
  const existing = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId, userId: targetUserId } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
  }

  const oldRole = existing.role;

  const updated = await prisma.collaborator.update({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    data: { role },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'COLLABORATOR_ROLE_CHANGED',
      metadata: { collaboratorId: targetUserId, oldRole, newRole: role },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/documents/[id]/collaborators/[userId] — Remove collaborator
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId, userId: targetUserId } = await params;
  const callerRole = await getDocumentRole(documentId, session.user.id);

  if (!canManageCollaborators(callerRole)) {
    return NextResponse.json({ error: 'Only the owner can remove collaborators' }, { status: 403 });
  }

  // Find existing collaborator
  const existing = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    include: { user: { select: { email: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
  }

  await prisma.collaborator.delete({
    where: { documentId_userId: { documentId, userId: targetUserId } },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'COLLABORATOR_REMOVED',
      metadata: {
        collaboratorId: targetUserId,
        collaboratorEmail: existing.user.email,
      },
    },
  });

  return NextResponse.json({ success: true });
}
