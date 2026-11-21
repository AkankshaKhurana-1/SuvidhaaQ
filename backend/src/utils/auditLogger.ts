import { prisma } from '../prisma/client';

export interface AuditLogParams {
  hospitalId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  role: string;
  action: string;
  entity: string;
  beforeJson?: any;
  afterJson?: any;
}

// Sanitize sensitive fields before writing to audit log
function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'clinicalNotes', 'diagnosis'];
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.includes(key)) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object') {
      clone[key] = sanitize(clone[key]);
    }
  }
  return clone;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        hospitalId: params.hospitalId || null,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        role: params.role,
        action: params.action,
        entity: params.entity,
        beforeJson: params.beforeJson ? sanitize(params.beforeJson) : undefined,
        afterJson: params.afterJson ? sanitize(params.afterJson) : undefined,
      },
    });
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
}
