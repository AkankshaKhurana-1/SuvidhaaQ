import { describe, it, expect } from 'vitest';
import { PriorityEngine } from '../src/queue/priorityEngine';
import { QueueManager } from '../src/queue/queueManager';
import { WaitTimeCalculator } from '../src/queue/waitTimeCalculator';
import { TokenAllocator } from '../src/queue/tokenAllocator';
import { QueueTier, AppointmentType, TokenStatus } from '@prisma/client';

describe('Priority Queue Engine - Pure Logic & Unit Tests', () => {
  describe('PriorityEngine.computeScore', () => {
    it('calculates score correctly for standard NEW consultation', () => {
      const score = PriorityEngine.computeScore({
        type: AppointmentType.NEW,
        age: 30,
        hasLabResults: false,
        minutesWaiting: 0,
        lateCount: 0,
      });
      // category_bonus (20) = 20
      expect(score).toBe(20);
    });

    it('adds +20 senior bonus for age >= 60', () => {
      const score = PriorityEngine.computeScore({
        type: AppointmentType.NEW,
        age: 65,
        hasLabResults: false,
        minutesWaiting: 0,
        lateCount: 0,
      });
      // 20 + 20 = 40
      expect(score).toBe(40);
    });

    it('adds +25 test_bonus when lab results are ready', () => {
      const score = PriorityEngine.computeScore({
        type: AppointmentType.FOLLOW_UP,
        age: 40,
        hasLabResults: true,
        minutesWaiting: 0,
        lateCount: 0,
      });
      // category_bonus (15) + test_bonus (25) = 40
      expect(score).toBe(40);
    });

    it('adds anti-starvation dynamic waiting bonus (+3 per 5 minutes without cap)', () => {
      const score0 = PriorityEngine.computeScore({
        type: AppointmentType.WALK_IN,
        age: 25,
        hasLabResults: false,
        minutesWaiting: 0,
        lateCount: 0,
      });
      expect(score0).toBe(5);

      const score30 = PriorityEngine.computeScore({
        type: AppointmentType.WALK_IN,
        age: 25,
        hasLabResults: false,
        minutesWaiting: 30, // 6 intervals of 5 min -> +18
        lateCount: 0,
      });
      // 5 + 18 = 23
      expect(score30).toBe(23);

      const score60 = PriorityEngine.computeScore({
        type: AppointmentType.WALK_IN,
        age: 25,
        hasLabResults: false,
        minutesWaiting: 60, // 12 intervals of 5 min -> +36
        lateCount: 0,
      });
      // 5 + 36 = 41
      expect(score60).toBe(41);
    });

    it('subtracts tiered lateness penalty: -5 (1st), -15 (2nd), -30 (3rd+)', () => {
      const score1 = PriorityEngine.computeScore({
        type: AppointmentType.NEW,
        age: 35,
        hasLabResults: false,
        minutesWaiting: 10, // +6
        lateCount: 1, // -5
      });
      // 20 + 6 - 5 = 21
      expect(score1).toBe(21);

      const score2 = PriorityEngine.computeScore({
        type: AppointmentType.NEW,
        age: 35,
        hasLabResults: false,
        minutesWaiting: 10, // +6
        lateCount: 2, // -15
      });
      // 20 + 6 - 15 = 11
      expect(score2).toBe(11);

      const score3 = PriorityEngine.computeScore({
        type: AppointmentType.NEW,
        age: 35,
        hasLabResults: false,
        minutesWaiting: 10, // +6
        lateCount: 3, // -30
      });
      // 20 + 6 - 30 = -4
      expect(score3).toBe(-4);
    });
  });

  describe('PriorityEngine.compareTokens', () => {
    it('prioritizes higher tier over lower tier regardless of score', () => {
      const emergencyToken = {
        tier: QueueTier.EMERGENCY,
        score: 50,
        arrivedAt: new Date(),
      };
      const seniorToken = {
        tier: QueueTier.SENIOR,
        score: 90,
        arrivedAt: new Date(Date.now() - 3600000),
      };

      // Negative value means token A comes before token B
      expect(PriorityEngine.compareTokens(emergencyToken, seniorToken)).toBeLessThan(0);
    });

    it('prioritizes higher score within the same tier', () => {
      const tokenHigh = {
        tier: QueueTier.NEW_CONSULTATION,
        score: 45,
        arrivedAt: new Date(),
      };
      const tokenLow = {
        tier: QueueTier.NEW_CONSULTATION,
        score: 20,
        arrivedAt: new Date(Date.now() - 60000),
      };

      expect(PriorityEngine.compareTokens(tokenHigh, tokenLow)).toBeLessThan(0);
    });

    it('breaks ties by earlier arrival time', () => {
      const earlier = new Date(Date.now() - 10000);
      const later = new Date(Date.now());

      const token1 = { tier: QueueTier.WALK_IN, score: 20, arrivedAt: earlier };
      const token2 = { tier: QueueTier.WALK_IN, score: 20, arrivedAt: later };

      expect(PriorityEngine.compareTokens(token1, token2)).toBeLessThan(0);
    });
  });

  describe('TokenAllocator tier & code formatting', () => {
    it('determines EMERGENCY tier when emergency flag is set', () => {
      expect(TokenAllocator.determineTier(AppointmentType.WALK_IN, 30, true)).toBe(
        QueueTier.EMERGENCY
      );
    });

    it('determines SENIOR tier when age >= 60', () => {
      expect(TokenAllocator.determineTier(AppointmentType.NEW, 65, false)).toBe(
        QueueTier.SENIOR
      );
    });

    it('formats token code with category prefix and 3-digit sequence', () => {
      expect(TokenAllocator.formatTokenCode(QueueTier.NEW_CONSULTATION, 1)).toBe('NEW-001');
      expect(TokenAllocator.formatTokenCode(QueueTier.FOLLOW_UP, 4)).toBe('FUP-004');
      expect(TokenAllocator.formatTokenCode(QueueTier.WALK_IN, 12)).toBe('WLK-012');
      expect(TokenAllocator.formatTokenCode(QueueTier.EMERGENCY, 1)).toBe('EMG-001');
      expect(TokenAllocator.formatTokenCode(QueueTier.SENIOR, 7)).toBe('SNR-007');
    });
  });

  describe('QueueManager.validateTransition (State Machine)', () => {
    it('allows valid state machine transitions', () => {
      expect(() =>
        QueueManager.validateTransition(TokenStatus.PENDING, TokenStatus.ARRIVED)
      ).not.toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.ARRIVED, TokenStatus.CALLED)
      ).not.toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.CALLED, TokenStatus.IN_CONSULTATION)
      ).not.toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.IN_CONSULTATION, TokenStatus.COMPLETED)
      ).not.toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.DELAYED, TokenStatus.ARRIVED)
      ).not.toThrow();
    });

    it('rejects invalid transitions with 409 Conflict', () => {
      expect(() =>
        QueueManager.validateTransition(TokenStatus.PENDING, TokenStatus.COMPLETED)
      ).toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.COMPLETED, TokenStatus.CALLED)
      ).toThrow();

      expect(() =>
        QueueManager.validateTransition(TokenStatus.ARRIVED, TokenStatus.COMPLETED)
      ).toThrow();
    });
  });

  describe('WaitTimeCalculator cascade delay simulation', () => {
    it('adds doctor session delay cascade onto estimated wait minutes', () => {
      const waitMinutes = WaitTimeCalculator.calculateWaitMinutes(
        [], // no preceding waiting tokens
        15, // session delay 15 mins
        10 // active consultation 10 mins remaining
      );
      // 10 remaining + 15 delay = 25 minutes
      expect(waitMinutes).toBe(25);
    });

    it('accumulates planned durations for preceding queue tokens', () => {
      const waitMinutes = WaitTimeCalculator.calculateWaitMinutes(
        [{ tier: QueueTier.NEW_CONSULTATION }, { tier: QueueTier.FOLLOW_UP }],
        0, // no session delay
        5 // active consultation 5 mins remaining
      );
      // 5 (active) + 15 (NEW) + 8 (FOLLOW_UP) = 28 minutes
      expect(waitMinutes).toBe(28);
    });
  });
});
