# Phase 05 — Realtime Collaboration Engine (Yjs + Socket.io)

> **Days:** 15–21  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 04 (Editor)  
> **Milestone:** M5-REALTIME  
> **PRD Sections:** 5.3 (Collaborative Editing), 6 (Technical Architecture), 7 (CRDT Strategy)

---

## 1. Phase Objective

Wire the entire realtime collaboration stack: custom Yjs Socket.io provider, server-side room management, CRDT sync protocol, binary state persistence to PostgreSQL, and TipTap collaboration extensions. After this phase, **two users can edit the same document simultaneously with conflict-free merging.**

This is the most complex and critical phase of the project.

---

## 2. Day-by-Day Breakdown

### Day 15: Room Manager + Document Lifecycle on Server

| #    | Task                                                                    | Est. Time | Output                      |
| ---- | ----------------------------------------------------------------------- | --------- | --------------------------- |
| 15.1 | Design room data structure (`YjsRoom` class)                            | 30 min    | `rooms/yjs-room.ts`         |
| 15.2 | Build `RoomManager` (create/get/destroy rooms)                          | 60 min    | `rooms/room-manager.ts`     |
| 15.3 | Implement room lifecycle (create on first join, teardown after timeout) | 45 min    | Teardown timer logic        |
| 15.4 | Load Yjs state from PostgreSQL on room creation                         | 60 min    | `rooms/persistence.ts` load |
| 15.5 | Implement debounced save to PostgreSQL                                  | 60 min    | `rooms/persistence.ts` save |
| 15.6 | Unit tests for RoomManager                                              | 30 min    | 5 tests                     |

**Day 15 Total: ~5 hours**

#### `apps/socket-server/src/rooms/yjs-room.ts`

```typescript
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { logger } from '../lib/logger';

export interface RoomUser {
  socketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  joinedAt: Date;
}

export class YjsRoom {
  public readonly documentId: string;
  public readonly doc: Y.Doc;
  public readonly awareness: Awareness;
  public readonly users: Map<string, RoomUser> = new Map();

  private _updateCount = 0;
  private _lastSavedAt: Date | null = null;
  private _teardownTimer: NodeJS.Timeout | null = null;
  private _saveTimer: NodeJS.Timeout | null = null;
  private _onUpdate: ((update: Uint8Array, origin: unknown) => void) | null = null;
  private _onDestroy: (() => void) | null = null;

  constructor(documentId: string) {
    this.documentId = documentId;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);

    logger.info({ documentId }, 'Room created');
  }

  /** Apply binary state from database to the room's Y.Doc */
  applyStoredState(state: Uint8Array): void {
    Y.applyUpdate(this.doc, state);
    logger.info({ documentId: this.documentId, bytes: state.length }, 'Applied stored state');
  }

  /** Get the full state for persistence */
  getFullState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  /** Get the state vector for incremental sync */
  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.doc);
  }

  /** Register a user in this room */
  addUser(user: RoomUser): void {
    this.users.set(user.socketId, user);
    this.cancelTeardown();
    logger.info(
      { documentId: this.documentId, userId: user.userId, count: this.users.size },
      'User joined room',
    );
  }

  /** Remove a user from this room */
  removeUser(socketId: string): RoomUser | undefined {
    const user = this.users.get(socketId);
    this.users.delete(socketId);

    // Clean up awareness state for disconnected user
    if (user) {
      this.awareness.setLocalState(null);
      logger.info(
        { documentId: this.documentId, userId: user.userId, count: this.users.size },
        'User left room',
      );
    }

    return user;
  }

  /** Check if room is empty */
  get isEmpty(): boolean {
    return this.users.size === 0;
  }

  /** Get the number of updates since last save */
  get updateCount(): number {
    return this._updateCount;
  }

  incrementUpdateCount(): void {
    this._updateCount++;
  }

  resetUpdateCount(): void {
    this._updateCount = 0;
    this._lastSavedAt = new Date();
  }

  /** Schedule room teardown after delay */
  scheduleTeardown(delay: number, callback: () => void): void {
    this._onDestroy = callback;
    this._teardownTimer = setTimeout(() => {
      logger.info({ documentId: this.documentId }, 'Room teardown triggered');
      callback();
    }, delay);
  }

  cancelTeardown(): void {
    if (this._teardownTimer) {
      clearTimeout(this._teardownTimer);
      this._teardownTimer = null;
    }
  }

  /** Clean up all resources */
  destroy(): void {
    this.cancelTeardown();
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this.awareness.destroy();
    this.doc.destroy();
    logger.info({ documentId: this.documentId }, 'Room destroyed');
  }
}
```

