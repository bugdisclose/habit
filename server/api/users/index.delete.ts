import { eq, or } from 'drizzle-orm';

export default eventHandler(async event => {
  const { user } = await requireUserSession(event);
  const db = useDB();
  const userId = String(user.id);

  // Get all habits owned by this user
  const userHabits = await db
    .select({ id: tables.habits.id })
    .from(tables.habits)
    .where(eq(tables.habits.userId, userId))
    .all();

  const habitIds = userHabits.map(h => h.id);

  // 1. Delete all habit shares where user is owner or recipient
  await db
    .delete(tables.habitShares)
    .where(or(
      eq(tables.habitShares.userId, userId),
      eq(tables.habitShares.sharedWithId, userId)
    ));

  // 2. Delete all reactions by this user
  await db
    .delete(tables.habitReactions)
    .where(eq(tables.habitReactions.userId, userId));

  // 3. Delete all reactions on user's habits
  for (const habitId of habitIds) {
    await db
      .delete(tables.habitReactions)
      .where(eq(tables.habitReactions.habitId, habitId));
  }

  // 4. Delete all journals for user's habits
  for (const habitId of habitIds) {
    await db
      .delete(tables.habitJournals)
      .where(eq(tables.habitJournals.habitId, habitId));
  }

  // 5. Delete all notifications for this user
  await db
    .delete(tables.notifications)
    .where(eq(tables.notifications.userId, userId));

  // 6. Delete all habits owned by this user
  await db
    .delete(tables.habits)
    .where(eq(tables.habits.userId, userId));

  // 7. Finally delete the user
  await db
    .delete(tables.users)
    .where(eq(tables.users.id, userId));

  return { message: 'Account and all related data have been successfully deleted.' };
});
