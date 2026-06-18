import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 401, 'Authentication required. Invalid token format.');
    }
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token.');
  }
};
// TODO
