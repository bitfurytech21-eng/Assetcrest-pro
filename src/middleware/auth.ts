import type { Request, Response, NextFunction } from 'express';
import {
  AuthenticatedSessionUser,
  extractAuthToken,
  lookupSessionUserId,
  resolveUserByToken,
  verifyMutationOriginOrHeader,
} from '../lib/auth-session.ts';
import { isDatabaseConfigured } from '../db/index.ts';
import { getMemoryUserById } from '../db/neonRepo.ts';

export interface AuthRequest extends Request {
  user?: AuthenticatedSessionUser;
  authToken?: string;
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { token, viaCookie } = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  if (viaCookie && MUTATION_METHODS.has(req.method) && !verifyMutationOriginOrHeader(req)) {
    return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
  }

  try {
    let user: AuthenticatedSessionUser | null = null;
    if (isDatabaseConfigured) {
      user = await resolveUserByToken(token);
    } else {
      const userId = await lookupSessionUserId(token);
      if (userId) {
        const memUser = await getMemoryUserById(userId);
        if (memUser) {
          user = {
            id: memUser.id,
            username: memUser.username ?? null,
            name: memUser.name,
            email: memUser.email,
            role: memUser.role,
            referralCode: memUser.referralCode,
            accountStatus: memUser.accountStatus === 'Blocked' ? 'Blocked' : 'Active',
          };
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }
    if (user.accountStatus === 'Blocked') {
      return res.status(403).json({ error: 'Account is blocked by Platform Administration' });
    }

    req.user = user;
    req.authToken = token;
    next();
  } catch (error) {
    console.error('Error verifying session token:', error);
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  next();
};
