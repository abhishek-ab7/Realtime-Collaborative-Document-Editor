/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { PresenceAvatars } from '../components/presence-avatars';
import { usePresence } from '../hooks/use-presence';

vi.mock('../hooks/use-presence', () => ({
  usePresence: vi.fn(),
}));

vi.mock('@/components/ui/avatar', () => {
  return {
    Avatar: ({ children }: any) => <div data-testid="avatar-wrapper">{children}</div>,
    AvatarImage: ({ src, alt }: any) => React.createElement('img', { src, alt }),
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
  };
});

describe('PresenceAvatars', () => {
  test('renders online user avatars correctly', () => {
    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: [
        {
          userId: '1',
          name: 'Alice',
          avatarUrl: null,
          color: 'red',
          cursor: null,
          isTyping: false,
        },
        {
          userId: '2',
          name: 'Bob',
          avatarUrl: 'https://example.com/bob.png',
          color: 'blue',
          cursor: null,
          isTyping: false,
        },
      ],
      typingUsers: [],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    render(<PresenceAvatars />);

    expect(screen.getByTestId('presence-avatars')).toBeDefined();
    expect(screen.getByAltText('Bob')).toBeDefined();
  });

  test('renders initials for user without avatar', () => {
    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: [
        {
          userId: '1',
          name: 'Alice Smith',
          avatarUrl: null,
          color: 'red',
          cursor: null,
          isTyping: false,
        },
      ],
      typingUsers: [],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    render(<PresenceAvatars />);
    expect(screen.getByText('AS')).toBeDefined();
  });

  test('handles overflow counter correctly', () => {
    const users = Array.from({ length: 8 }, (_, i) => ({
      userId: `${i}`,
      name: `User ${i}`,
      avatarUrl: null,
      color: 'red',
      cursor: null,
      isTyping: false,
    }));

    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: users,
      typingUsers: [],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    render(<PresenceAvatars />);
    expect(screen.getByText('+3')).toBeDefined();
  });
});
