'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCollaborationContext } from '../providers/collaboration-provider';
import { PRESENCE_COLORS } from '@collabdoc/shared';

export interface OnlineUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  cursor: { anchor: number; head: number } | null;
  isTyping: boolean;
}

export function usePresence() {
  const { awareness } = useCollaborationContext();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states = awareness.getStates();
      const users: OnlineUser[] = [];

      states.forEach((state, clientId) => {
        if (clientId === awareness.doc.clientID) return; // Skip self
        if (!state.user) return;

        users.push({
          userId: state.user.userId,
          name: state.user.name,
          avatarUrl: state.user.avatarUrl ?? null,
          color: state.user.color || PRESENCE_COLORS[users.length % PRESENCE_COLORS.length],
          cursor: state.cursor ?? null,
          isTyping: state.isTyping ?? false,
        });
      });

      setOnlineUsers(users);
    };

    awareness.on('change', updateUsers);
    updateUsers(); // Initial state

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  // Set local user info in awareness
  const setLocalUser = useCallback(
    (user: { userId: string; name: string; avatarUrl: string | null; color: string }) => {
      if (!awareness) return;
      awareness.setLocalStateField('user', user);
    },
    [awareness],
  );

  // Set typing state
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!awareness) return;
      awareness.setLocalStateField('isTyping', isTyping);
    },
    [awareness],
  );

  const typingUsers = onlineUsers.filter((u) => u.isTyping);

  return { onlineUsers, typingUsers, setLocalUser, setTyping };
}
