import { QueueTier, AppointmentType } from '@prisma/client';

export interface ScoreParams {
  type: AppointmentType;
  age: number;
  hasLabResults?: boolean;
  minutesWaiting: number;
  lateCount?: number;
}

export class PriorityEngine {
  /**
   * Computes dynamic priority score according to SuvidhaaQ specification:
   * score = category_bonus + senior_bonus + test_bonus + waiting_bonus − lateness_penalty
   */
  public static computeScore(params: ScoreParams): number {
    // 1. category_bonus: NEW +20, FOLLOW_UP +15, WALK_IN +5
    let categoryBonus = 5;
    if (params.type === AppointmentType.NEW) {
      categoryBonus = 20;
    } else if (params.type === AppointmentType.FOLLOW_UP) {
      categoryBonus = 15;
    }

    // 2. senior_bonus: +20 if age ≥ 60
    const seniorBonus = params.age >= 60 ? 20 : 0;

    // 3. test_bonus: +25 if lab results are available
    const testBonus = params.hasLabResults ? 25 : 0;

    // 4. waiting_bonus: +3 for every full 5 minutes spent waiting (uncapped, prevents starvation)
    const fullFiveMinBlocks = Math.max(0, Math.floor(params.minutesWaiting / 5));
    const waitingBonus = fullFiveMinBlocks * 3;

    // 5. lateness_penalty: −5 (1st), −15 (2nd), −30 (3rd or more) within rolling 60 days
    let latenessPenalty = 0;
    const lates = params.lateCount || 0;
    if (lates === 1) {
      latenessPenalty = 5;
    } else if (lates === 2) {
      latenessPenalty = 15;
    } else if (lates >= 3) {
      latenessPenalty = 30;
    }

    return categoryBonus + seniorBonus + testBonus + waitingBonus - latenessPenalty;
  }

  /**
   * Tier priority numeric ranking (higher number = processed first).
   * 1 EMERGENCY > 2 SENIOR > 3 NEW_CONSULTATION > 4 FOLLOW_UP > 5 WALK_IN
   */
  public static getTierRank(tier: QueueTier): number {
    switch (tier) {
      case QueueTier.EMERGENCY:
        return 5;
      case QueueTier.SENIOR:
        return 4;
      case QueueTier.NEW_CONSULTATION:
        return 3;
      case QueueTier.FOLLOW_UP:
        return 2;
      case QueueTier.WALK_IN:
      default:
        return 1;
    }
  }

  /**
   * Pure comparator function for sorting queue tokens.
   * Compares Tier first, then Score descending, then arrivedAt earlier.
   */
  public static compareTokens(
    a: { tier: QueueTier; score: number; arrivedAt: Date | null | string },
    b: { tier: QueueTier; score: number; arrivedAt: Date | null | string }
  ): number {
    const rankA = PriorityEngine.getTierRank(a.tier);
    const rankB = PriorityEngine.getTierRank(b.tier);

    if (rankA !== rankB) {
      return rankB - rankA; // Higher rank first
    }

    if (a.score !== b.score) {
      return b.score - a.score; // Higher score first
    }

    // Tie-breaker: earlier arrivedAt
    const timeA = a.arrivedAt ? new Date(a.arrivedAt).getTime() : Infinity;
    const timeB = b.arrivedAt ? new Date(b.arrivedAt).getTime() : Infinity;
    return timeA - timeB;
  }
}
