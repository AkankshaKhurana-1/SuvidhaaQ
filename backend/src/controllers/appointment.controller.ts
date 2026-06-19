import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const appointmentService = new AppointmentService();

// Zod schema for appointment booking request body validation (matches Contract API 15)
const bookAppointmentSchema = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  doctor_id: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (must be YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (must be HH:MM)'),
  type: z.enum(['new', 'followup']),
  notes: z.string().min(1, 'Notes cannot be empty').optional(),
});

export class AppointmentController {
  /**
   * POST /api/appointment/book
   * Books a new appointment slot for a patient.
   */
  public static async book(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = bookAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, parsed.error.format());
        return;
      }

      const { patient_id, doctor_id, date, time, type, notes } = parsed.data;

      // Invoke placeholder service
      const appointment = await appointmentService.bookAppointment({
        patient_id,
        doctor_id,
        date,
        time,
        type,
        notes,
      });

      sendSuccess(res, appointment, 'Appointment booked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/appointment/all
   * Fetches all appointments registered in the system.
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointments = await appointmentService.getAllAppointments();
      sendSuccess(res, appointments, 'All appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/appointment/:patient_id
   * Fetches appointments registered for a specific patient.
   */
  public static async getByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.patient_id as string;
      if (!patientId) {
        sendError(res, 'Patient ID is required', 400);
        return;
      }

      const appointments = await appointmentService.getAppointmentsByPatient(patientId);
      sendSuccess(res, appointments, 'Patient appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
