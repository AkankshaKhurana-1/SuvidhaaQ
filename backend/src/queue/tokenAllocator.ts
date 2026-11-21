import { PrismaClient, AppointmentType, QueueTier } from '@prisma/client';

export class TokenAllocator {
  /**
   * Concurrency-safe atomic token sequence generator.
   * Uses an atomic upsert with RETURNING in PostgreSQL inside a transaction.
   */
  public static async getNextSequence(
    tx: any,
    hospitalId: string,
    doctorId: string,
    dateStr: string
  ): Promise<number> {
    const result = await tx.$queryRaw<Array<{ currentSequence: number }>>`
      INSERT INTO "DoctorDailySequence" ("id", "hospitalId", "doctorId", "date", "currentSequence", "updatedAt")
      VALUES (gen_random_uuid(), ${hospitalId}, ${doctorId}, ${dateStr}, 1, NOW())
      ON CONFLICT ("doctorId", "date")
      DO UPDATE SET "currentSequence" = "DoctorDailySequence"."currentSequence" + 1, "updatedAt" = NOW()
      RETURNING "currentSequence";
    `;

    if (!result || result.length === 0) {
      throw new Error('Failed to generate atomic sequence counter');
    }

    return Number(result[0].currentSequence);
  }

  /**
   * Formats token code as {CATEGORY}-{SEQUENCE}
   * e.g. NEW-001, FUP-004, WLK-012, EMG-001
   */
  public static formatTokenCode(tier: QueueTier, sequence: number): string {
    let prefix = 'NEW';
    switch (tier) {
      case QueueTier.EMERGENCY:
        prefix = 'EMG';
        break;
      case QueueTier.SENIOR:
        prefix = 'SNR';
        break;
      case QueueTier.FOLLOW_UP:
        prefix = 'FUP';
        break;
      case QueueTier.WALK_IN:
        prefix = 'WLK';
        break;
      case QueueTier.NEW_CONSULTATION:
      default:
        prefix = 'NEW';
        break;
    }
    const padded = String(sequence).padStart(3, '0');
    return `${prefix}-${padded}`;
  }

  /**
   * Determines appropriate initial QueueTier
   */
  public static determineTier(type: AppointmentType, age: number, isEmergency = false): QueueTier {
    if (isEmergency) return QueueTier.EMERGENCY;
    if (age >= 60) return QueueTier.SENIOR;
    if (type === AppointmentType.FOLLOW_UP) return QueueTier.FOLLOW_UP;
    if (type === AppointmentType.WALK_IN) return QueueTier.WALK_IN;
    return QueueTier.NEW_CONSULTATION;
  }
}
