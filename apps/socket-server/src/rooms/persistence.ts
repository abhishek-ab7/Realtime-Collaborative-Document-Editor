import { prisma } from '@collabdoc/database';
import { MAX_SNAPSHOTS_PER_DOCUMENT } from '@collabdoc/shared';
import { logger } from '../lib/logger';
import { extractPlainText, countWords } from '@collabdoc/shared';
import * as Y from 'yjs';

/** Load the latest Yjs state from PostgreSQL */
export async function loadDocumentState(documentId: string): Promise<Uint8Array | null> {
  try {
    const snapshot = await prisma.documentSnapshot.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: { yjsState: true },
    });

    if (!snapshot?.yjsState) return null;

    return new Uint8Array(snapshot.yjsState);
  } catch (error) {
    logger.error({ documentId, error }, 'Failed to load document state');
    return null;
  }
}

/** Save Yjs state to PostgreSQL, updating word count and GC-ing old snapshots */
export async function saveDocumentState(
  documentId: string,
  state: Uint8Array,
  stateVector: Uint8Array,
  doc?: Y.Doc,
): Promise<void> {
  const stateBuffer = Buffer.from(state);
  const vectorBuffer = Buffer.from(stateVector);

  // Derive word count from the live doc if provided
  const wordCount = doc ? countWords(extractPlainText(doc)) : undefined;

  await prisma.$transaction(async (tx) => {
    // Create new snapshot
    await tx.documentSnapshot.create({
      data: {
        documentId,
        yjsState: stateBuffer,
        stateVector: vectorBuffer,
        byteSize: stateBuffer.length,
      },
    });

    // Update document metadata (updatedAt + optional wordCount)
    await tx.document.update({
      where: { id: documentId },
      data: {
        updatedAt: new Date(),
        ...(wordCount !== undefined && { wordCount }),
      },
    });

    // Garbage collect old snapshots (keep last N)
    const snapshots = await tx.documentSnapshot.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
      skip: MAX_SNAPSHOTS_PER_DOCUMENT,
    });

    if (snapshots.length > 0) {
      await tx.documentSnapshot.deleteMany({
        where: { id: { in: snapshots.map((s) => s.id) } },
      });
      logger.debug({ documentId, deleted: snapshots.length }, 'Garbage collected old snapshots');
    }
  });
}

/** Save with retry (exponential backoff, max 3 attempts) */
export async function saveDocumentStateWithRetry(
  documentId: string,
  state: Uint8Array,
  stateVector: Uint8Array,
  doc?: Y.Doc,
  maxRetries = 3,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await saveDocumentState(documentId, state, stateVector, doc);
      return true;
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.warn({ documentId, attempt, maxRetries, delay, error }, 'Save failed, retrying...');
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error({ documentId }, 'All save retries exhausted');
  return false;
}
