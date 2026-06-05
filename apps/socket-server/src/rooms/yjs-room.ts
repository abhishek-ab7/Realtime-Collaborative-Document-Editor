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
      // Remove awareness for this specific client by setting their state to null
      const states = this.awareness.getStates();
      for (const [clientId, state] of states) {
        if ((state as any)?.socketId === socketId) {
          this.awareness.setLocalStateField('user', null);
        }
      }
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
