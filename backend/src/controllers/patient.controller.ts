import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';
import { sendSuccess } from '../utils/response';
import { bookVisitSchema, updateProfileSchema } from '../validators/patient.validator';

const patientService = new PatientService();

export class PatientController {
  public static async bookVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = bookVisitSchema.parse(req.body);
      const result = await patientService.bookVisit(req.user!.id, parsed);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await patientService.cancelAppointment(req.user!.id, id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await patientService.getDashboardData(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await patientService.getMyToken(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await patientService.getAppointments(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await patientService.getProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const result = await patientService.updateProfile(req.user!.id, parsed);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
