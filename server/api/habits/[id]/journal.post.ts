import { z } from 'zod';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);

    // Validate body
    const { date, note } = await readValidatedBody(event, z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
        note: z.string().min(1, 'Note cannot be empty').max(500, 'Note is too long'),
    }).parse);

    // Verify ownership
    const habit = await useDB()
        .select()
        .from(tables.habits)
        .where(and(
            eq(tables.habits.id, Number(id)),
            eq(tables.habits.userId, String((user as any).id))
        ))
        .get();

    if (!habit) {
        throw createError({ statusCode: 404, message: 'Habit not found' });
    }

    // Insert or Update existing note for that date
    // Check if exists first
    const existing = await useDB()
        .select()
        .from(tables.habitJournals)
        .where(and(
            eq(tables.habitJournals.habitId, Number(id)),
            eq(tables.habitJournals.date, date)
        ))
        .get();

    if (existing) {
        await useDB()
            .update(tables.habitJournals)
            .set({ note })
            .where(eq(tables.habitJournals.id, existing.id));
    } else {
        await useDB().insert(tables.habitJournals).values({
            habitId: Number(id),
            date,
            note,
            createdAt: new Date(),
        });
    }

    return { success: true };
});
