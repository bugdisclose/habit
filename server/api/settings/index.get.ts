export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const db = useDB();
  const userId = String(user.id);

  const settings = await db
    .select()
    .from(tables.userSettings)
    .where(eq(tables.userSettings.userId, userId))
    .get();

  if (!settings) {
    return {
      calendarToken: null,
      calendarUrl: null,
      pushEnabled: false,
      reminderTime: '09:00',
      eveningNudge: true,
      eveningNudgeTime: '20:00',
      buddyAlerts: true,
    };
  }

  return {
    calendarToken: settings.calendarToken,
    calendarUrl: settings.calendarToken ? `/api/calendar/${settings.calendarToken}` : null,
    pushEnabled: settings.pushEnabled,
    reminderTime: settings.reminderTime,
    eveningNudge: settings.eveningNudge,
    eveningNudgeTime: settings.eveningNudgeTime,
    buddyAlerts: settings.buddyAlerts,
  };
});