#### `apps/socket-server/src/rooms/room-manager.ts`

```typescript
import { YjsRoom } from './yjs-room';
import { loadDocumentState, saveDocumentState } from './persistence';
import { ROOM_TEARDOWN_DELAY_MS, AUTO_SAVE_DEBOUNCE_MS } from '@collabdoc/shared';
import { logger } from '../lib/logger';

export class RoomManager {
  private rooms: Map<string, YjsRoom> = new Map();
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();

  /** Get or create a room for a document */
  async getOrCreateRoom(documentId: string): Promise<YjsRoom> {
    let room = this.rooms.get(documentId);
    if (room) return room;

    // Create new room
    room = new YjsRoom(documentId);

    // Load persisted state from PostgreSQL
    const storedState = await loadDocumentState(documentId);
    if (storedState) {
      room.applyStoredState(storedState);
    }

    // Listen for document updates → debounced save
    room.doc.on('update', (_update: Uint8Array, origin: unknown) => {
      room!.incrementUpdateCount();
      this.scheduleSave(documentId);
    });

    this.rooms.set(documentId, room);
    logger.info({ documentId, totalRooms: this.rooms.size }, 'Room created');
    return room;
  }

  /** Get an existing room (returns undefined if not exists) */
  getRoom(documentId: string): YjsRoom | undefined {
    return this.rooms.get(documentId);
  }

  /** Schedule a debounced save */
  private scheduleSave(documentId: string): void {
    // Clear existing timer
    const existing = this.saveTimers.get(documentId);
    if (existing) clearTimeout(existing);

    // Set new timer
    const timer = setTimeout(async () => {
      await this.saveRoom(documentId);
    }, AUTO_SAVE_DEBOUNCE_MS);

    this.saveTimers.set(documentId, timer);
  }

  /** Save room state to PostgreSQL */
  private async saveRoom(documentId: string): Promise<void> {
    const room = this.rooms.get(documentId);
    if (!room) return;

    try {
      const state = room.getFullState();
      const stateVector = room.getStateVector();
      await saveDocumentState(documentId, state, stateVector);
      room.resetUpdateCount();
      logger.info({ documentId, bytes: state.length }, 'Room state saved to database');
    } catch (error) {
      logger.error({ documentId, error }, 'Failed to save room state');
    }
  }

  /** Handle room becoming empty — schedule teardown */
  scheduleRoomTeardown(documentId: string): void {
    const room = this.rooms.get(documentId);
    if (!room || !room.isEmpty) return;

    room.scheduleTeardown(ROOM_TEARDOWN_DELAY_MS, async () => {
      // Final save before teardown
      await this.saveRoom(documentId);

      // Clean up
      room.destroy();
      this.rooms.delete(documentId);
      this.saveTimers.delete(documentId);

      logger.info({ documentId, totalRooms: this.rooms.size }, 'Room torn down after inactivity');
    });
  }

  /** Get stats for monitoring */
  getStats() {
    return {
      activeRooms: this.rooms.size,
      totalConnections: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.users.size,
        0,
      ),
      rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
        documentId: id,
        users: room.users.size,
        updateCount: room.updateCount,
      })),
    };
  }

  /** Graceful shutdown — save all rooms */
  async shutdownAll(): Promise<void> {
    logger.info({ roomCount: this.rooms.size }, 'Shutting down all rooms');
    const savePromises = Array.from(this.rooms.keys()).map((id) => this.saveRoom(id));
    await Promise.allSettled(savePromises);
    for (const room of this.rooms.values()) {
      room.destroy();
    }
    this.rooms.clear();
  }
}

export const roomManager = new RoomManager();
```

