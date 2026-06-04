'use server';

import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';

const SOCKET_AUTH_SECRET =
  process.env.SOCKET_AUTH_SECRET || 'shared-jwt-secret-for-socket-auth-minimum-32-characters';
const TOKEN_EXPIRY = '5m'; // Short-lived for security

export interface SocketAuthPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export async function generateSocketToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;

  const payload: SocketAuthPayload = {
    userId: session.user.id!,
    email: session.user.email!,
    name: session.user.name!,
    avatarUrl: session.user.image ?? null,
  };

  return jwt.sign(payload, SOCKET_AUTH_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    issuer: 'collabdoc-web',
    audience: 'collabdoc-socket',
  });
}
