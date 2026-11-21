import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  role: Role;
  hospitalId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access denied. Bearer token required.', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.sub,
      role: decoded.role as Role,
      hospitalId: decoded.hospitalId || null,
      name: decoded.name,
      email: decoded.email || null,
      phone: decoded.phone || null,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token expired.', 401, 'TOKEN_EXPIRED');
    } else {
      sendError(res, 'Invalid authentication token.', 401, 'INVALID_TOKEN');
    }
  }
}
