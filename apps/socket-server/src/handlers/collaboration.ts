import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import * as Y from 'yjs';
import { logger } from '../lib/logger';

export function registerCollaborationHandlers(_io: Server, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  // ─── YJS UPDATE (from client) ───
  socket.on('yjs-update', (documentId: string, update: ArrayBuffer | Uint8Array) => {
    const room = roomManager.getRoom(documentId);
    if (!room) return;

    // Verify user is in this room
    if (!room.users.has(socket.id)) return;

    // Check edit permission
    type SocketWithMetadata = typeof socket & { __role?: string | null };
    const metaSocket = socket as SocketWithMetadata;
    const role = metaSocket.__role;
    if (role === 'VIEWER') return; // Silently ignore viewer edits

    try {
      const updateArray = new Uint8Array(update);

      // Apply update to server-side Y.Doc
      Y.applyUpdate(room.doc, updateArray, socket.id);

      // Broadcast to all OTHER clients in the room
      socket.to(documentId).emit('yjs-update', updateArray);

      logger.debug(
        {
          documentId,
          userId: authSocket.userId,
          bytes: updateArray.byteLength,
        },
        'Yjs update applied and broadcast',
      );
    } catch (error) {
      logger.error(
        {
          documentId,
          userId: authSocket.userId,
          error,
        },
        'Failed to apply Yjs update',
      );
    }
  });
}
