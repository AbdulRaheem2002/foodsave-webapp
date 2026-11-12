import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'foodsave_pakistan_secret_key_2026';
}

export interface AuthPayload {
  id: string;
  role: 'consumer' | 'retailer';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, getJwtSecret()) as AuthPayload;
    } catch {
      // Ignore invalid optional token and proceed as guest
    }
  }
  next();
}

export function requireRetailer(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'retailer') {
    res.status(403).json({ error: 'Merchant Partner account required for this action.' });
    return;
  }
  next();
}
