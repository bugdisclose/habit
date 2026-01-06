import { eq, and } from 'drizzle-orm';
import { BADGES, type BadgeDefinition } from '../../shared/badges';

interface BadgeCheckContext {
  userId: string;
  habitId?: number;
  streak?: number;
}

// Check and award badges for a user after habit completion
export async function checkAndAwardBadges(ctx: BadgeCheckContext): Promise<BadgeDefinition[]> {
  const db = useDB();
  const newlyEarnedBadges: BadgeDefinition[] = [];

  // Get user's current badges
  const existingBadges = await db
    .select({ badgeId: tables.userBadges.badgeId })
    .from(tables.userBadges)
    .where(eq(tables.userBadges.userId, ctx.userId))
    .all();

  const earnedBadgeIds = new Set(existingBadges.map(b => b.badgeId));

  // Get user's habits for calculations
  const userHabits = await db
    .select()
    .from(tables.habits)
    .where(eq(tables.habits.userId, ctx.userId))
    .all();

  // Calculate stats
  const totalCompletions = userHabits.reduce((sum, h) => sum + h.completeDays.length, 0);
  const maxStreak = Math.max(...userHabits.map(h => calculateStreak(h.completeDays)), 0);
  const habitsCount = userHabits.length;

  // Get share count
  const shares = await db
    .select()
    .from(tables.habitShares)
    .where(and(
      eq(tables.habitShares.userId, ctx.userId),
      eq(tables.habitShares.status, 'accepted')
    ))
    .all();
  const shareCount = shares.length;

  // Check each badge
  for (const badge of BADGES) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) continue;

    let earned = false;
    let context: { habitId?: number; streak?: number; count?: number } = {};

    switch (badge.criteria.type) {
      case 'streak':
        if (maxStreak >= badge.criteria.value) {
          earned = true;
          context = { streak: maxStreak };
        }
        break;

      case 'first_completion':
        if (totalCompletions >= 1) {
          earned = true;
          context = { count: 1 };
        }
        break;

      case 'total_completions':
        if (totalCompletions >= badge.criteria.value) {
          earned = true;
          context = { count: totalCompletions };
        }
        break;

      case 'habits_created':
        if (habitsCount >= badge.criteria.value) {
          earned = true;
          context = { count: habitsCount };
        }
        break;

      case 'shares':
        if (shareCount >= badge.criteria.value) {
          earned = true;
          context = { count: shareCount };
        }
        break;

      case 'buddy_streak':
        // Check shared streaks
        for (const share of shares) {
          if (share.mode === 'buddy' && share.buddyHabitId) {
            const myHabit = userHabits.find(h => h.id === share.habitId);
            const buddyHabit = await db
              .select()
              .from(tables.habits)
              .where(eq(tables.habits.id, share.buddyHabitId))
              .get();
            
            if (myHabit && buddyHabit) {
              const sharedStreak = calculateSharedStreak(myHabit.completeDays, buddyHabit.completeDays);
              if (sharedStreak >= badge.criteria.value) {
                earned = true;
                context = { streak: sharedStreak };
                break;
              }
            }
          }
        }
        break;

      case 'perfect_week':
      case 'perfect_month':
        // These require more complex logic - check if all habits completed for 7/30 consecutive days
        const daysRequired = badge.criteria.type === 'perfect_week' ? 7 : 30;
        if (userHabits.length > 0) {
          const perfectDays = checkPerfectDays(userHabits, daysRequired);
          if (perfectDays) {
            earned = true;
            context = { count: daysRequired };
          }
        }
        break;
    }

    if (earned) {
      // Award the badge
      await db.insert(tables.userBadges).values({
        userId: ctx.userId,
        badgeId: badge.id,
        earnedAt: new Date(),
        context,
      });
      newlyEarnedBadges.push(badge);
    }
  }

  return newlyEarnedBadges;
}

// Helper: Calculate streak from completed days
function calculateStreak(completedDays: string[]): number {
  if (!completedDays || completedDays.length === 0) return 0;

  const uniqueDays = Array.from(new Set(completedDays)).sort().reverse();
  const today = new Date();

  if (uniqueDays.length === 0) return 0;

  const lastCompleted = new Date(uniqueDays[0]);
  const diff = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

  if (diff > 1) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);
    const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) streak++;
    else break;
  }

  return streak;
}

// Helper: Calculate shared streak between two users
function calculateSharedStreak(myDays: string[], buddyDays: string[]): number {
  if (!myDays || !buddyDays) return 0;
  const sharedDays = myDays.filter(day => buddyDays.includes(day));
  return calculateStreak(sharedDays);
}

// Helper: Check if user has perfect days (all habits completed) for N consecutive days
function checkPerfectDays(habits: { completeDays: string[] }[], daysRequired: number): boolean {
  if (habits.length === 0) return false;

  // Get all unique dates across all habits
  const allDates = new Set<string>();
  habits.forEach(h => h.completeDays.forEach(d => allDates.add(d)));

  // Sort dates descending
  const sortedDates = Array.from(allDates).sort().reverse();

  // For each date, check if ALL habits were completed
  const perfectDates: string[] = [];
  for (const date of sortedDates) {
    const allCompleted = habits.every(h => h.completeDays.includes(date));
    if (allCompleted) {
      perfectDates.push(date);
    }
  }

  if (perfectDates.length < daysRequired) return false;

  // Check for consecutive perfect days
  perfectDates.sort().reverse();
  let consecutive = 1;

  for (let i = 0; i < perfectDates.length - 1; i++) {
    const current = new Date(perfectDates[i]);
    const next = new Date(perfectDates[i + 1]);
    const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      consecutive++;
      if (consecutive >= daysRequired) return true;
    } else {
      consecutive = 1;
    }
  }

  return consecutive >= daysRequired;
}