### Day 16: Persistence Layer (PostgreSQL)

| #    | Task                                                         | Est. Time | Output                  |
| ---- | ------------------------------------------------------------ | --------- | ----------------------- |
| 16.1 | Implement `loadDocumentState` (read latest snapshot from DB) | 45 min    | Binary read from BYTEA  |
| 16.2 | Implement `saveDocumentState` (write snapshot to DB)         | 45 min    | Binary write to BYTEA   |
| 16.3 | Implement snapshot rotation (keep last N snapshots)          | 30 min    | GC old snapshots        |
| 16.4 | Handle edge cases: first-time documents, corrupted data      | 30 min    | Error handling          |
| 16.5 | Integration tests for persistence                            | 45 min    | 6–8 tests               |
| 16.6 | Implement graceful shutdown (save all rooms on SIGTERM)      | 20 min    | Process signal handlers |

**Day 16 Total: ~3.5 hours**

#### `apps/socket-server/src/rooms/persistence.ts`

```typescript
import { prisma } from '@collabdoc/database';
import { MAX_SNAPSHOTS_PER_DOCUMENT, SNAPSHOT_INTERVAL_UPDATES } from '@collabdoc/shared';
import { logger } from '../lib/logger';

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

/** Save Yjs state to PostgreSQL */
export async function saveDocumentState(
  documentId: string,
  state: Uint8Array,
  stateVector: Uint8Array,
): Promise<void> {
  const stateBuffer = Buffer.from(state);
  const vectorBuffer = Buffer.from(stateVector);

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

    // Update document metadata
    await tx.document.update({
      where: { id: documentId },
      data: { updatedAt: new Date() },
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

/** Save with retry (exponential backoff) */
export async function saveDocumentStateWithRetry(
  documentId: string,
  state: Uint8Array,
  stateVector: Uint8Array,
  maxRetries = 3,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await saveDocumentState(documentId, state, stateVector);
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
```

### Day 17: Socket.io Event Handlers (Sync Protocol)

| #    | Task                                                    | Est. Time | Output                      |
| ---- | ------------------------------------------------------- | --------- | --------------------------- |
| 17.1 | Implement `join-room` handler (auth + load + sync-init) | 60 min    | `handlers/room.ts`          |
| 17.2 | Implement `leave-room` handler                          | 20 min    | Leave + teardown scheduling |
| 17.3 | Implement `yjs-update` handler (apply + broadcast)      | 45 min    | `handlers/collaboration.ts` |
| 17.4 | Wire auth middleware into Socket.io pipeline            | 20 min    | JWT validation on connect   |
| 17.5 | Wire all handlers into `index.ts`                       | 20 min    | Event registration          |
| 17.6 | Handle disconnection (cleanup + awareness)              | 30 min    | Disconnect handler          |

**Day 17 Total: ~3.5 hours**

#### `apps/socket-server/src/handlers/room.ts`

```typescript
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import { prisma } from '@collabdoc/database';
import { canViewDocument, canEditDocument } from '@collabdoc/shared';
import { logger } from '../lib/logger';

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
        (socket as any).__rooms = (socket as any).__rooms || new Set();
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

export function handleLeaveRoom(io: Server, socket: Socket, documentId: string) {
  const authSocket = socket as AuthenticatedSocket;
  const room = roomManager.getRoom(documentId);

  if (room) {
    const user = room.removeUser(socket.id);
    socket.leave(documentId);

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
}
```

