import { describe, it, expect } from 'vitest';
import { calculateCheckInStatus } from './checkInRules';

describe('Daily Check-in Rules Engine', () => {
  const defaultConfig = { baseReward: 10.0, streakBonus: 2.0 };

  it('should handle new users with no previous check-in', () => {
    const now = new Date('2026-07-01T12:00:00Z');
    const result = calculateCheckInStatus(null, 0, now, defaultConfig);

    expect(result.eligible).toBe(true);
    expect(result.secondsRemaining).toBe(0);
    expect(result.nextStreak).toBe(1);
    expect(result.baseReward).toBe(10.0);
    expect(result.streakBonusEarned).toBe(0.0);
    expect(result.milestoneBonusEarned).toBe(0.0);
    expect(result.totalEarned).toBe(10.0);
  });

  it('should prevent check-in if less than 24 hours have elapsed', () => {
    const lastCheckIn = new Date('2026-07-01T12:00:00Z');
    const now = new Date('2026-07-02T06:00:00Z'); // 18 hours later
    const result = calculateCheckInStatus(lastCheckIn, 1, now, defaultConfig);

    expect(result.eligible).toBe(false);
    expect(result.secondsRemaining).toBe(6 * 60 * 60); // 6 hours remaining
    expect(result.nextStreak).toBe(2); // If they could check in, it would be streak 2
    expect(result.baseReward).toBe(10.0);
    expect(result.streakBonusEarned).toBe(2.0); // (2 - 1) * 2.0
    expect(result.totalEarned).toBe(12.0);
  });

  it('should allow check-in if exactly 24 hours have elapsed', () => {
    const lastCheckIn = new Date('2026-07-01T12:00:00Z');
    const now = new Date('2026-07-02T12:00:00Z'); // exactly 24 hours later
    const result = calculateCheckInStatus(lastCheckIn, 1, now, defaultConfig);

    expect(result.eligible).toBe(true);
    expect(result.secondsRemaining).toBe(0);
    expect(result.nextStreak).toBe(2);
    expect(result.streakBonusEarned).toBe(2.0);
    expect(result.totalEarned).toBe(12.0);
  });

  it('should allow check-in and maintain streak if within 48 hours', () => {
    const lastCheckIn = new Date('2026-07-01T12:00:00Z');
    const now = new Date('2026-07-03T11:59:59Z'); // 47 hours and 59 seconds later
    const result = calculateCheckInStatus(lastCheckIn, 5, now, defaultConfig);

    expect(result.eligible).toBe(true);
    expect(result.nextStreak).toBe(6);
    expect(result.streakBonusEarned).toBe(10.0); // (6 - 1) * 2.0
    expect(result.totalEarned).toBe(20.0);
  });

  it('should reset streak if more than 48 hours have elapsed', () => {
    const lastCheckIn = new Date('2026-07-01T12:00:00Z');
    const now = new Date('2026-07-03T12:00:01Z'); // 48 hours and 1 second later
    const result = calculateCheckInStatus(lastCheckIn, 5, now, defaultConfig);

    expect(result.eligible).toBe(true);
    expect(result.nextStreak).toBe(1);
    expect(result.streakBonusEarned).toBe(0.0);
    expect(result.totalEarned).toBe(10.0);
  });

  describe('Milestone Bonuses', () => {
    it('should award day 7 milestone bonus of +20.00', () => {
      const lastCheckIn = new Date('2026-07-01T12:00:00Z');
      const now = new Date('2026-07-02T13:00:00Z'); // 25 hours later
      const result = calculateCheckInStatus(lastCheckIn, 6, now, defaultConfig);

      expect(result.nextStreak).toBe(7);
      expect(result.baseReward).toBe(10.0);
      expect(result.streakBonusEarned).toBe(12.0); // (7 - 1) * 2.0
      expect(result.milestoneBonusEarned).toBe(20.0);
      expect(result.totalEarned).toBe(42.0); // 10 + 12 + 20
    });

    it('should award day 15 milestone bonus of +50.00', () => {
      const lastCheckIn = new Date('2026-07-01T12:00:00Z');
      const now = new Date('2026-07-02T13:00:00Z');
      const result = calculateCheckInStatus(lastCheckIn, 14, now, defaultConfig);

      expect(result.nextStreak).toBe(15);
      expect(result.baseReward).toBe(10.0);
      expect(result.streakBonusEarned).toBe(28.0); // (15 - 1) * 2.0
      expect(result.milestoneBonusEarned).toBe(50.0);
      expect(result.totalEarned).toBe(88.0); // 10 + 28 + 50
    });

    it('should award day 30 milestone bonus of +150.00', () => {
      const lastCheckIn = new Date('2026-07-01T12:00:00Z');
      const now = new Date('2026-07-02T13:00:00Z');
      const result = calculateCheckInStatus(lastCheckIn, 29, now, defaultConfig);

      expect(result.nextStreak).toBe(30);
      expect(result.baseReward).toBe(10.0);
      expect(result.streakBonusEarned).toBe(58.0); // (30 - 1) * 2.0
      expect(result.milestoneBonusEarned).toBe(150.0);
      expect(result.totalEarned).toBe(218.0); // 10 + 58 + 150
    });
  });

  describe('Custom Rewards Configuration', () => {
    it('should apply custom base reward and streak bonus settings', () => {
      const lastCheckIn = new Date('2026-07-01T12:00:00Z');
      const now = new Date('2026-07-02T13:00:00Z');
      const customConfig = { baseReward: 5.0, streakBonus: 0.5 };
      const result = calculateCheckInStatus(lastCheckIn, 4, now, customConfig);

      expect(result.nextStreak).toBe(5);
      expect(result.baseReward).toBe(5.0);
      expect(result.streakBonusEarned).toBe(2.0); // (5 - 1) * 0.5
      expect(result.totalEarned).toBe(7.0); // 5 + 2
    });
  });
});
