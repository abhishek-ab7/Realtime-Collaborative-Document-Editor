'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { createDocumentSchema, updateDocumentSchema } from '@collabdoc/shared';
import * as Y from 'yjs';

// ─── CREATE DOCUMENT ───
export async function createDocument(formData?: { title?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const input = createDocumentSchema.parse(formData ?? {});

  // Create empty Yjs doc snapshot
  const ydoc = new Y.Doc();
  const emptyState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  const stateVector = Buffer.from(Y.encodeStateVector(ydoc));

  const document = await prisma.document.create({
    data: {
      ownerId: session.user.id,
      title: input.title || 'Untitled Document',
      lastAccessedAt: new Date(),
    },
  });

  // Create initial snapshot
  await prisma.documentSnapshot.create({
    data: {
      documentId: document.id,
      yjsState: emptyState,
      stateVector: stateVector,
      byteSize: emptyState.length,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId: document.id,
      userId: session.user.id,
      action: 'DOCUMENT_CREATED',
    },
  });

  revalidatePath('/dashboard');
  return document;
}

// ─── UPDATE DOCUMENT ───
export async function updateDocument(
  documentId: string,
  data: {
    title?: string;
    isStarred?: boolean;
    status?: 'ACTIVE' | 'TRASHED';
  },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const input = updateDocumentSchema.parse(data);

  // Verify ownership or collaboration (only owner can rename or trash, but let's check ownership for update)
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');
  if (doc.ownerId !== session.user.id) throw new Error('Forbidden');

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: input.title !== undefined ? input.title : undefined,
      isStarred: input.isStarred !== undefined ? input.isStarred : undefined,
      status: input.status !== undefined ? input.status : undefined,
      ...(input.status === 'TRASHED' ? { deletedAt: new Date() } : {}),
      ...(input.status === 'ACTIVE' ? { deletedAt: null } : {}),
    },
  });

  // Activity log for meaningful actions
  if (input.title) {
    await prisma.activityLog.create({
      data: {
        documentId,
        userId: session.user.id,
        action: 'DOCUMENT_RENAMED',
        metadata: { oldTitle: doc.title, newTitle: input.title },
      },
    });
  }
  if (input.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId, userId: session.user.id, action: 'DOCUMENT_TRASHED' },
    });
  }
  if (input.status === 'ACTIVE' && doc.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId, userId: session.user.id, action: 'DOCUMENT_RESTORED' },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/trash');
  return updated;
}

// ─── DELETE DOCUMENT (permanent) ───
export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');
  if (doc.ownerId !== session.user.id) throw new Error('Forbidden');
  if (doc.status !== 'TRASHED') throw new Error('Document must be trashed first');

  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath('/trash');
}

// ─── DUPLICATE DOCUMENT ───
export async function duplicateDocument(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const original = await prisma.document.findUnique({ where: { id: documentId } });
  if (!original) throw new Error('Document not found');

  // Check access (owner or collaborator)
  if (original.ownerId !== session.user.id) {
    const collab = await prisma.collaborator.findUnique({
      where: { documentId_userId: { documentId, userId: session.user.id } },
    });
    if (!collab) throw new Error('Forbidden');
  }

  // Get latest snapshot
  const snapshot = await prisma.documentSnapshot.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });

  // Create new document
  const newDoc = await prisma.document.create({
    data: {
      ownerId: session.user.id,
      title: `${original.title} — Copy`,
      wordCount: original.wordCount,
      lastAccessedAt: new Date(),
    },
  });

  // Copy snapshot
  if (snapshot) {
    await prisma.documentSnapshot.create({
      data: {
        documentId: newDoc.id,
        yjsState: snapshot.yjsState,
        stateVector: snapshot.stateVector,
        byteSize: snapshot.byteSize,
      },
    });
  }

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId: newDoc.id,
      userId: session.user.id,
      action: 'DOCUMENT_DUPLICATED',
      metadata: { sourceDocumentId: documentId },
    },
  });

  revalidatePath('/dashboard');
  return newDoc;
}

// ─── SEARCH DOCUMENTS ───
export async function searchDocuments(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return prisma.document.findMany({
    where: {
      ownerId: session.user.id,
      status: 'ACTIVE',
      title: { contains: query, mode: 'insensitive' },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
}
