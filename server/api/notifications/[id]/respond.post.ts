import { z } from 'zod';
import { checkAndAwardBadges } from '../../../utils/badges';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);
    const db = useDB();
    const userId = String(user.id);

    const { accept } = await readValidatedBody(event, z.object({
        accept: z.boolean()
    }).parse);

    // 1. Get notification and verify ownership
    const notification = await db
        .select()
        .from(tables.notifications)
        .where(and(
            eq(tables.notifications.id, Number(id)),
            eq(tables.notifications.userId, userId)
        ))
        .get();

    if (!notification) {
        throw createError({ statusCode: 404, message: 'Notification not found' });
    }

    // 2. Handle Share Invite Logic
    if (notification.type === 'share_invite') {
        const { habitId, mode } = notification.data;

        // Verify the original habit still exists
        const originalHabit = await db
            .select()
            .from(tables.habits)
            .where(eq(tables.habits.id, habitId))
            .get();

        if (!originalHabit) {
            // Habit was deleted, clean up the share record and notification
            await db
                .delete(tables.habitShares)
                .where(and(
                    eq(tables.habitShares.habitId, habitId),
                    eq(tables.habitShares.sharedWithId, userId)
                ));
            await db
                .delete(tables.notifications)
                .where(eq(tables.notifications.id, Number(id)));

            return { message: 'The shared habit no longer exists' };
        }

        // Find the share record - must match habitId, sharedWithId, AND userId (owner)
        const shareRecord = await db
            .select()
            .from(tables.habitShares)
            .where(and(
                eq(tables.habitShares.habitId, habitId),
                eq(tables.habitShares.sharedWithId, userId),
                eq(tables.habitShares.userId, originalHabit.userId), // Verify the share is from the actual owner
                eq(tables.habitShares.status, 'pending')
            ))
            .get();

        if (!shareRecord) {
            // Share record doesn't exist or already handled
            await db
                .update(tables.notifications)
                .set({ read: true })
                .where(eq(tables.notifications.id, Number(id)));
            return { message: 'Invite no longer valid' };
        }

        if (accept) {
            let buddyHabitId = null;

            // If Buddy Mode, clone the habit
            if (mode === 'buddy') {
                const newHabit = await db
                    .insert(tables.habits)
                    .values({
                        userId: userId,
                        title: originalHabit.title,
                        description: originalHabit.description,
                        habitView: false, // Private by default
                        createdAt: new Date(),
                    })
                    .returning()
                    .get();
                buddyHabitId = newHabit.id;
            }

            // Update Share Record
            await db
                .update(tables.habitShares)
                .set({ status: 'accepted', buddyHabitId })
                .where(eq(tables.habitShares.id, shareRecord.id));

            // Check badges for both users - the sharer gets the "first_share" badge
            await checkAndAwardBadges({ userId: shareRecord.userId }); // Sharer
            await checkAndAwardBadges({ userId }); // Acceptor

        } else {
            // Rejected - delete the share record entirely
            await db
                .delete(tables.habitShares)
                .where(eq(tables.habitShares.id, shareRecord.id));
        }
    }

    // 3. Mark notification as read
    await db
        .update(tables.notifications)
        .set({ read: true })
        .where(eq(tables.notifications.id, Number(id)));

    return { success: true };
});
