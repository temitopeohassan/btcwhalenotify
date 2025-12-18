import crypto from 'crypto';

/**
 * Hash a string using SHA256
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify a hash matches the input
 */
export function verifyHash(input: string, hash: string): boolean {
  const inputHash = hashString(input);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash),
    Buffer.from(hash)
  );
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex');
}
