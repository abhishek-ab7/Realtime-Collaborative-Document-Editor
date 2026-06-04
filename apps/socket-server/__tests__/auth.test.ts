import { expect, test, describe } from 'vitest';
import jwt from 'jsonwebtoken';
import { socketAuthMiddleware, type AuthenticatedSocket } from '../src/middleware/auth';

const TEST_SECRET = 'shared-jwt-secret-for-socket-auth-minimum-32-characters';

describe('socketAuthMiddleware', () => {
  test('fails if no token is provided', () => {
    const socket = {
      handshake: {
        auth: {},
      },
    } as any;

    let error: any = null;
    const next = (err?: any) => {
      error = err;
    };

    socketAuthMiddleware(socket, next);

    expect(error).toBeDefined();
    expect(error.message).toContain('Authentication required: no token provided');
  });

  test('fails if invalid token is provided', () => {
    const socket = {
      handshake: {
        auth: {
          token: 'invalid.token.here',
        },
      },
    } as any;

    let error: any = null;
    const next = (err?: any) => {
      error = err;
    };

    socketAuthMiddleware(socket, next);

    expect(error).toBeDefined();
    expect(error.message).toContain('Authentication failed: invalid token');
  });

  test('fails if token is expired', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://avatar.com/test',
    };

    // Create an expired token
    const token = jwt.sign(payload, TEST_SECRET, {
      expiresIn: '0s',
      issuer: 'collabdoc-web',
      audience: 'collabdoc-socket',
    });

    const socket = {
      handshake: {
        auth: {
          token,
        },
      },
    } as any;

    let error: any = null;
    const next = (err?: any) => {
      error = err;
    };

    // Fast-forward or just check validation directly (expiresIn '0s' expires immediately)
    socketAuthMiddleware(socket, next);

    expect(error).toBeDefined();
    expect(error.message).toContain('Authentication failed: token expired');
  });

  test('passes and attaches user payload if valid token is provided', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://avatar.com/test',
    };

    const token = jwt.sign(payload, TEST_SECRET, {
      expiresIn: '5m',
      issuer: 'collabdoc-web',
      audience: 'collabdoc-socket',
    });

    const socket = {
      handshake: {
        auth: {
          token,
        },
      },
    } as any;

    let error: any = null;
    const next = (err?: any) => {
      error = err;
    };

    socketAuthMiddleware(socket, next);

    expect(error).toBeUndefined();
    const authenticatedSocket = socket as AuthenticatedSocket;
    expect(authenticatedSocket.userId).toBe(payload.userId);
    expect(authenticatedSocket.userEmail).toBe(payload.email);
    expect(authenticatedSocket.userName).toBe(payload.name);
    expect(authenticatedSocket.userAvatarUrl).toBe(payload.avatarUrl);
  });
});
