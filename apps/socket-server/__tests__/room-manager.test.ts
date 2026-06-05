import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock persistence module before importing RoomManager
vi.mock('../src/rooms/persistence', () => ({
  loadDocumentState: vi.fn().mockResolvedValue(null),
  saveDocumentState: vi.fn().mockResolvedValue(undefined),
  saveDocumentStateWithRetry: vi.fn().mockResolvedValue(true),
}));

// Mock logger
vi.mock('../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

import { RoomManager } from '../src/rooms/room-manager';
import { loadDocumentState } from '../src/rooms/persistence';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new RoomManager();
  });

  it('creates a new room on first getOrCreateRoom call', async () => {
    const room = await manager.getOrCreateRoom('doc-1');
    expect(room).toBeDefined();
    expect(room.documentId).toBe('doc-1');
    expect(loadDocumentState).toHaveBeenCalledWith('doc-1');
  });

  it('returns existing room on subsequent calls', async () => {
    const room1 = await manager.getOrCreateRoom('doc-1');
    const room2 = await manager.getOrCreateRoom('doc-1');
    expect(room1).toBe(room2);
    // loadDocumentState should only be called once (on creation)
    expect(loadDocumentState).toHaveBeenCalledTimes(1);
  });

  it('creates separate rooms for different documents', async () => {
    const room1 = await manager.getOrCreateRoom('doc-1');
    const room2 = await manager.getOrCreateRoom('doc-2');
    expect(room1).not.toBe(room2);
    expect(room1.documentId).toBe('doc-1');
    expect(room2.documentId).toBe('doc-2');
  });

  it('getRoom returns undefined for non-existent rooms', () => {
    const room = manager.getRoom('nonexistent');
    expect(room).toBeUndefined();
  });

  it('getRoom returns existing room', async () => {
    await manager.getOrCreateRoom('doc-1');
    const room = manager.getRoom('doc-1');
    expect(room).toBeDefined();
    expect(room?.documentId).toBe('doc-1');
  });

  it('reports stats correctly', async () => {
    const room1 = await manager.getOrCreateRoom('doc-1');
    const room2 = await manager.getOrCreateRoom('doc-2');

    room1.addUser({
      socketId: 's1',
      userId: 'u1',
      userName: 'Alice',
      userEmail: 'a@test.com',
      userAvatarUrl: null,
      joinedAt: new Date(),
    });

    const stats = manager.getStats();
    expect(stats.activeRooms).toBe(2);
    expect(stats.totalConnections).toBe(1);
    expect(stats.rooms).toHaveLength(2);
  });

  it('shuts down all rooms gracefully', async () => {
    const room1 = await manager.getOrCreateRoom('doc-1');
    const room2 = await manager.getOrCreateRoom('doc-2');

    const spy1 = vi.spyOn(room1, 'destroy');
    const spy2 = vi.spyOn(room2, 'destroy');

    await manager.shutdownAll();

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(manager.getStats().activeRooms).toBe(0);
  });
});
