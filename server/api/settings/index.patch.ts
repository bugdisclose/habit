export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const db = useDB();
  const userId = String(user.id);

  const existing = await db
    .select()
    .from(tables.userSettings)
    .where(eq(tables.userSettings.userId, userId))
    .get();

  const updates: any = { updatedAt: new Date() };

  if (body.pushEnabled !== undefined) updates.pushEnabled = body.pushEnabled;
  if (body.reminderTime !== undefined) updates.reminderTime = body.reminderTime;
  if (body.eveningNudge !== undefined) updates.eveningNudge = body.eveningNudge;
  if (body.eveningNudgeTime !== undefined) updates.eveningNudgeTime = body.eveningNudgeTime;
  if (body.buddyAlerts !== undefined) updates.buddyAlerts = body.buddyAlerts;

  if (existing) {
    await db
      .update(tables.userSettings)
      .set(updates)
      .where(eq(tables.userSettings.userId, userId));
  } else {
    await db.insert(tables.userSettings).values({
      userId,
      pushEnabled: body.pushEnabled ?? false,
      reminderTime: body.reminderTime ?? '09:00',
      eveningNudge: body.eveningNudge ?? true,
      eveningNudgeTime: body.eveningNudgeTime ?? '20:00',
      buddyAlerts: body.buddyAlerts ?? true,
      updatedAt: new Date(),
    });
  }

  return { success: true };
});

