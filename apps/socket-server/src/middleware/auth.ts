import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

const SOCKET_AUTH_SECRET =
  process.env.SOCKET_AUTH_SECRET || 'shared-jwt-secret-for-socket-auth-minimum-32-characters';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatarUrl: string | null;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication required: no token provided'));
  }

  try {
    const payload = jwt.verify(token, SOCKET_AUTH_SECRET, {
      issuer: 'collabdoc-web',
      audience: 'collabdoc-socket',
    }) as jwt.JwtPayload & {
      userId: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };

    // Attach user info to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = payload.userId;
    authSocket.userEmail = payload.email;
    authSocket.userName = payload.name;
    authSocket.userAvatarUrl = payload.avatarUrl;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication failed: token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication failed: invalid token'));
    }
    return next(new Error('Authentication failed'));
  }
}
