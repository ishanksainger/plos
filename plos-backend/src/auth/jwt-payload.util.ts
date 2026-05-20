import { UnauthorizedException } from '@nestjs/common';

/**
 * Coerces JWT `sub` to a positive integer for Prisma `userId` filters.
 *
 * @param sub - Subject from a verified JWT payload (`number` or numeric string)
 * @returns Integer user id
 */
export function parseJwtUserId(sub: unknown): number {
  let n: number;
  if (typeof sub === 'number' && Number.isFinite(sub)) {
    n = Math.trunc(sub);
  } else if (typeof sub === 'string') {
    n = parseInt(sub.trim(), 10);
  } else {
    n = NaN;
  }
  if (!Number.isInteger(n) || n < 1) {
    throw new UnauthorizedException('Invalid token subject');
  }
  return n;
}
