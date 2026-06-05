/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi } from 'vitest';
import { useTypedSession } from '../hooks/use-session';

vi.mock('@/components/providers/session-provider', () => {
  return {
    useAuth: vi.fn(),
  };
});

import { useAuth } from '@/components/providers/session-provider';

describe('useTypedSession', () => {
  test('returns typed user and status when authenticated', () => {
    const mockAuthValue = {
      session: {
        access_token: 'token-abc',
        expires_at: 1234567,
      },
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        user_metadata: {
          full_name: 'Alice',
          avatar_url: 'https://example.com/alice.png',
        },
      },
      isLoading: false,
    };
    vi.mocked(useAuth).mockReturnValue(mockAuthValue as any);

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
    const mockAuthValue = {
      session: null,
      user: null,
      isLoading: true,
    };
    vi.mocked(useAuth).mockReturnValue(mockAuthValue as any);

    const result = useTypedSession();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(true);
    expect(result.user).toBeUndefined();
  });

  test('returns unauthenticated state', () => {
    const mockAuthValue = {
      session: null,
      user: null,
      isLoading: false,
    };
    vi.mocked(useAuth).mockReturnValue(mockAuthValue as any);

    const result = useTypedSession();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
    expect(result.user).toBeUndefined();
  });
});
