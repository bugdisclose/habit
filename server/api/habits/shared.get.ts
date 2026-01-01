export default eventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    // 1. Habits shared WITH me (I am the recipient)
    const sharedWithMe = await useDB()
        .select({
            share: tables.habitShares,
            habit: tables.habits,
            user: tables.users // The owner
        })
        .from(tables.habitShares)
        .innerJoin(tables.habits, eq(tables.habitShares.habitId, tables.habits.id))
        .innerJoin(tables.users, eq(tables.habits.userId, tables.users.id))
        .where(and(
            eq(tables.habitShares.sharedWithId, String(user.id)),
            eq(tables.habitShares.status, 'accepted')
        ))
        .all();

    // 2. Habits I shared with OTHERS (I am the owner)
    const sharedByMe = await useDB()
        .select({
            share: tables.habitShares,
            habit: tables.habits, // My habit (redundant but keeps shape)
            linkedHabit: { // The buddy's copy (if buddy mode)
                id: tables.habits.id, // We need to alias or join again? 
                // Actually, for sharedByMe, we care about the buddy's progress.
                // But the buddy's progress is in the 'buddyHabitId' habit.
                completeDays: tables.habits.completeDays,
                updatedAt: tables.habits.createdAt // placeholder
            },
            user: tables.users // The recipient
        })
        .from(tables.habitShares)
        .innerJoin(tables.users, eq(tables.habitShares.sharedWithId, tables.users.id))
        // We need to join habits TWICE: once for my habit, once for buddy's habit?
        // Let's keep it simple. We verify the share record.
        // If it's B uddy mode, we might want the buddy's completion data.
        .innerJoin(tables.habits, eq(tables.habitShares.habitId, tables.habits.id)) // My habit
        .where(and(
            eq(tables.habitShares.userId, String(user.id)),
            eq(tables.habitShares.status, 'accepted')
        ))
        .all();

    // To get the buddy's completion data, we need another join or separate query.
    // SQLite joins can be tricky with same table.
    // Let's clean up sharedByMe query.

    const myShares = await useDB()
        .select({
            share: tables.habitShares,
            recipient: tables.users,
            // If buddy mode, we want the buddy's habit status
            buddyHabit: {
                id: tables.habits.id,
                completeDays: tables.habits.completeDays
            }
        })
        .from(tables.habitShares)
        .innerJoin(tables.users, eq(tables.habitShares.sharedWithId, tables.users.id))
        .leftJoin(tables.habits, eq(tables.habitShares.buddyHabitId, tables.habits.id))
        .where(and(
            eq(tables.habitShares.userId, String(user.id)),
            eq(tables.habitShares.status, 'accepted')
        ))
        .all();

    return {
        sharedWithMe,
        sharedByMe: myShares
    };
});