#### `apps/socket-server/src/handlers/collaboration.ts`

```typescript
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth';
import { roomManager } from '../rooms/room-manager';
import * as Y from 'yjs';
import { logger } from '../lib/logger';

export function registerCollaborationHandlers(io: Server, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  // ─── YJS UPDATE (from client) ───
  socket.on('yjs-update', (documentId: string, update: Uint8Array) => {
    const room = roomManager.getRoom(documentId);
    if (!room) return;

    // Verify user is in this room
    if (!room.users.has(socket.id)) return;

    // Check edit permission
    const role = (socket as any).__role;
    if (role === 'VIEWER') return; // Silently ignore viewer edits

    try {
      // Apply update to server-side Y.Doc
      Y.applyUpdate(room.doc, new Uint8Array(update), socket.id);

      // Broadcast to all OTHER clients in the room
      socket.to(documentId).emit('yjs-update', update);

      logger.debug(
        {
          documentId,
          userId: authSocket.userId,
          bytes: update.byteLength,
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
```

### Day 18: Custom Yjs Socket.io Provider (Client)

| #    | Task                                                          | Est. Time | Output                                      |
| ---- | ------------------------------------------------------------- | --------- | ------------------------------------------- |
| 18.1 | Build `SocketIOProvider` class (client-side Yjs provider)     | 120 min   | `packages/yjs-utils/src/socket-provider.ts` |
| 18.2 | Implement connection lifecycle (connect/disconnect/reconnect) | 60 min    | Auto-reconnect logic                        |
| 18.3 | Implement sync protocol (sync-init → apply remote updates)    | 60 min    | Binary sync handling                        |
| 18.4 | Add provider event emitter (status, sync, error)              | 30 min    | EventEmitter interface                      |

**Day 18 Total: ~4.5 hours**

#### `packages/yjs-utils/src/socket-provider.ts`

```typescript
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'lib0/observable';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'synced';

interface SocketProviderEvents {
  status: (status: ConnectionStatus) => void;
  sync: (synced: boolean) => void;
  'connection-error': (error: Error) => void;
  'save-status': (status: 'saving' | 'saved' | 'error') => void;
}

export class SocketIOProvider extends EventEmitter<string> {
  public readonly doc: Y.Doc;
  public readonly awareness: Awareness;
  public readonly documentId: string;

  private socket: Socket | null = null;
  private _status: ConnectionStatus = 'disconnected';
  private _synced = false;
  private serverUrl: string;
  private authToken: string;
  private _updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null;
  private _awarenessUpdateHandler: ((changes: any, origin: string) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    serverUrl: string,
    documentId: string,
    doc: Y.Doc,
    options: {
      authToken: string;
      awareness?: Awareness;
      autoConnect?: boolean;
    },
  ) {
    super();
    this.serverUrl = serverUrl;
    this.documentId = documentId;
    this.doc = doc;
    this.authToken = options.authToken;
    this.awareness = options.awareness ?? new Awareness(doc);

    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  get synced(): boolean {
    return this._synced;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this._setStatus('connecting');

    this.socket = io(this.serverUrl, {
      auth: { token: this.authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // ─── Socket Events ───
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this._joinRoom();
    });

    this.socket.on('disconnect', (reason) => {
      this._setStatus('disconnected');
      this._synced = false;
    });

    this.socket.on('connect_error', (error) => {
      this._setStatus('disconnected');
      this.emit('connection-error', [error]);
    });

    // ─── Yjs Events from Server ───
    this.socket.on('yjs-update', (update: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update), 'remote');
    });

    this.socket.on('awareness-update', (update: Uint8Array) => {
      Awareness.applyAwarenessUpdate(this.awareness, new Uint8Array(update), 'remote');
    });

    this.socket.on('save-status', (status: 'saving' | 'saved' | 'error') => {
      this.emit('save-status', [status]);
    });

    // ─── Listen for local doc changes → send to server ───
    this._updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return; // Don't echo back remote updates
      this.socket?.emit('yjs-update', this.documentId, update);
    };
    this.doc.on('update', this._updateHandler);

    // ─── Listen for local awareness changes → send to server ───
    this._awarenessUpdateHandler = (changes: any, origin: string) => {
      if (origin === 'remote') return;
      const update = Awareness.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
      this.socket?.emit('awareness-update', this.documentId, update);
    };
    this.awareness.on('update', this._awarenessUpdateHandler);
  }

  private _joinRoom(): void {
    this._setStatus('syncing');

    this.socket?.emit(
      'join-room',
      this.documentId,
      (response: {
        success: boolean;
        error?: string;
        state?: Uint8Array;
        users?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
      }) => {
        if (!response.success) {
          this.emit('connection-error', [new Error(response.error || 'Failed to join room')]);
          return;
        }

        // Apply server state
        if (response.state) {
          Y.applyUpdate(this.doc, new Uint8Array(response.state), 'remote');
        }

        this._synced = true;
        this._setStatus('synced');
        this.emit('sync', [true]);
      },
    );
  }

  private _setStatus(status: ConnectionStatus): void {
    this._status = status;
    this.emit('status', [status]);
  }

  /** Update auth token (e.g., after refresh) */
  updateToken(token: string): void {
    this.authToken = token;
    if (this.socket) {
      (this.socket as any).auth = { token };
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-room', this.documentId);
      this.socket.disconnect();
      this.socket = null;
    }

    if (this._updateHandler) {
      this.doc.off('update', this._updateHandler);
    }
    if (this._awarenessUpdateHandler) {
      this.awareness.off('update', this._awarenessUpdateHandler);
    }

    this._setStatus('disconnected');
    this._synced = false;
  }

  destroy(): void {
    this.disconnect();
    this.awareness.destroy();
    super.destroy();
  }
}
```

