import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User, AuditLog } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zappkart-dev-secure-jwt-secret-key-super-random-2026';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function generateToken(user: User): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token is missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
    // Check if user still exists and is not suspended
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact marketplace administrator.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireSeller(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: Requires an approved seller account.' });
    }
    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Restricted to Super Administrator.' });
    }
    next();
  });
}

export function getOptionalUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      const user = db.users.find(u => u.id === decoded.userId && u.status === 'active');
      if (user) {
        req.user = decoded;
      }
    } catch {
      // Ignored for optional
    }
  }
  next();
}

export function logAudit(
  actor: { id: string; email: string; role: string } | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: any,
  ip?: string
) {
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actorId: actor?.id || 'system',
    actorEmail: actor?.email || 'system@zappkart.com',
    actorRole: actor?.role || 'system',
    action,
    entityType,
    entityId,
    details,
    ip,
    createdAt: new Date().toISOString(),
  };

  db.auditLogs.unshift(log);
  // Keep last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs.pop();
  }
  db.save();
}
