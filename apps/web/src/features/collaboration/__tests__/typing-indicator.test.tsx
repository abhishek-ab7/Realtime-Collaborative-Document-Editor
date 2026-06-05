import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { TypingIndicator } from '../components/typing-indicator';
import { usePresence } from '../hooks/use-presence';

vi.mock('../hooks/use-presence', () => ({
  usePresence: vi.fn(),
}));

describe('TypingIndicator', () => {
  test('returns null when no users are typing', () => {
    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: [],
      typingUsers: [],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    const { container } = render(<TypingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  test('renders label correctly for one typing user', () => {
    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: [],
      typingUsers: [
        { userId: '1', name: 'Alice', avatarUrl: null, color: 'red', cursor: null, isTyping: true },
      ],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    render(<TypingIndicator />);
    expect(screen.getByText('Alice is typing')).toBeDefined();
  });

  test('renders label correctly for multiple typing users', () => {
    vi.mocked(usePresence).mockReturnValue({
      onlineUsers: [],
      typingUsers: [
        { userId: '1', name: 'Alice', avatarUrl: null, color: 'red', cursor: null, isTyping: true },
        { userId: '2', name: 'Bob', avatarUrl: null, color: 'blue', cursor: null, isTyping: true },
      ],
      setLocalUser: vi.fn(),
      setTyping: vi.fn(),
    });

    render(<TypingIndicator />);
    expect(screen.getByText('Alice and Bob are typing')).toBeDefined();
  });
});
