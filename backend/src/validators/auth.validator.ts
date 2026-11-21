import { z } from 'zod';

export const registerPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  age: z.number().int().positive().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
});

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(4, 'Password is required'),
  })
  .refine((data) => !!(data.identifier || data.email || data.phone), {
    message: 'Either identifier, email, or phone must be provided',
    path: ['identifier'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refreshToken is required'),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
