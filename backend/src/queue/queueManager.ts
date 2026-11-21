import { TokenStatus, QueueTier, AppointmentType } from '@prisma/client';
import { prisma } from '../prisma/client';
import { PriorityEngine } from './priorityEngine';
import { WaitTimeCalculator } from './waitTimeCalculator';

export class QueueManager {
  private static readonly ALLOWED_TRANSITIONS: Record<TokenStatus, TokenStatus[]> = {
    [TokenStatus.PENDING]: [TokenStatus.ARRIVED, TokenStatus.NO_SHOW, TokenStatus.CANCELLED],
    [TokenStatus.ARRIVED]: [TokenStatus.CALLED, TokenStatus.NO_SHOW, TokenStatus.CANCELLED],
    [TokenStatus.DELAYED]: [TokenStatus.ARRIVED],
    [TokenStatus.CALLED]: [TokenStatus.IN_CONSULTATION, TokenStatus.ARRIVED],
    [TokenStatus.IN_CONSULTATION]: [TokenStatus.COMPLETED],
    [TokenStatus.COMPLETED]: [],
    [TokenStatus.NO_SHOW]: [],
    [TokenStatus.CANCELLED]: [],
  };

  /**
   * Enforces strict state machine transitions. Rejects invalid transitions with 409 Conflict.
   */
  public static validateTransition(current: TokenStatus, next: TokenStatus): void {
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      const error: any = new Error(
        `Invalid token state transition from '${current}' to '${next}'. Allowed: [${allowed.join(', ')}]`
      );
      error.statusCode = 409;
      error.code = 'INVALID_STATE_TRANSITION';
      throw error;
    }
  }

  /**
   * Recalculates position, score, and ETA for all waiting tokens in a doctor's queue.
   */
  public static async recalculateDoctorQueue(doctorId: string): Promise<void> {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) return;

    // Active consultation currently in progress
    const activeConsultation = await prisma.queueToken.findFirst({
      where: {
        doctorId,
        status: TokenStatus.IN_CONSULTATION,
      },
    });

    let currentRemainingMins = 0;
    if (activeConsultation && activeConsultation.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(activeConsultation.startedAt).getTime()) / 60000);
      const planned = WaitTimeCalculator.getPlannedDuration(activeConsultation.tier);
      currentRemainingMins = Math.max(0, planned - elapsed);
    }

    // Fetch all arrived waiting tokens
    const waitingTokens = await prisma.queueToken.findMany({
      where: {
        doctorId,
        status: TokenStatus.ARRIVED,
      },
      include: {
        patient: {
          include: { labReports: true },
        },
        appointment: true,
      },
    });

    if (waitingTokens.length === 0) return;

    // Compute updated scores with waiting bonus
    const scoredTokens = waitingTokens.map((token) => {
      const arrivedTime = token.arrivedAt ? new Date(token.arrivedAt).getTime() : Date.now();
      const minutesWaiting = Math.max(0, Math.floor((Date.now() - arrivedTime) / 60000));
      const hasLabResults = token.patient.labReports.some((r) => r.status === 'Ready');

      const score = PriorityEngine.computeScore({
        type: token.appointment?.type || AppointmentType.WALK_IN,
        age: token.patient.age,
        hasLabResults,
        minutesWaiting,
        lateCount: token.lateCount,
      });

      return {
        ...token,
        score,
      };
    });

    // Sort by PriorityEngine: Tier -> Score -> arrivedAt
    scoredTokens.sort(PriorityEngine.compareTokens);

    // Update positions and wait times in database
    for (let i = 0; i < scoredTokens.length; i++) {
      const t = scoredTokens[i];
      const position = i + 1;
      const tokensAhead = scoredTokens.slice(0, i);

      const waitMins = WaitTimeCalculator.calculateWaitMinutes(
        tokensAhead,
        doctor.sessionDelay,
        currentRemainingMins
      );

      await prisma.queueToken.update({
        where: { id: t.id },
        data: {
          score: t.score,
          position,
          estimatedWaitMinutes: waitMins,
        },
      });
    }
  }
}
