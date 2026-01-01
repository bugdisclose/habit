import { eq, inArray } from 'drizzle-orm';

export default eventHandler(async event => {
  const { user } = await requireUserSession(event);

  const habits = await useDB().select().from(tables.habits).where(eq(tables.habits.userId, String((user as any).id))).all();

  // Fetch journals
  // Fetch journals
  const journals = habits.length > 0
    ? await useDB()
      .select()
      .from(tables.habitJournals)
      .where(inArray(tables.habitJournals.habitId, habits.map(h => h.id)))
      .all()
    : [];

  // Attach journals
  const result = habits.map(habit => ({
    ...habit,
    journals: journals.filter(j => j.habitId === habit.id)
  }));

  return result;
});
