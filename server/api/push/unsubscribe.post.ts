export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const db = useDB();
  const userId = String(user.id);

  const { endpoint } = body;

  if (endpoint) {
    // Delete specific subscription
    await db
      .delete(tables.pushSubscriptions)
      .where(eq(tables.pushSubscriptions.endpoint, endpoint));
  } else {
    // Delete all subscriptions for user
    await db
      .delete(tables.pushSubscriptions)
      .where(eq(tables.pushSubscriptions.userId, userId));
  }

  // Disable push in settings
  await db
    .update(tables.userSettings)
    .set({ pushEnabled: false, updatedAt: new Date() })
    .where(eq(tables.userSettings.userId, userId));

  return { success: true };
});

