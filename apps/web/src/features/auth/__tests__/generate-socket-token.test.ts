import { describe, test, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateSocketToken } from '../actions/generate-socket-token';

vi.mock('@/lib/auth', () => {
  return {
    auth: vi.fn(),
  };
});

import { auth } from '@/lib/auth';

describe('generateSocketToken', () => {
  const TEST_SECRET = 'shared-jwt-secret-for-socket-auth-minimum-32-characters';

  beforeEach(() => {
    process.env.SOCKET_AUTH_SECRET = TEST_SECRET;
  });

  test('returns null if there is no session', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const token = await generateSocketToken();
    expect(token).toBeNull();
  });

  test('returns null if there is session but no user', async () => {
    vi.mocked(auth).mockResolvedValue({} as any);

    const token = await generateSocketToken();
    expect(token).toBeNull();
  });

  test('generates valid socket token for authenticated user', async () => {
    const mockSession = {
      user: {
        id: 'user-456',
        name: 'Bob Builder',
        email: 'bob@example.com',
        image: 'https://example.com/bob.png',
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    const token = await generateSocketToken();
    expect(token).toBeTypeOf('string');

    const decoded = jwt.verify(token!, TEST_SECRET, {
      issuer: 'collabdoc-web',
      audience: 'collabdoc-socket',
    }) as any;

    expect(decoded.userId).toBe(mockSession.user.id);
    expect(decoded.name).toBe(mockSession.user.name);
    expect(decoded.email).toBe(mockSession.user.email);
    expect(decoded.avatarUrl).toBe(mockSession.user.image);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });
});
