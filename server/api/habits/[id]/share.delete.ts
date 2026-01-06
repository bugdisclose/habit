import { z } from 'zod';

export default eventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const { user } = await requireUserSession(event);
    const db = useDB();
    const userId = String(user.id);
    const habitId = Number(id);

    const { sharedWithId } = await readValidatedBody(event, z.object({
        sharedWithId: z.string()
    }).parse);

    // Find the share record - user must be either the owner OR the recipient
    const shareRecord = await db
        .select()
        .from(tables.habitShares)
        .where(and(
            eq(tables.habitShares.habitId, habitId),
            eq(tables.habitShares.sharedWithId, sharedWithId)
        ))
        .get();

    if (!shareRecord) {
        throw createError({ statusCode: 404, message: 'Share not found' });
    }

    // Verify authorization: only owner or recipient can revoke
    if (shareRecord.userId !== userId && shareRecord.sharedWithId !== userId) {
        throw createError({ statusCode: 403, message: 'Not authorized to revoke this share' });
    }

    // If buddy mode with a linked habit, we should NOT delete the buddy's habit
    // (they created it, they own it - just unlink the share)

    // Delete the share record
    await db
        .delete(tables.habitShares)
        .where(eq(tables.habitShares.id, shareRecord.id));

    // Delete any pending notifications related to this share
    const notifications = await db
        .select()
        .from(tables.notifications)
        .where(eq(tables.notifications.userId, sharedWithId))
        .all();

    for (const notification of notifications) {
        if (notification.data?.habitId === habitId && notification.type === 'share_invite') {
            await db
                .delete(tables.notifications)
                .where(eq(tables.notifications.id, notification.id));
        }
    }

    return { success: true, message: 'Share revoked successfully' };
});

