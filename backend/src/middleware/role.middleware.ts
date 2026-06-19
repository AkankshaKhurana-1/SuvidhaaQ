import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
      return;
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
};
