import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const reportService = new ReportService();

// Validation schema for report upload request body (matches Contract API 18)
const uploadReportSchema = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  token: z.number().int('Token must be an integer'),
  test_type: z.string().min(1, 'Test type is required'),
  file: z.string().url('Invalid file URL format'),
});

export class ReportController {
  /**
   * POST /api/report/upload
   * Registers a new report for a patient.
   */
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = uploadReportSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, parsed.error.format());
        return;
      }

      const report = await reportService.uploadReport(parsed.data);
      sendSuccess(res, report, 'Report uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/report/:patient_id
   * Retrieves reports registered for a specific patient.
   */
  public static async getByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.patient_id as string;
      if (!patientId) {
        sendError(res, 'Patient ID is required', 400);
        return;
      }

      const reports = await reportService.getReportsByPatient(patientId);
      sendSuccess(res, reports, 'Patient reports retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/report/doctor/:token_id
   * Retrieves reports for a doctor to review by reference token_id.
   */
  public static async getByDoctorToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokenId = Number(req.params.token_id);
      if (isNaN(tokenId)) {
        sendError(res, 'Token ID is required and must be an integer', 400);
        return;
      }

      const reports = await reportService.getReportsByDoctorToken(tokenId);
      sendSuccess(res, reports, 'Reports retrieved successfully for doctor review');
    } catch (error) {
      next(error);
    }
  }
}
