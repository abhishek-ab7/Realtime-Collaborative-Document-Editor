import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import { logger } from '../lib/logger';

export function registerAwarenessHandlers(_io: Server, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  // ─── AWARENESS UPDATE (cursor position, user status, etc.) ───
  socket.on('awareness-update', (documentId: string, update: ArrayBuffer | Uint8Array) => {
    const room = roomManager.getRoom(documentId);
    if (!room) return;

    // Verify user is in this room
    if (!room.users.has(socket.id)) return;

    // Broadcast awareness update to all OTHER clients in the room
    const updateArray = new Uint8Array(update);
    socket.to(documentId).emit('awareness-update', updateArray);

    logger.trace(
      {
        documentId,
        userId: authSocket.userId,
        bytes: updateArray.byteLength,
      },
      'Awareness update broadcast',
    );
  });
}