### Day 19: Awareness Provider + React Integration

| #    | Task                                        | Est. Time | Output                              |
| ---- | ------------------------------------------- | --------- | ----------------------------------- |
| 19.1 | Implement awareness handler on server       | 45 min    | `handlers/awareness.ts`             |
| 19.2 | Build `CollaborationProvider` React context | 60 min    | `features/collaboration/providers/` |
| 19.3 | Build `useCollaboration` hook               | 30 min    | `features/collaboration/hooks/`     |
| 19.4 | Build `useConnection` hook                  | 20 min    | Connection state tracking           |
| 19.5 | Build `ConnectionStatus` badge component    | 20 min    | Visual indicator                    |
| 19.6 | Build Socket.io client singleton            | 30 min    | `lib/socket-client.ts`              |

**Day 19 Total: ~3.5 hours**

#### `apps/web/src/features/collaboration/providers/collaboration-provider.tsx`

```tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { SocketIOProvider, type ConnectionStatus } from '@collabdoc/yjs-utils';
import { generateSocketToken } from '@/features/auth/actions/generate-socket-token';

interface CollaborationContextValue {
  doc: Y.Doc | null;
  provider: SocketIOProvider | null;
  awareness: Awareness | null;
  connectionStatus: ConnectionStatus;
  isSynced: boolean;
  saveStatus: 'saving' | 'saved' | 'error' | 'idle';
}

const CollaborationContext = createContext<CollaborationContextValue>({
  doc: null,
  provider: null,
  awareness: null,
  connectionStatus: 'disconnected',
  isSynced: false,
  saveStatus: 'idle',
});

export function useCollaborationContext() {
  return useContext(CollaborationContext);
}

interface CollaborationProviderProps {
  documentId: string;
  children: React.ReactNode;
}

export function CollaborationProvider({ documentId, children }: CollaborationProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSynced, setIsSynced] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle');

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  useEffect(() => {
    let mounted = true;
    let provider: SocketIOProvider | null = null;

    async function init() {
      // 1. Generate auth token
      const token = await generateSocketToken();
      if (!token || !mounted) return;

      // 2. Create Y.Doc
      const doc = new Y.Doc();
      docRef.current = doc;

      // 3. Create provider
      provider = new SocketIOProvider(process.env.NEXT_PUBLIC_SOCKET_URL!, documentId, doc, {
        authToken: token,
        autoConnect: true,
      });

      providerRef.current = provider;
      awarenessRef.current = provider.awareness;

      // 4. Listen for events
      provider.on('status', ([status]: [ConnectionStatus]) => {
        if (mounted) setConnectionStatus(status);
      });

      provider.on('sync', ([synced]: [boolean]) => {
        if (mounted) setIsSynced(synced);
      });

      provider.on('save-status', ([status]: [string]) => {
        if (mounted) setSaveStatus(status as any);
      });
    }

    init();

    return () => {
      mounted = false;
      provider?.destroy();
      docRef.current?.destroy();
    };
  }, [documentId]);

  return (
    <CollaborationContext.Provider
      value={{
        doc: docRef.current,
        provider: providerRef.current,
        awareness: awarenessRef.current,
        connectionStatus,
        isSynced,
        saveStatus,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}
```

