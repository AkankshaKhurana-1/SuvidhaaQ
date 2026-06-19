import { Request, Response, NextFunction } from 'express';

export interface HospitalRequest extends Request {
  hospitalId?: string;
}

export const hospitalMiddleware = (
  req: HospitalRequest,
  res: Response,
  next: NextFunction
): void => {
  // Extract Hospital ID/Branch ID from headers to support multi-branch hospital setups
  const hospitalId = req.headers['x-hospital-id'] as string;

  if (hospitalId) {
    req.hospitalId = hospitalId;
  }

  // TODO: Add verification for hospitalId exists in config/database if multi-tenancy is active

  next();
};
