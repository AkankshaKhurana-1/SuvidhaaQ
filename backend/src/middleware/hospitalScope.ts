import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { sendError } from '../utils/response';

export function hospitalScope(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    next();
    return;
  }

  // If patient, hospital scoping does not restrict browsing, but restricts access to patient's own records
  if (req.user.role === 'PATIENT') {
    next();
    return;
  }

  // For hospital staff (ADMIN, DOCTOR, RECEPTIONIST), enforce hospital tenant boundary
  const targetHospitalId =
    (req.params.hospitalId as string) ||
    (req.query.hospitalId as string) ||
    (req.headers['x-hospital-id'] as string) ||
    (req.body && req.body.hospitalId);

  if (targetHospitalId && req.user.hospitalId && targetHospitalId !== req.user.hospitalId) {
    sendError(
      res,
      'Cross-hospital access forbidden. You cannot access data outside your assigned hospital.',
      403,
      'CROSS_HOSPITAL_FORBIDDEN'
    );
    return;
  }

  next();
}