### Day 20: TipTap Collaboration Integration

| #    | Task                                                    | Est. Time | Output                  |
| ---- | ------------------------------------------------------- | --------- | ----------------------- |
| 20.1 | Modify Editor component to accept Y.Doc as data source  | 60 min    | Collaboration mode      |
| 20.2 | Add `Collaboration` TipTap extension                    | 30 min    | Shared editing          |
| 20.3 | Add `CollaborationCursor` TipTap extension              | 30 min    | Remote cursor rendering |
| 20.4 | Update editor page to wrap with `CollaborationProvider` | 20 min    | Context wrapper         |
| 20.5 | Test two-tab simultaneous editing                       | 30 min    | Manual verification     |
| 20.6 | Handle edge cases (late join, fast typing, concurrent)  | 30 min    | Robustness              |

**Day 20 Total: ~3.5 hours**

### Day 21: Integration Tests + Polish + Bug Fixes

| #    | Task                                            | Est. Time | Output                        |
| ---- | ----------------------------------------------- | --------- | ----------------------------- |
| 21.1 | E2E test: two-tab collaborative editing         | 90 min    | Playwright multi-context test |
| 21.2 | Unit tests for SocketIOProvider                 | 45 min    | 6–8 tests                     |
| 21.3 | Integration tests for room handlers             | 45 min    | 5–6 tests                     |
| 21.4 | Load test: 10 concurrent editors                | 30 min    | k6 WebSocket scenario         |
| 21.5 | Fix bugs found during testing                   | 60 min    | Bug fixes                     |
| 21.6 | Measure sync latency (target < 50ms)            | 20 min    | Performance verification      |
| 21.7 | Git commit: "M5: Realtime collaboration engine" | 5 min     | Clean commit                  |

**Day 21 Total: ~5 hours**

---

## 3. Complete Socket.io Event Protocol

