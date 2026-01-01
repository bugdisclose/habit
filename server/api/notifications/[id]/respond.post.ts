import { z } from 'zod';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);
    const { accept } = await readValidatedBody(event, z.object({
        accept: z.boolean()
    }).parse);

    // 1. Get notification
    const notification = await useDB()
        .select()
        .from(tables.notifications)
        .where(and(eq(tables.notifications.id, Number(id)), eq(tables.notifications.userId, String(user.id))))
        .get();

    if (!notification) {
        throw createError({ statusCode: 404, message: 'Notification not found' });
    }

    // 2. Handle Share Invite Logic
    if (notification.type === 'share_invite') {
        const { habitId, mode } = notification.data;

        // Find the share record
        const shareRecord = await useDB()
            .select()
            .from(tables.habitShares)
            .where(and(
                eq(tables.habitShares.habitId, habitId),
                eq(tables.habitShares.sharedWithId, String(user.id)),
                eq(tables.habitShares.status, 'pending')
            ))
            .get();

        if (!shareRecord) {
            // Maybe already handled?
            await useDB().update(tables.notifications).set({ read: true }).where(eq(tables.notifications.id, Number(id)));
            return { message: 'Invite no longer valid' };
        }

        if (accept) {
            let buddyHabitId = null;

            // If Buddy Mode, clone the habit
            if (mode === 'buddy') {
                const originalHabit = await useDB()
                    .select()
                    .from(tables.habits)
                    .where(eq(tables.habits.id, habitId))
                    .get();

                if (originalHabit) {
                    const newHabit = await useDB()
                        .insert(tables.habits)
                        .values({
                            userId: String(user.id),
                            title: originalHabit.title,
                            description: originalHabit.description,
                            habitView: false, // Private by default
                            createdAt: new Date(),
                        })
                        .returning()
                        .get();
                    buddyHabitId = newHabit.id;
                }
            }

            // Update Share Record
            await useDB()
                .update(tables.habitShares)
                .set({ status: 'accepted', buddyHabitId })
                .where(eq(tables.habitShares.id, shareRecord.id));

        } else {
            // Rejected
            await useDB()
                .update(tables.habitShares)
                .set({ status: 'rejected' })
                .where(eq(tables.habitShares.id, shareRecord.id));
        }
    }

    // 3. Mark notification as read
    await useDB()
        .update(tables.notifications)
        .set({ read: true })
        .where(eq(tables.notifications.id, Number(id)));

    return { success: true };
});
