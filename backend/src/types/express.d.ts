import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        hospitalId?: string | null;
        name: string;
        email?: string | null;
        phone?: string | null;
      };
    }
  }
}

export {};
