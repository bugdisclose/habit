import { randomBytes } from 'crypto';

export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const db = useDB();
  const userId = String(user.id);

  // Check if user already has settings
  const existing = await db
    .select()
    .from(tables.userSettings)
    .where(eq(tables.userSettings.userId, userId))
    .get();

  // Generate a unique calendar token
  const calendarToken = randomBytes(32).toString('hex');

  if (existing) {
    // Update existing settings with new token
    await db
      .update(tables.userSettings)
      .set({ 
        calendarToken,
        updatedAt: new Date() 
      })
      .where(eq(tables.userSettings.userId, userId));
  } else {
    // Create new settings
    await db.insert(tables.userSettings).values({
      userId,
      calendarToken,
      pushEnabled: false,
      reminderTime: '09:00',
      eveningNudge: true,
      eveningNudgeTime: '20:00',
      buddyAlerts: true,
      updatedAt: new Date(),
    });
  }

  return { 
    calendarToken,
    calendarUrl: `/api/calendar/${calendarToken}`
  };
});

