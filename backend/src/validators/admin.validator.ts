import { z } from 'zod';
import { Role } from '@prisma/client';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([Role.RECEPTIONIST, Role.DOCTOR, Role.ADMIN]),
  departmentId: z.string().uuid().optional(),
  room: z.string().optional(),
  specialization: z.string().optional(),
  consultationMinutes: z.number().int().positive().optional().default(15),
});

export const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{10}$/).optional(),
  isActive: z.boolean().optional(),
});

export const updateDoctorRosterSchema = z.object({
  available: z.boolean().optional(),
  room: z.string().optional(),
  sessionDelay: z.number().int().optional(),
});

export const capacitySettingsSchema = z
  .object({
    departmentId: z.string().uuid('Valid department ID required'),
    newQuota: z.number().int().min(0).max(100),
    followUpQuota: z.number().int().min(0).max(100),
    walkInQuota: z.number().int().min(0).max(100),
  })
  .refine(
    (data) => data.newQuota + data.followUpQuota + data.walkInQuota === 100,
    {
      message: 'Capacity quotas must sum to exactly 100%',
      path: ['walkInQuota'],
    }
  );

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2, 'Department code is required'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type UpdateDoctorRosterInput = z.infer<typeof updateDoctorRosterSchema>;
export type CapacitySettingsInput = z.infer<typeof capacitySettingsSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
