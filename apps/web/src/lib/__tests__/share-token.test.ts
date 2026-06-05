import { describe, test, expect } from 'vitest';
import { generateShareToken, hashShareToken } from '@/lib/share-token';

describe('generateShareToken', () => {
  test('returns a rawToken and tokenHash', () => {
    const { rawToken, tokenHash } = generateShareToken();

    expect(rawToken).toBeDefined();
    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBeGreaterThan(0);

    expect(tokenHash).toBeDefined();
    expect(typeof tokenHash).toBe('string');
    // SHA-256 hex hash is 64 characters
    expect(tokenHash.length).toBe(64);
  });

  test('generates unique tokens on each call', () => {
    const token1 = generateShareToken();
    const token2 = generateShareToken();

    expect(token1.rawToken).not.toBe(token2.rawToken);
    expect(token1.tokenHash).not.toBe(token2.tokenHash);
  });

  test('rawToken uses base64url encoding (no +, /, or = characters)', () => {
    const { rawToken } = generateShareToken();

    expect(rawToken).not.toMatch(/[+/=]/);
  });
});

describe('hashShareToken', () => {
  test('produces consistent hash for the same input', () => {
    const hash1 = hashShareToken('test-token-abc');
    const hash2 = hashShareToken('test-token-abc');

    expect(hash1).toBe(hash2);
  });

  test('produces different hashes for different inputs', () => {
    const hash1 = hashShareToken('token-a');
    const hash2 = hashShareToken('token-b');

    expect(hash1).not.toBe(hash2);
  });

  test('hash from generateShareToken matches hashShareToken', () => {
    const { rawToken, tokenHash } = generateShareToken();
    const recomputed = hashShareToken(rawToken);

    expect(recomputed).toBe(tokenHash);
  });
});
