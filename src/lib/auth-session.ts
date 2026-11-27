import crypto from 'crypto';
import type { Request, Response } from 'express';
import { eq, gt, and } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '../db/index.ts';
import { sessions, users } from '../db/schema.ts';

export const SESSION_COOKIE_NAME = 'ac_session';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface AuthenticatedSessionUser {
  id: string;
  username: string | null;
  name: string;
  email: string;
  role: 'investor' | 'admin';
  referralCode: string;
  accountStatus: 'Active' | 'Blocked';
}

interface MemorySessionRecord {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

const memorySessions = new Map<string, MemorySessionRecord>();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function createSessionForUser(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  if (isDatabaseConfigured) {
    await db.insert(sessions).values({
      tokenHash,
      userId,
      expiresAt,
    });
  } else {
    memorySessions.set(tokenHash, {
      tokenHash,
      userId,
      expiresAt: expiresAt.getTime(),
    });
  }

  return rawToken;
}

export async function deleteSessionToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  if (isDatabaseConfigured) {
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  } else {
    memorySessions.delete(tokenHash);
  }
}

export async function lookupSessionUserId(rawToken: string): Promise<string | null> {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  if (isDatabaseConfigured) {
    const rows = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
      .limit(1);
    return rows[0]?.userId ?? null;
  }

  const mem = memorySessions.get(tokenHash);
  if (!mem || mem.expiresAt <= now.getTime()) {
    memorySessions.delete(tokenHash);
    return null;
  }
  return mem.userId;
}

export async function resolveUserByToken(
  rawToken: string
): Promise<AuthenticatedSessionUser | null> {
  const userId = await lookupSessionUserId(rawToken);
  if (!userId) return null;

  if (!isDatabaseConfigured) {
    // Handled via neonRepo memory lookup inside auth middleware
    return null;
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      referralCode: users.referralCode,
      accountStatus: users.accountStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username ?? null,
    name: row.name,
    email: row.email,
    role: row.role === 'admin' ? 'admin' : 'investor',
    referralCode: row.referralCode,
    accountStatus: row.accountStatus === 'Blocked' ? 'Blocked' : 'Active',
  };
}

export function extractCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

export function extractAuthToken(req: Request): {
  token: string | null;
  viaCookie: boolean;
} {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return { token, viaCookie: false };
  }
  const cookies = extractCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    return { token: cookies[SESSION_COOKIE_NAME], viaCookie: true };
  }
  return { token: null, viaCookie: false };
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') return true;
  const host = String(req.headers.host || '');
  return host.includes('run.app');
}

export function setSessionCookie(req: Request, res: Response, token: string): void {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const https = isHttpsRequest(req);
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(https ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function clearSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax',
    ...(https ? ['Secure', 'Partitioned'] : []),
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function verifyMutationOriginOrHeader(req: Request): boolean {
  // A caller-controlled X-Requested-With header is not proof of a same-origin request.
  // Cookie-authenticated mutations must carry a matching Origin header.
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const expectedHost = String(
      req.headers['x-forwarded-host'] || req.headers.host || ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();
    return Boolean(expectedHost && originHost === expectedHost);
  } catch {
    return false;
  }
}
