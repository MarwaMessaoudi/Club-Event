import { createHash, timingSafeEqual } from 'crypto';

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const tokenMatches = (token: string, storedHash: string): boolean => {
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};