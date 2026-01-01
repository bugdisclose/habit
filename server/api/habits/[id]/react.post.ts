import { z } from 'zod';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);
    const { reaction } = await readValidatedBody(event, z.object({
        reaction: z.string().emoji('Must be an emoji')
    }).parse);

    // 1. Verify access (must have a share record)
    const share = await useDB()
        .select()
        .from(tables.habitShares)
        .where(and(
            eq(tables.habitShares.habitId, Number(id)),
            eq(tables.habitShares.sharedWithId, String(user.id)),
            eq(tables.habitShares.status, 'accepted')
        ))
        .get();

    if (!share) {
        throw createError({ statusCode: 403, message: 'You do not have permission to react to this habit' });
    }

    // 2. Add reaction
    await useDB().insert(tables.habitReactions).values({
        habitId: Number(id),
        userId: String(user.id),
        reaction,
        createdAt: new Date(),
    });

    // 3. Notify owner
    // Get owner ID from habit
    const habit = await useDB()
        .select()
        .from(tables.habits)
        .where(eq(tables.habits.id, Number(id)))
        .get();

    if (habit) {
        await useDB().insert(tables.notifications).values({
            userId: habit.userId,
            type: 'reaction',
            data: {
                habitId: habit.id,
                habitTitle: habit.title,
                senderName: (user as any).name || (user as any).login || 'Observer',
                reaction
            },
            createdAt: new Date()
        });
    }

    return { success: true };
});
