export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const db = useDB();
  const userId = String(user.id);

  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw createError({ statusCode: 400, message: 'Invalid subscription data' });
  }

  // Check if subscription already exists
  const existing = await db
    .select()
    .from(tables.pushSubscriptions)
    .where(eq(tables.pushSubscriptions.endpoint, endpoint))
    .get();

  if (existing) {
    // Update user association if needed
    if (existing.userId !== userId) {
      await db
        .update(tables.pushSubscriptions)
        .set({ userId })
        .where(eq(tables.pushSubscriptions.endpoint, endpoint));
    }
    return { success: true, message: 'Subscription updated' };
  }

  // Save new subscription
  await db.insert(tables.pushSubscriptions).values({
    userId,
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    createdAt: new Date(),
  });

  // Enable push in settings
  const settings = await db
    .select()
    .from(tables.userSettings)
    .where(eq(tables.userSettings.userId, userId))
    .get();

  if (settings) {
    await db
      .update(tables.userSettings)
      .set({ pushEnabled: true, updatedAt: new Date() })
      .where(eq(tables.userSettings.userId, userId));
  } else {
    await db.insert(tables.userSettings).values({
      userId,
      pushEnabled: true,
      reminderTime: '09:00',
      eveningNudge: true,
      eveningNudgeTime: '20:00',
      buddyAlerts: true,
      updatedAt: new Date(),
    });
  }

  return { success: true, message: 'Subscription saved' };
});

