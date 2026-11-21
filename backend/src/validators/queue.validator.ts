import { z } from 'zod';

export const walkInSchema = z.object({
  name: z.string().min(2, 'Patient name required'),
  age: z.number().int().positive('Valid age required'),
  gender: z.enum(['Male', 'Female', 'Other']).default('Other'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number required'),
  doctorId: z.string().uuid('Valid doctor ID required'),
});

export const emergencySchema = z.object({
  name: z.string().min(2, 'Patient name required'),
  age: z.number().int().positive('Valid age required'),
  gender: z.enum(['Male', 'Female', 'Other']).default('Other'),
  phone: z.string().optional().default('9999999999'),
  doctorId: z.string().uuid('Valid doctor ID required'),
  reason: z.string().min(3, 'Emergency triage reason required'),
});

export const completeConsultationSchema = z.object({
  notes: z.string().min(1, 'Consultation notes required'),
  followUpDate: z.string().datetime().optional(),
});

export const updateAvailabilitySchema = z.object({
  available: z.boolean(),
});

export type WalkInInput = z.infer<typeof walkInSchema>;
export type EmergencyInput = z.infer<typeof emergencySchema>;
export type CompleteConsultationInput = z.infer<typeof completeConsultationSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
