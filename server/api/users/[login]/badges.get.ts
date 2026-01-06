import { eq } from 'drizzle-orm';
import { useValidatedParams, z } from 'h3-zod';
import { BADGES } from '../../../../shared/badges';

// Get badges for a specific user (public profile)
export default eventHandler(async (event) => {
  const { login } = await useValidatedParams(event, {
    login: z.string().toLowerCase(),
  });

  const db = useDB();

  // Get user
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.login, login))
    .limit(1)
    .get();

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  // Check if profile is public OR if the requester is the profile owner
  const session = await getUserSession(event);
  const sessionUserId = session?.user?.id ? String(session.user.id) : null;
  const isOwner = sessionUserId === user.id;

  if (!user.userView && !isOwner) {
    return { badges: [], stats: { total: 0, earned: 0, percentage: 0 } };
  }

  // Get user's earned badges
  const earnedBadges = await db
    .select()
    .from(tables.userBadges)
    .where(eq(tables.userBadges.userId, user.id))
    .all();

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId));

  // Only return earned badges for public view (hide locked ones)
  const publicBadges = BADGES
    .filter(badge => earnedBadgeIds.has(badge.id))
    .map(badge => ({
      ...badge,
      earned: true,
      earnedAt: earnedBadges.find(b => b.badgeId === badge.id)?.earnedAt || null,
    }));

  return {
    badges: publicBadges,
    stats: {
      total: BADGES.length,
      earned: earnedBadges.length,
      percentage: Math.round((earnedBadges.length / BADGES.length) * 100),
    },
  };
});

