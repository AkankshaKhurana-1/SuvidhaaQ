import { z } from 'zod';
import { AppointmentType } from '@prisma/client';

export const bookVisitSchema = z.object({
  hospitalId: z.string().uuid('Valid hospital ID required'),
  doctorId: z.string().uuid('Valid doctor ID required'),
  scheduledAt: z.string().datetime('Valid ISO datetime required'),
  type: z.nativeEnum(AppointmentType).default(AppointmentType.NEW),
  patientDetails: z.object({
    name: z.string().min(2, 'Patient name required'),
    age: z.number().int().positive('Valid age required'),
    gender: z.enum(['Male', 'Female', 'Other']).default('Other'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number required'),
    isFamilyMember: z.boolean().default(false),
  }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{10}$/).optional(),
});

export type BookVisitInput = z.infer<typeof bookVisitSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
