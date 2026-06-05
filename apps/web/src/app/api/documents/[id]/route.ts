import { prisma } from '@collabdoc/database';
import { updateDocumentSchema } from '@collabdoc/shared';
import { canDeleteDocument, canRenameDocument, canEditDocument } from '@collabdoc/shared';
import { withPermission } from '@/lib/permissions';

// GET /api/documents/[id] — Retrieve a single document (requires VIEWER)
export const GET = withPermission('VIEWER', async (_request, { params, role }) => {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      },
    },
  });

  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  return Response.json({ ...document, currentUserRole: role });
});

// PATCH /api/documents/[id] — Update a document
export const PATCH = withPermission('VIEWER', async (request, { params, userId, role }) => {
  const body = await request.json();
  const input = updateDocumentSchema.parse(body);

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  // Rename requires OWNER
  if (input.title !== undefined && !canRenameDocument(role)) {
    return Response.json({ error: 'Only the owner can rename documents' }, { status: 403 });
  }

  // Trash/restore requires OWNER
  if (input.status !== undefined && !canDeleteDocument(role)) {
    return Response.json({ error: 'Only the owner can trash/restore documents' }, { status: 403 });
  }

  // Star/unstar requires at least VIEWER (any access level)
  // isStarred is allowed for all roles

  // Editors can only toggle isStarred
  if (!canEditDocument(role) && (input.title !== undefined || input.status !== undefined)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      title: input.title !== undefined ? input.title : undefined,
      isStarred: input.isStarred !== undefined ? input.isStarred : undefined,
      status: input.status !== undefined ? input.status : undefined,
      ...(input.status === 'TRASHED' ? { deletedAt: new Date() } : {}),
      ...(input.status === 'ACTIVE' ? { deletedAt: null } : {}),
    },
  });

  // Activity logs for meaningful actions
  if (input.title) {
    await prisma.activityLog.create({
      data: {
        documentId: params.id,
        userId,
        action: 'DOCUMENT_RENAMED',
        metadata: { oldTitle: doc.title, newTitle: input.title },
      },
    });
  }
  if (input.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId: params.id, userId, action: 'DOCUMENT_TRASHED' },
    });
  }
  if (input.status === 'ACTIVE' && doc.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId: params.id, userId, action: 'DOCUMENT_RESTORED' },
    });
  }

  return Response.json(updated);
});

// DELETE /api/documents/[id] — Permanently delete a document (requires OWNER)
export const DELETE = withPermission('OWNER', async (_request, { params }) => {
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }
  if (doc.status !== 'TRASHED') {
    return Response.json({ error: 'Document must be trashed first' }, { status: 400 });
  }

  await prisma.document.delete({ where: { id: params.id } });
  return Response.json({ success: true });
});
