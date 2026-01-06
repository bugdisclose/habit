export default eventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const { user } = await requireUserSession(event);
  const db = useDB();
  const userId = String(user.id);

  // Verify notification belongs to user and mark as read
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

  await db
    .update(tables.notifications)
    .set({ read: true })
    .where(eq(tables.notifications.id, Number(id)));

  return { success: true };
});

