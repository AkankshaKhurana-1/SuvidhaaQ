import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/queue.service';
import { sendSuccess, sendError } from '../utils/response';
import { walkInSchema, emergencySchema } from '../validators/queue.validator';

const queueService = new QueueService();

export class QueueController {
  public static async registerWalkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = walkInSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const token = await queueService.registerWalkIn(
        req.user!.hospitalId!,
        req.user!.id,
        req.user!.role,
        parsed.data
      );
      sendSuccess(res, token, 'Walk-in patient registered and token issued', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async markArrived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await queueService.markArrived(
        req.user!.hospitalId!,
        req.user!.id,
        req.user!.role,
        id
      );
      sendSuccess(res, updated, 'Patient marked as arrived');
    } catch (error) {
      next(error);
    }
  }

  public static async markNoShow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await queueService.markNoShow(
        req.user!.hospitalId!,
        req.user!.id,
        req.user!.role,
        id
      );
      sendSuccess(res, updated, 'Patient marked as no-show');
    } catch (error) {
      next(error);
    }
  }

  public static async flagEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = emergencySchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const token = await queueService.flagEmergency(
        req.user!.hospitalId!,
        req.user!.id,
        req.user!.role,
        parsed.data
      );
      sendSuccess(res, token, 'Emergency patient triaged and prioritized', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getLive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.query.doctorId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const liveData = await queueService.getLiveQueue(
        req.user!.hospitalId!,
        doctorId,
        departmentId
      );
      sendSuccess(res, liveData, 'Live queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async searchPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const patients = await queueService.searchPatients(req.user!.hospitalId!, search);
      sendSuccess(res, patients, 'Patients retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
