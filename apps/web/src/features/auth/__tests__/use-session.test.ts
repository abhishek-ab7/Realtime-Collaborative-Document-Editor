import { describe, test, expect, vi } from 'vitest';
import { useTypedSession } from '../hooks/use-session';

vi.mock('next-auth/react', () => {
  return {
    useSession: vi.fn(),
  };
});

import { useSession } from 'next-auth/react';

describe('useTypedSession', () => {
  test('returns typed user and status when authenticated', () => {
    const mockSession = {
      data: {
        user: {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          image: 'https://example.com/alice.png',
        },
      },
      status: 'authenticated',
    };
    vi.mocked(useSession).mockReturnValue(mockSession as any);

    const result = useTypedSession();

    expect(result.isAuthenticated).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/alice.png',
    });
  });

  test('returns loading state', () => {
    const mockSession = {
      data: null,
      status: 'loading',
    };
    vi.mocked(useSession).mockReturnValue(mockSession as any);

    const result = useTypedSession();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(true);
    expect(result.user).toBeUndefined();
  });

  test('returns unauthenticated state', () => {
    const mockSession = {
      data: null,
      status: 'unauthenticated',
    };
    vi.mocked(useSession).mockReturnValue(mockSession as any);

    const result = useTypedSession();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
    expect(result.user).toBeUndefined();
  });
});
