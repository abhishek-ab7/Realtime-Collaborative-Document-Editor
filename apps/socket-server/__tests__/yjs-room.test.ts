import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YjsRoom } from '../src/rooms/yjs-room';

// Mock the logger
vi.mock('../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

describe('YjsRoom', () => {
  let room: YjsRoom;

  beforeEach(() => {
    room = new YjsRoom('test-doc-123');
  });

  it('creates a room with correct documentId', () => {
    expect(room.documentId).toBe('test-doc-123');
    expect(room.doc).toBeDefined();
    expect(room.awareness).toBeDefined();
    expect(room.users.size).toBe(0);
    expect(room.isEmpty).toBe(true);
  });

  it('adds and removes users correctly', () => {
    room.addUser({
      socketId: 'socket-1',
      userId: 'user-1',
      userName: 'Alice',
      userEmail: 'alice@test.com',
      userAvatarUrl: null,
      joinedAt: new Date(),
    });

    expect(room.users.size).toBe(1);
    expect(room.isEmpty).toBe(false);

    room.addUser({
      socketId: 'socket-2',
      userId: 'user-2',
      userName: 'Bob',
      userEmail: 'bob@test.com',
      userAvatarUrl: 'https://avatar.test/bob.png',
      joinedAt: new Date(),
    });

    expect(room.users.size).toBe(2);

    const removed = room.removeUser('socket-1');
    expect(removed?.userId).toBe('user-1');
    expect(room.users.size).toBe(1);

    const notFound = room.removeUser('socket-nonexistent');
    expect(notFound).toBeUndefined();
  });

  it('applies and retrieves Yjs state', () => {
    // Apply an update to the doc
    const text = room.doc.getText('content');
    text.insert(0, 'Hello, World!');

    const state = room.getFullState();
    expect(state).toBeInstanceOf(Uint8Array);
    expect(state.length).toBeGreaterThan(0);

    const stateVector = room.getStateVector();
    expect(stateVector).toBeInstanceOf(Uint8Array);

    // Create a new room and apply the state
    const room2 = new YjsRoom('test-doc-456');
    room2.applyStoredState(state);

    const text2 = room2.doc.getText('content');
    expect(text2.toString()).toBe('Hello, World!');

    room2.destroy();
  });

  it('tracks update count', () => {
    expect(room.updateCount).toBe(0);
    room.incrementUpdateCount();
    room.incrementUpdateCount();
    expect(room.updateCount).toBe(2);
    room.resetUpdateCount();
    expect(room.updateCount).toBe(0);
  });

  it('schedules and cancels teardown', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    room.scheduleTeardown(5000, callback);
    expect(callback).not.toHaveBeenCalled();

    // Cancel before it fires
    room.cancelTeardown();
    vi.advanceTimersByTime(6000);
    expect(callback).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('fires teardown callback after delay', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    room.scheduleTeardown(3000, callback);
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('cancels teardown when user joins', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    room.scheduleTeardown(5000, callback);

    // User joins — should cancel the teardown
    room.addUser({
      socketId: 'socket-1',
      userId: 'user-1',
      userName: 'Alice',
      userEmail: 'alice@test.com',
      userAvatarUrl: null,
      joinedAt: new Date(),
    });

    vi.advanceTimersByTime(6000);
    expect(callback).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('cleans up resources on destroy', () => {
    const docDestroySpy = vi.spyOn(room.doc, 'destroy');
    const awarenessDestroySpy = vi.spyOn(room.awareness, 'destroy');

    room.destroy();

    expect(docDestroySpy).toHaveBeenCalled();
    expect(awarenessDestroySpy).toHaveBeenCalled();
  });
});
