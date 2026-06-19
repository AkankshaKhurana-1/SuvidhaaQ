import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';
import { sendSuccess, sendError } from '../utils/response';
import { updateDoctorStatusValidator } from '../validators/doctor.validator';

const doctorService = new DoctorService();

export class DoctorController {
  /**
   * GET /api/doctor/:doctor_id
   * Fetches detailed profile of a specific doctor.
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.doctor_id as string;
      if (!doctorId) {
        sendError(res, 'Doctor ID is required', 400);
        return;
      }

      const profile = await doctorService.getDoctorProfile(doctorId);
      sendSuccess(res, profile, 'Doctor profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctor/status
   * Updates availability state of a doctor.
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateDoctorStatusValidator.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, parsed.error.format());
        return;
      }

      const { doctor_id, status, reason } = parsed.data;
      const result = await doctorService.updateDoctorStatus(doctor_id, status, reason);
      sendSuccess(res, result, 'Doctor status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
