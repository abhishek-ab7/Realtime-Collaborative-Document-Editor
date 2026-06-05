import { YjsRoom } from './yjs-room';
import { loadDocumentState, saveDocumentStateWithRetry } from './persistence';
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
    room.doc.on('update', (_update: Uint8Array, _origin: unknown) => {
      room!.incrementUpdateCount();
      this.scheduleSave(documentId);
    });

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
      const success = await saveDocumentStateWithRetry(documentId, state, stateVector);
      if (success) {
        room.resetUpdateCount();
        logger.info({ documentId, bytes: state.length }, 'Room state saved to database');
      }
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
      const saveTimer = this.saveTimers.get(documentId);
      if (saveTimer) {
        clearTimeout(saveTimer);
        this.saveTimers.delete(documentId);
      }

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
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();
  }
}

export const roomManager = new RoomManager();
