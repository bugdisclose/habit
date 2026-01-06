export default eventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const userId = String(user.id);

  const result = await sendPushNotification(userId, {
    title: '🎯 Habit Tracker',
    body: 'Push notifications are working! You\'ll get daily reminders here.',
    tag: 'test',
    data: { type: 'test' },
  });

  return result;
});

