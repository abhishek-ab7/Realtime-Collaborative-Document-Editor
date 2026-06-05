import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import { logger } from '../lib/logger';

// Throttling configuration: 33ms (approx 30 Hz)
const THROTTLE_MS = 33;

interface ThrottleState {
  lastSent: number;
  timer: NodeJS.Timeout | null;
  pendingUpdate: Uint8Array | null;
}

// Map: documentId -> socketId -> ThrottleState
const socketThrottles = new Map<string, Map<string, ThrottleState>>();

export function cleanupAwarenessThrottle(documentId: string, socketId: string) {
  const docThrottles = socketThrottles.get(documentId);
  if (docThrottles) {
    const throttleState = docThrottles.get(socketId);
    if (throttleState?.timer) {
      clearTimeout(throttleState.timer);
    }
    docThrottles.delete(socketId);
    if (docThrottles.size === 0) {
      socketThrottles.delete(documentId);
    }
  }
}

export function registerAwarenessHandlers(_io: Server, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  // ─── AWARENESS UPDATE (cursor position, user status, etc.) ───
  socket.on('awareness-update', (documentId: string, update: ArrayBuffer | Uint8Array) => {
    const room = roomManager.getRoom(documentId);
    if (!room) return;

    // Verify user is in this room
    if (!room.users.has(socket.id)) return;

    const updateArray = new Uint8Array(update);

    let docThrottles = socketThrottles.get(documentId);
    if (!docThrottles) {
      docThrottles = new Map();
      socketThrottles.set(documentId, docThrottles);
    }

    let throttleState = docThrottles.get(socket.id);
    if (!throttleState) {
      throttleState = { lastSent: 0, timer: null, pendingUpdate: null };
      docThrottles.set(socket.id, throttleState);
    }

    const now = Date.now();
    const elapsed = now - throttleState.lastSent;

    const broadcast = (data: Uint8Array) => {
      socket.to(documentId).emit('awareness-update', data);
      if (throttleState) {
        throttleState.lastSent = Date.now();
        throttleState.pendingUpdate = null;
        throttleState.timer = null;
      }
      logger.trace(
        {
          documentId,
          userId: authSocket.userId,
          bytes: data.byteLength,
        },
        'Awareness update broadcast',
      );
    };

    if (elapsed >= THROTTLE_MS) {
      if (throttleState.timer) {
        clearTimeout(throttleState.timer);
        throttleState.timer = null;
      }
      broadcast(updateArray);
    } else {
      throttleState.pendingUpdate = updateArray;
      if (!throttleState.timer) {
        const remaining = THROTTLE_MS - elapsed;
        throttleState.timer = setTimeout(() => {
          if (throttleState?.pendingUpdate) {
            broadcast(throttleState.pendingUpdate);
          }
        }, remaining);
      }
    }
  });
}
