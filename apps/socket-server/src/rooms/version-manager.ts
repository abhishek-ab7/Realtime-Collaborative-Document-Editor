import { prisma } from '@collabdoc/database';
import { logger } from '../lib/logger';
import { extractPlainText, countWords } from '@collabdoc/shared';
import { roomManager } from './room-manager';
import * as Y from 'yjs';

const AUTO_VERSION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VERSIONS_PER_DOCUMENT = 100;

export class VersionManager {
  private versionTimers: Map<string, NodeJS.Timeout> = new Map();

  /** Start a periodic version snapshot timer for a document */
  startVersionTimer(documentId: string): void {
    const existing = this.versionTimers.get(documentId);
    if (existing) clearInterval(existing);

    const timer = setInterval(async () => {
      const room = roomManager.getRoom(documentId);
      if (room && !room.isEmpty) {
        // Only create a version if there have been updates since the last version?
        // Let's just create it. The UI can filter if necessary.
        await this.createVersion(documentId, 'AUTO');
      }
    }, AUTO_VERSION_INTERVAL_MS);

    this.versionTimers.set(documentId, timer);
  }

  /** Clear the version timer */
  clearVersionTimer(documentId: string): void {
    const timer = this.versionTimers.get(documentId);
    if (timer) {
      clearInterval(timer);
      this.versionTimers.delete(documentId);
    }
  }

  /** Manually or automatically create a named/numbered version */
  async createVersion(
    documentId: string,
    trigger: 'AUTO' | 'MANUAL' | 'ROOM_TEARDOWN' | 'RESTORE_BACKUP',
    overrideUserId?: string,
  ): Promise<void> {
    const room = roomManager.getRoom(documentId);

    // We need the Yjs state. If room is not in memory, we could load from DB,
    // but typically versions are created when the room is active or tearing down.
    let yjsState: Uint8Array;
    let doc: Y.Doc | undefined;

    if (room) {
      yjsState = room.getFullState();
      doc = room.doc;
    } else {
      // Fetch latest snapshot from DB as fallback
      const snapshot = await prisma.documentSnapshot.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
      });
      if (!snapshot) {
        logger.warn({ documentId }, 'Cannot create version: no active room and no snapshot found');
        return;
      }
      yjsState = new Uint8Array(snapshot.yjsState);
      doc = new Y.Doc();
      Y.applyUpdate(doc, yjsState);
    }

    const plainText = extractPlainText(doc);
    const wordCount = countWords(plainText);
    const stateBuffer = Buffer.from(yjsState);

    try {
      await prisma.$transaction(async (tx) => {
        // Fetch document to get ownerId and current title
        const document = await tx.document.findUnique({
          where: { id: documentId },
          select: { ownerId: true, title: true },
        });

        if (!document) {
          throw new Error('Document not found');
        }

        const createdBy = overrideUserId || document.ownerId;

        // Get the next version number
        const lastVersion = await tx.documentVersion.findFirst({
          where: { documentId },
          orderBy: { versionNum: 'desc' },
          select: { versionNum: true },
        });
        const nextVersionNum = (lastVersion?.versionNum ?? 0) + 1;

        // Create the new version
        await tx.documentVersion.create({
          data: {
            documentId,
            createdBy,
            versionNum: nextVersionNum,
            yjsSnapshot: stateBuffer,
            plainText,
            titleAtTime: document.title,
            byteSize: stateBuffer.length,
            wordCount,
            trigger,
          },
        });

        // Garbage collect old versions
        const versions = await tx.documentVersion.findMany({
          where: { documentId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
          skip: MAX_VERSIONS_PER_DOCUMENT,
        });

        if (versions.length > 0) {
          await tx.documentVersion.deleteMany({
            where: { id: { in: versions.map((v) => v.id) } },
          });
        }
      });

      logger.info({ documentId, trigger }, 'Version created successfully');
    } catch (error) {
      logger.error({ documentId, trigger, error }, 'Failed to create document version');
    }
  }
}

export const versionManager = new VersionManager();
