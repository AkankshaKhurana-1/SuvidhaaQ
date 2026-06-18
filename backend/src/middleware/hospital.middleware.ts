import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';
import { prisma } from '../prisma/client';

export const requireHospitalAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
   
    const hospitalId = req.body.hospitalId || req.params.hospitalId || req.query.hospitalId;
    const userId = req.user.id;

    if (!hospitalId) {

      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return sendError(res, 401, 'User not found');
    }

   
    if (user.role === 'PATIENT') {
        return sendError(res, 403, 'Patients cannot manage hospital resources');
    }

    if (user.hospitalId !== hospitalId) {
      return sendError(res, 403, 'Access denied. You are not assigned to this hospital.');
    }

    next();
  } catch (error) {
    return sendError(res, 500, 'Error verifying hospital access', error);
  }
};
