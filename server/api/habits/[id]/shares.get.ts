export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);
    const db = useDB();
    const userId = String(user.id);
    const habitId = Number(id);

    // Verify the user owns this habit
    const habit = await db
        .select()
        .from(tables.habits)
        .where(and(
            eq(tables.habits.id, habitId),
            eq(tables.habits.userId, userId)
        ))
        .get();

    if (!habit) {
        throw createError({ statusCode: 404, message: 'Habit not found or access denied' });
    }

    // Get all shares for this habit with recipient info
    const shares = await db
        .select({
            share: tables.habitShares,
            recipient: {
                id: tables.users.id,
                login: tables.users.login,
                name: tables.users.name,
                avatarUrl: tables.users.avatarUrl
            }
        })
        .from(tables.habitShares)
        .innerJoin(tables.users, eq(tables.habitShares.sharedWithId, tables.users.id))
        .where(eq(tables.habitShares.habitId, habitId))
        .all();

    return { shares };
});

