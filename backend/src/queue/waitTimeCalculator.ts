import { QueueTier, AppointmentType } from '@prisma/client';

export class WaitTimeCalculator {
  public static getPlannedDuration(tier: QueueTier): number {
    switch (tier) {
      case QueueTier.EMERGENCY:
        return 20;
      case QueueTier.FOLLOW_UP:
        return 8;
      case QueueTier.NEW_CONSULTATION:
      case QueueTier.SENIOR:
      case QueueTier.WALK_IN:
      default:
        return 15;
    }
  }

  /**
   * Calculates estimated wait minutes for token at target index in ordered waiting list.
   * ETA = now + sum(duration of tokens ahead) + sessionDelay
   */
  public static calculateWaitMinutes(
    tokensAhead: Array<{ tier: QueueTier }>,
    sessionDelayMinutes: number = 0,
    currentConsultationRemainingMinutes: number = 0
  ): number {
    let wait = currentConsultationRemainingMinutes + sessionDelayMinutes;

    for (const t of tokensAhead) {
      wait += WaitTimeCalculator.getPlannedDuration(t.tier);
    }

    return Math.max(0, Math.round(wait));
  }
}
