import { eq } from 'drizzle-orm';
import { BADGES, getBadgeById } from '../../../shared/badges';

// Get all badges for the current user
export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const db = useDB();

  // Get user's earned badges
  const earnedBadges = await db
    .select()
    .from(tables.userBadges)
    .where(eq(tables.userBadges.userId, String(user.id)))
    .all();

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId));

  // Map all badges with earned status
  const allBadges = BADGES.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id),
    earnedAt: earnedBadges.find(b => b.badgeId === badge.id)?.earnedAt || null,
    context: earnedBadges.find(b => b.badgeId === badge.id)?.context || null,
  }));

  // Group by category
  const grouped = {
    streak: allBadges.filter(b => b.category === 'streak'),
    completion: allBadges.filter(b => b.category === 'completion'),
    consistency: allBadges.filter(b => b.category === 'consistency'),
    social: allBadges.filter(b => b.category === 'social'),
    special: allBadges.filter(b => b.category === 'special'),
  };

  // Stats
  const totalBadges = BADGES.length;
  const earnedCount = earnedBadges.length;

  return {
    badges: allBadges,
    grouped,
    stats: {
      total: totalBadges,
      earned: earnedCount,
      percentage: Math.round((earnedCount / totalBadges) * 100),
    },
  };
});

