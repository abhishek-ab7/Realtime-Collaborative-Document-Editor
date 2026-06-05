import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import { prisma } from '@collabdoc/database';
import { canViewDocument } from '@collabdoc/shared';
import { logger } from '../lib/logger';
import { cleanupAwarenessThrottle } from './awareness';

export function registerRoomHandlers(io: Server, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  // ─── JOIN ROOM ───
  socket.on(
    'join-room',
    async (
      documentId: string,
      callback: (response: {
        success: boolean;
        error?: string;
        state?: Uint8Array;
        users?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
      }) => void,
    ) => {
      try {
        // 1. Verify document exists
        const doc = await prisma.document.findUnique({
          where: { id: documentId },
          select: { id: true, ownerId: true, status: true },
        });

        if (!doc || doc.status !== 'ACTIVE') {
          return callback({ success: false, error: 'Document not found' });
        }

        // 2. Check permissions
        let role: string | null = null;
        if (doc.ownerId === authSocket.userId) {
          role = 'OWNER';
        } else {
          const collab = await prisma.collaborator.findUnique({
            where: {
              documentId_userId: { documentId, userId: authSocket.userId },
            },
            select: { role: true },
          });
          role = collab?.role ?? null;
        }

        if (!canViewDocument(role)) {
          return callback({ success: false, error: 'Access denied' });
        }

        // 3. Get or create room
        const room = await roomManager.getOrCreateRoom(documentId);

        // 4. Join Socket.io room
        socket.join(documentId);

        // 5. Register user in room
        room.addUser({
          socketId: socket.id,
          userId: authSocket.userId,
          userName: authSocket.userName,
          userEmail: authSocket.userEmail,
          userAvatarUrl: authSocket.userAvatarUrl,
          joinedAt: new Date(),
        });

        // 6. Notify other users
        socket.to(documentId).emit('user-joined', {
          userId: authSocket.userId,
          name: authSocket.userName,
          avatarUrl: authSocket.userAvatarUrl,
        });

        // 7. Send initial state
        const state = room.getFullState();
        const currentUsers = Array.from(room.users.values()).map((u) => ({
          userId: u.userId,
          name: u.userName,
          avatarUrl: u.userAvatarUrl,
        }));

        callback({
          success: true,
          state: state,
          users: currentUsers,
        });

        // 8. Store user metadata on socket for cleanup
        (socket as any).__rooms = (socket as any).__rooms || new Set<string>();
        (socket as any).__rooms.add(documentId);
        (socket as any).__role = role;

        logger.info(
          {
            documentId,
            userId: authSocket.userId,
            role,
            roomUsers: room.users.size,
          },
          'User joined room',
        );
      } catch (error) {
        logger.error({ documentId, error }, 'Error joining room');
        callback({ success: false, error: 'Internal error' });
      }
    },
  );

  // ─── LEAVE ROOM ───
  socket.on('leave-room', (documentId: string) => {
    handleLeaveRoom(io, socket, documentId);
  });
}

export function handleLeaveRoom(_io: Server, socket: Socket, documentId: string) {
  const authSocket = socket as AuthenticatedSocket;
  const room = roomManager.getRoom(documentId);

  if (room) {
    const user = room.removeUser(socket.id);
    socket.leave(documentId);
    cleanupAwarenessThrottle(documentId, socket.id);

    // Notify others
    if (user) {
      socket.to(documentId).emit('user-left', {
        userId: user.userId,
        name: user.userName,
      });
    }

    // Schedule teardown if empty
    if (room.isEmpty) {
      roomManager.scheduleRoomTeardown(documentId);
    }
  }

  // Clean up socket metadata
  const rooms = (socket as any).__rooms as Set<string> | undefined;
  if (rooms) {
    rooms.delete(documentId);
  }

  logger.info({ documentId, userId: authSocket.userId }, 'User left room');
}