```
╔═══════════════════════════════════════════════════════════════════╗
║                    SOCKET.IO EVENT PROTOCOL                      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  CONNECTION PHASE:                                                ║
║  ┌─────────┐                          ┌─────────────┐            ║
║  │ Client  │ ── connect(auth:token) ─▶│ Socket.io   │            ║
║  │         │ ◀─ authenticated ────────│ Server      │            ║
║  │         │ ◀─ auth-error(msg) ──────│             │            ║
║  └─────────┘                          └─────────────┘            ║
║                                                                   ║
║  ROOM LIFECYCLE:                                                  ║
║  ┌─────────┐                          ┌─────────────┐            ║
║  │ Client  │ ── join-room(docId) ────▶│   Server    │            ║
║  │         │ ◀─ callback({           │             │            ║
║  │         │      success: true,      │             │            ║
║  │         │      state: Uint8Array,  │             │            ║
║  │         │      users: UserInfo[]   │             │            ║
║  │         │    }) ───────────────────│             │            ║
║  │         │                          │             │            ║
║  │ Client  │ ── leave-room(docId) ───▶│   Server    │            ║
║  └─────────┘                          └─────────────┘            ║
║                                                                   ║
║  COLLABORATION:                                                   ║
║  ┌─────────┐                          ┌─────────────┐            ║
║  │ Client  │ ── yjs-update(docId,    │   Server    │            ║
║  │         │      Uint8Array) ───────▶│ apply to    │            ║
║  │         │                          │ Y.Doc,      │            ║
║  │         │ ◀─ yjs-update(          │ broadcast   │            ║
║  │         │      Uint8Array) ────────│ to room     │            ║
║  └─────────┘                          └─────────────┘            ║
║                                                                   ║
║  AWARENESS (Presence/Cursors):                                   ║
║  ┌─────────┐                          ┌─────────────┐            ║
║  │ Client  │ ── awareness-update(    │   Server    │            ║
║  │         │      docId,             │ broadcast   │            ║
║  │         │      Uint8Array) ───────▶│ to room     │            ║
║  │         │ ◀─ awareness-update(    │             │            ║
║  │         │      Uint8Array) ────────│             │            ║
║  └─────────┘                          └─────────────┘            ║
║                                                                   ║
║  NOTIFICATIONS:                                                   ║
║  ┌─────────┐                          ┌─────────────┐            ║
║  │ Client  │ ◀─ user-joined({       │   Server    │            ║
║  │         │      userId, name,      │             │            ║
║  │         │      avatarUrl          │             │            ║
║  │         │    }) ───────────────────│             │            ║
║  │         │ ◀─ user-left({          │             │            ║
║  │         │      userId, name       │             │            ║
║  │         │    }) ───────────────────│             │            ║
║  │         │ ◀─ save-status(         │             │            ║
║  │         │      'saving'|'saved')  │             │            ║
║  └─────────┘                          └─────────────┘            ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 4. Testing Requirements

| Category    | File                             | Tests                                                    |
| ----------- | -------------------------------- | -------------------------------------------------------- |
| Unit        | `yjs-room.test.ts`               | 6 — create, add/remove users, state, teardown            |
| Unit        | `room-manager.test.ts`           | 5 — create/get/destroy, save scheduling, shutdown        |
| Unit        | `socket-provider.test.ts`        | 8 — connect, disconnect, send/receive updates, reconnect |
| Integration | `persistence.test.ts`            | 6 — load/save, snapshot GC, empty doc, retry             |
| Integration | `room-handlers.test.ts`          | 5 — join/leave, permission check, state sync             |
| Integration | `collaboration-handlers.test.ts` | 4 — update broadcast, viewer rejection                   |
| E2E         | `collaboration.spec.ts`          | 3 — two-tab editing, reconnect, concurrent typing        |

**Phase 5 Test Total: ~37 tests**

---

## 5. Acceptance Criteria

| #   | Criterion                                                       |
| --- | --------------------------------------------------------------- |
| 1   | Two browser tabs editing same document → changes sync in < 50ms |
| 2   | Socket.io server validates JWT on connection                    |
| 3   | Unauthorized user cannot join a room                            |
| 4   | Viewer role cannot push `yjs-update` events                     |
| 5   | Room creates on first join, loads persisted state from DB       |
| 6   | Room tears down 30s after last user leaves                      |
| 7   | Server persists Yjs state to PostgreSQL (debounced 2s)          |
| 8   | Connection drop → auto-reconnect → state re-syncs               |
| 9   | Server crash → restart → clients reconnect → no data loss       |
| 10  | SIGTERM triggers graceful save-all before exit                  |
| 11  | `GET /health` returns room stats                                |
| 12  | All 37 tests pass                                               |
