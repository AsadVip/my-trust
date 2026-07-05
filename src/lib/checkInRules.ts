export interface CheckInRulesConfig {
  baseReward: number;
  streakBonus: number;
}

export interface CheckInStatus {
  eligible: boolean;
  secondsRemaining: number;
  nextStreak: number;
  baseReward: number;
  streakBonusEarned: number;
  milestoneBonusEarned: number;
  totalEarned: number;
}

/**
 * Calculates check-in eligibility, cooldown time, streak maintenance, and estimated rewards.
 * 
 * Rules:
 * 1. 24-Hour Cooldown: Users can check in at most once every 24 hours.
 * 2. Streak Maintenance: The streak increments if the check-in is done within 48 hours. Otherwise, it resets to 1.
 * 3. Base Reward: Configurable, defaults to 10.00 credits.
 * 4. Streak Bonus: Configurable, defaults to 2.00 credits per streak day (excluding day 1, formula: (streak - 1) * streak_bonus).
 * 5. Milestone Bonuses:
 *    - Day 7: +20.00 credits
 *    - Day 15: +50.00 credits
 *    - Day 30: +150.00 credits
 */
export function calculateCheckInStatus(
  lastCheckIn: Date | null,
  currentStreak: number,
  now: Date,
  config: CheckInRulesConfig = { baseReward: 10.0, streakBonus: 2.0 }
): CheckInStatus {
  let eligible = true;
  let secondsRemaining = 0;
  let nextStreak = 1;

  if (lastCheckIn) {
    const diffMs = now.getTime() - lastCheckIn.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      eligible = false;
      secondsRemaining = Math.max(0, Math.ceil((24 * 60 * 60 * 1000 - diffMs) / 1000));
    }

    if (diffHrs <= 48) {
      nextStreak = currentStreak + 1;
    } else {
      nextStreak = 1;
    }
  } else {
    nextStreak = 1;
  }

  // Calculate rewards
  const baseReward = config.baseReward;
  const streakBonusEarned = (nextStreak - 1) * config.streakBonus;

  let milestoneBonusEarned = 0;
  if (nextStreak === 7) {
    milestoneBonusEarned = 20.00;
  } else if (nextStreak === 15) {
    milestoneBonusEarned = 50.00;
  } else if (nextStreak === 30) {
    milestoneBonusEarned = 150.00;
  }

  const totalEarned = baseReward + streakBonusEarned + milestoneBonusEarned;

  return {
    eligible,
    secondsRemaining,
    nextStreak,
    baseReward,
    streakBonusEarned,
    milestoneBonusEarned,
    totalEarned
  };
}
