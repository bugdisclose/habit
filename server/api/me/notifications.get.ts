export default eventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const notifications = await useDB()
        .select()
        .from(tables.notifications)
        .where(eq(tables.notifications.userId, String(user.id)))
        .orderBy(desc(tables.notifications.createdAt))
        .all();

    return notifications;
});
