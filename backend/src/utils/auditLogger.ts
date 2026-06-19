// TODO: Implement actual database write for audit logs using Prisma client

export interface PatientStatusAuditInput {
  patientId: string;
  token: number;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedByRole: string;
  remarks?: string;
}

export const logAction = async (
  userId: string | null,
  action: string,
  details: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG - ${timestamp}] User: ${userId || 'SYSTEM'} | Action: ${action} | Details: ${details}`);

  try {
    // TODO: Write audit log to database via Prisma:
    // await prisma.auditLog.create({
    //   data: { userId, action, details }
    // });
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
};

/**
 * Logs a patient queue status transition to the audit trail.
 */
export const logPatientStatusChange = async (data: PatientStatusAuditInput): Promise<void> => {
  const timestamp = new Date().toISOString();
  console.log(
    `[PATIENT STATUS AUDIT - ${timestamp}] Patient: ${data.patientId} | Token: ${data.token} | ` +
    `Transition: ${data.oldStatus} -> ${data.newStatus} | Changed By: ${data.changedBy} (${data.changedByRole}) | ` +
    `Remarks: ${data.remarks || 'None'}`
  );

  try {
    // TODO: Write status change history to database via Prisma:
    // await prisma.patientStatusHistory.create({
    //   data: {
    //     patientId: data.patientId,
    //     token: data.token,
    //     oldStatus: data.oldStatus,
    //     newStatus: data.newStatus,
    //     changedBy: data.changedBy,
    //     changedByRole: data.changedByRole,
    //     remarks: data.remarks || null
    //   }
    // });
  } catch (error) {
    console.error('❌ Failed to write patient status history audit log:', error);
  }
};
