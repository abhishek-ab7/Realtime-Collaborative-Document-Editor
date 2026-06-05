/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { usePresence } from '../hooks/use-presence';
import { useCollaborationContext } from '../providers/collaboration-provider';

vi.mock('../providers/collaboration-provider', () => ({
  useCollaborationContext: vi.fn(),
}));

describe('usePresence', () => {
  let mockAwareness: any;
  let changeCallbacks: ((...args: any[]) => any)[] = [];

  beforeEach(() => {
    changeCallbacks = [];
    mockAwareness = {
      doc: { clientID: 1 },
      getStates: vi.fn().mockReturnValue(new Map()),
      on: vi.fn((event, cb) => {
        if (event === 'change') changeCallbacks.push(cb);
      }),
      off: vi.fn((event, cb) => {
        if (event === 'change') {
          changeCallbacks = changeCallbacks.filter((c) => c !== cb);
        }
      }),
      setLocalStateField: vi.fn(),
    };

    vi.mocked(useCollaborationContext).mockReturnValue({
      doc: {} as any,
      provider: {} as any,
      awareness: mockAwareness,
      connectionStatus: 'connected',
      isSynced: true,
      saveStatus: 'idle',
      connectedUsers: [],
    });
  });

  test('returns empty online users initially', () => {
    const { result } = renderHook(() => usePresence());
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.typingUsers).toEqual([]);
  });

  test('returns other online users and handles changes', () => {
    const statesMap = new Map([
      [1, { user: { userId: '1', name: 'Self', color: 'red' } }],
      [2, { user: { userId: '2', name: 'User 2', color: 'blue' }, isTyping: true }],
      [3, { user: { userId: '3', name: 'User 3', color: 'green' }, isTyping: false }],
    ]);

    mockAwareness.getStates.mockReturnValue(statesMap);

    const { result } = renderHook(() => usePresence());

    expect(result.current.onlineUsers).toHaveLength(2);
    expect(result.current.onlineUsers[0].userId).toBe('2');
    expect(result.current.onlineUsers[1].userId).toBe('3');
    expect(result.current.typingUsers).toHaveLength(1);
    expect(result.current.typingUsers[0].userId).toBe('2');
  });

  test('setLocalUser updates awareness state', () => {
    const { result } = renderHook(() => usePresence());
    const userMeta = { userId: '1', name: 'Self', avatarUrl: null, color: 'red' };

    result.current.setLocalUser(userMeta);
    expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('user', userMeta);
  });

  test('setTyping updates typing status in awareness', () => {
    const { result } = renderHook(() => usePresence());

    result.current.setTyping(true);
    expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('isTyping', true);
  });
});
