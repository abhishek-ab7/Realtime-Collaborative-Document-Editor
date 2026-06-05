import { randomBytes, createHash } from 'crypto';
import { SHARE_TOKEN_BYTES } from '@collabdoc/shared';

/**
 * Generate a share link token pair.
 * Returns the raw token (for the URL) and the hash (for DB storage).
 * We never store the raw token — only the SHA-256 hash.
 */
export function generateShareToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(SHARE_TOKEN_BYTES).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

/**
 * Hash a raw share token for DB lookup.
 * Used when validating an incoming share link URL.
 */
export function hashShareToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
