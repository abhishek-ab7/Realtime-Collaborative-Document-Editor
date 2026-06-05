import { YjsRoom } from './yjs-room';
import { loadDocumentState, saveDocumentStateWithRetry } from './persistence';
import {
  ROOM_TEARDOWN_DELAY_MS,
  AUTO_SAVE_DEBOUNCE_MS,
  SNAPSHOT_INTERVAL_UPDATES,
  SNAPSHOT_INTERVAL_MS,
} from '@collabdoc/shared';
import { logger } from '../lib/logger';
import { versionManager } from './version-manager';
import type { Server } from 'socket.io';

export class RoomManager {
  private rooms: Map<string, YjsRoom> = new Map();
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private snapshotTimers: Map<string, NodeJS.Timeout> = new Map();
  private io: Server | null = null;

  /** Inject the Socket.io server reference so we can emit save-status events */
  setIO(io: Server): void {
    this.io = io;
  }

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

    // Listen for document updates → debounced auto-save + snapshot interval trigger
    room.doc.on('update', (_update: Uint8Array, _origin: unknown) => {
      room!.incrementUpdateCount();
      this.scheduleSave(documentId);

      // Trigger immediate snapshot when update-count threshold is reached
      if (room!.updateCount >= SNAPSHOT_INTERVAL_UPDATES) {
        this.saveImmediately(documentId);
      }
    });

    // Start the periodic snapshot timer (every 5 minutes)
    this.startSnapshotTimer(documentId);

    // Start periodic version history timer (every 30 minutes)
    versionManager.startVersionTimer(documentId);

    this.rooms.set(documentId, room);
    logger.info({ documentId, totalRooms: this.rooms.size }, 'Room registered');
    return room;
  }

  /** Get an existing room (returns undefined if not exists) */
  getRoom(documentId: string): YjsRoom | undefined {
    return this.rooms.get(documentId);
  }

  /** Schedule a debounced save */
  private scheduleSave(documentId: string): void {
    const existing = this.saveTimers.get(documentId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      await this.saveRoom(documentId);
    }, AUTO_SAVE_DEBOUNCE_MS);

    this.saveTimers.set(documentId, timer);
  }

  /** Trigger an immediate save (bypassing debounce) */
  private async saveImmediately(documentId: string): Promise<void> {
    const existing = this.saveTimers.get(documentId);
    if (existing) {
      clearTimeout(existing);
      this.saveTimers.delete(documentId);
    }
    await this.saveRoom(documentId);
  }

  /** Start a periodic snapshot timer for a document */
  private startSnapshotTimer(documentId: string): void {
    const existing = this.snapshotTimers.get(documentId);
    if (existing) clearInterval(existing);

    const timer = setInterval(async () => {
      const room = this.rooms.get(documentId);
      if (room && !room.isEmpty) {
        logger.info({ documentId }, 'Periodic snapshot triggered');
        await this.saveRoom(documentId);
      }
    }, SNAPSHOT_INTERVAL_MS);

    this.snapshotTimers.set(documentId, timer);
  }

  /** Save room state to PostgreSQL and emit save-status events */
  private async saveRoom(documentId: string): Promise<void> {
    const room = this.rooms.get(documentId);
    if (!room) return;

    // Emit "saving" to all clients in the room
    this.io?.to(documentId).emit('save-status', 'saving');

    try {
      const state = room.getFullState();
      const stateVector = room.getStateVector();
      const success = await saveDocumentStateWithRetry(documentId, state, stateVector, room.doc);

      if (success) {
        room.resetUpdateCount();
        logger.info({ documentId, bytes: state.length }, 'Room state saved to database');
        this.io?.to(documentId).emit('save-status', 'saved');
      } else {
        this.io?.to(documentId).emit('save-status', 'error');
      }
    } catch (error) {
      logger.error({ documentId, error }, 'Failed to save room state');
      this.io?.to(documentId).emit('save-status', 'error');
    }
  }

  /** Handle room becoming empty — schedule teardown */
  scheduleRoomTeardown(documentId: string): void {
    const room = this.rooms.get(documentId);
    if (!room || !room.isEmpty) return;

    room.scheduleTeardown(ROOM_TEARDOWN_DELAY_MS, async () => {
      // Final save before teardown
      await this.saveRoom(documentId);

      // Create a version snapshot on room teardown
      await versionManager.createVersion(documentId, 'ROOM_TEARDOWN');

      // Clean up all timers
      const saveTimer = this.saveTimers.get(documentId);
      if (saveTimer) {
        clearTimeout(saveTimer);
        this.saveTimers.delete(documentId);
      }
      const snapshotTimer = this.snapshotTimers.get(documentId);
      if (snapshotTimer) {
        clearInterval(snapshotTimer);
        this.snapshotTimers.delete(documentId);
      }
      versionManager.clearVersionTimer(documentId);

      room.destroy();
      this.rooms.delete(documentId);

      logger.info({ documentId, totalRooms: this.rooms.size }, 'Room torn down after inactivity');
    });
  }

  /** Forcefully evict a room from memory without saving (e.g. after a restore) */
  evictRoom(documentId: string): void {
    const room = this.rooms.get(documentId);
    if (!room) return;

    const saveTimer = this.saveTimers.get(documentId);
    if (saveTimer) {
      clearTimeout(saveTimer);
      this.saveTimers.delete(documentId);
    }
    const snapshotTimer = this.snapshotTimers.get(documentId);
    if (snapshotTimer) {
      clearInterval(snapshotTimer);
      this.snapshotTimers.delete(documentId);
    }
    versionManager.clearVersionTimer(documentId);

    room.destroy();
    this.rooms.delete(documentId);
    logger.info({ documentId }, 'Room forcefully evicted');
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
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();
    for (const timer of this.snapshotTimers.values()) {
      clearInterval(timer);
    }
    this.snapshotTimers.clear();

    // Clear version timers
    Array.from(this.rooms.keys()).forEach((id) => versionManager.clearVersionTimer(id));
  }
}

export const roomManager = new RoomManager();
