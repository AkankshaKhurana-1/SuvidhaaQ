import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/queue.service';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import {
  completeConsultationSchema,
  updateAvailabilitySchema,
} from '../validators/queue.validator';

const queueService = new QueueService();

async function getDoctorForUser(userId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
  });
  return doctor;
}

export class DoctorController {
  public static async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const queueData = await queueService.getDoctorQueue(doctor.id);
      sendSuccess(res, queueData, 'Doctor workstation queue retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async callNext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const result = await queueService.callNext(doctor.id, req.user!.id);
      sendSuccess(res, result, 'Next patient action completed');
    } catch (error) {
      next(error);
    }
  }

  public static async startConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const tokenId = req.params.id as string;
      const result = await queueService.startConsultation(doctor.id, tokenId, req.user!.id);
      sendSuccess(res, result, 'Consultation started');
    } catch (error) {
      next(error);
    }
  }

  public static async completeConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const parsed = completeConsultationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const tokenId = req.params.id as string;
      const result = await queueService.completeConsultation(
        doctor.id,
        tokenId,
        req.user!.id,
        parsed.data
      );
      sendSuccess(res, result, 'Consultation completed');
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const history = await queueService.getDoctorHistory(doctor.id);
      sendSuccess(res, history, 'Consultation history retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await getDoctorForUser(req.user!.id);
      if (!doctor) {
        sendError(res, 'Doctor profile not found for current user', 404);
        return;
      }
      const parsed = updateAvailabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const updated = await queueService.updateDoctorAvailability(
        doctor.id,
        parsed.data.available,
        req.user!.id
      );
      sendSuccess(res, updated, 'Doctor availability updated');
    } catch (error) {
      next(error);
    }
  }
}
