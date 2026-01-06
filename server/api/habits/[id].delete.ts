import { eq, and, or } from 'drizzle-orm';
import { useValidatedParams, zh } from 'h3-zod';

export default eventHandler(async event => {
  const { id } = await useValidatedParams(event, {
    id: zh.intAsString,
  });

  const { user } = await requireUserSession(event);
  const db = useDB();
  const userId = String(user.id);

  // First verify the habit exists and belongs to the user
  const habit = await db
    .select()
    .from(tables.habits)
    .where(and(eq(tables.habits.id, id), eq(tables.habits.userId, userId)))
    .get();

  if (!habit) {
    throw createError({ statusCode: 404, message: 'Habit not found or access denied' });
  }

  // Delete related records in the correct order to maintain referential integrity

  // 1. Delete habit shares where this habit is shared OR where this is a buddy habit
  await db
    .delete(tables.habitShares)
    .where(or(
      eq(tables.habitShares.habitId, id),
      eq(tables.habitShares.buddyHabitId, id)
    ));

  // 2. Delete habit reactions
  await db
    .delete(tables.habitReactions)
    .where(eq(tables.habitReactions.habitId, id));

  // 3. Delete habit journals
  await db
    .delete(tables.habitJournals)
    .where(eq(tables.habitJournals.habitId, id));

  // 4. Delete notifications related to this habit
  // Note: notifications store habitId in JSON data, so we need to handle this carefully
  const notifications = await db
    .select()
    .from(tables.notifications)
    .all();

  for (const notification of notifications) {
    if (notification.data?.habitId === id) {
      await db
        .delete(tables.notifications)
        .where(eq(tables.notifications.id, notification.id));
    }
  }

  // 5. Clean up badge context that references this habit (optional - badges stay earned)
  // We don't delete badges, but we could clear the habitId from context if needed

  // 6. Finally delete the habit itself
  const deletedHabit = await db
    .delete(tables.habits)
    .where(eq(tables.habits.id, id))
    .returning()
    .get();

  return deletedHabit;
});
