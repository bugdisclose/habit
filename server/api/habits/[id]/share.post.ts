import { z } from 'zod';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);

    const { targetUsername, mode, permissions } = await readValidatedBody(event, z.object({
        targetUsername: z.string(),
        mode: z.enum(['buddy', 'observer']),
        permissions: z.object({
            streak: z.boolean(),
            status: z.boolean(),
            journal: z.boolean()
        })
    }).parse);

    // 1. Find the habit and verify ownership
    const habit = await useDB()
        .select()
        .from(tables.habits)
        .where(and(eq(tables.habits.id, Number(id)), eq(tables.habits.userId, String(user.id))))
        .get();

    console.log('Target Username:', targetUsername);
    console.log('Habit ID:', id);
    console.log('User ID:', (user as any).id);

    if (!habit) {
        console.log('Habit not found or not owned by user');
        throw createError({ statusCode: 404, message: 'Habit not found or access denied' });
    }

    // 2. Find the target user
    const targetUser = await useDB()
        .select()
        .from(tables.users)
        .where(eq(tables.users.login, targetUsername.toLowerCase()))
        .get();

    console.log('Target User result:', targetUser);

    if (!targetUser) {
        throw createError({ statusCode: 404, message: `User '${targetUsername}' not found` });
    }

    if (targetUser.id === String(user.id)) {
        throw createError({ statusCode: 400, message: 'Cannot share with yourself' });
    }

    // 3. Check if already shared
    const existingShare = await useDB()
        .select()
        .from(tables.habitShares)
        .where(and(
            eq(tables.habitShares.habitId, habit.id),
            eq(tables.habitShares.sharedWithId, targetUser.id)
        ))
        .get();

    if (existingShare) {
        throw createError({ statusCode: 400, message: 'Habit already shared with this user' });
    }

    // 4. Create Share Record
    await useDB().insert(tables.habitShares).values({
        habitId: habit.id,
        userId: String(user.id),
        sharedWithId: targetUser.id,
        mode,
        permissions,
        status: 'pending',
        createdAt: new Date(),
    });

    // 5. Create Notification
    await useDB().insert(tables.notifications).values({
        userId: targetUser.id,
        type: 'share_invite',
        data: {
            habitId: habit.id,
            habitTitle: habit.title,
            senderName: (user as any).name || (user as any).login || 'Someone',
            mode
        },
        createdAt: new Date()
    });

    return { success: true };
});
