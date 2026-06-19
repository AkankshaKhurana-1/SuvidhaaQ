import { z } from 'zod';

export const updateDoctorStatusValidator = z.object({
  doctor_id: z.string().min(1, 'Doctor ID is required'),
  status: z.string().min(1, 'Status is required'),
  reason: z.string().min(1, 'Reason cannot be empty').optional(),
});
