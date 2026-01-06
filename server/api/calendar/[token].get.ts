import { format, startOfDay, addDays } from 'date-fns';

export default eventHandler(async (event) => {
  const { token } = getRouterParams(event);
  const db = useDB();

  // Find user by calendar token
  const settings = await db
    .select()
    .from(tables.userSettings)
    .where(eq(tables.userSettings.calendarToken, token))
    .get();

  if (!settings) {
    throw createError({ statusCode: 404, message: 'Calendar not found' });
  }

  // Get user's habits
  const habits = await db
    .select()
    .from(tables.habits)
    .where(eq(tables.habits.userId, settings.userId))
    .all();

  // Get user info for calendar name
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, settings.userId))
    .get();

  const today = format(new Date(), 'yyyy-MM-dd');
  const calendarName = `${user?.name || 'My'} Habits`;

  // Generate iCal content
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Habit Tracker//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Add each habit as a recurring event
  for (const habit of habits) {
    const completedToday = habit.completeDays.includes(today);
    const uid = `habit-${habit.id}@habit.app`;
    const created = format(habit.createdAt, "yyyyMMdd'T'HHmmss'Z'");
    const status = completedToday ? '✅' : '☐';
    const summary = `${status} ${habit.title}`;

    // Create event for today
    const dtstart = format(new Date(), 'yyyyMMdd');
    
    ical.push(
      'BEGIN:VEVENT',
      `UID:${uid}-${dtstart}`,
      `DTSTAMP:${created}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtstart}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${habit.description || 'Track your daily habit'}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      // Daily recurrence
      'RRULE:FREQ=DAILY',
      'END:VEVENT'
    );
  }

  ical.push('END:VCALENDAR');

  // Set headers for iCal file
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8');
  setHeader(event, 'Content-Disposition', `attachment; filename="${calendarName}.ics"`);
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');

  return ical.join('\r\n');
});

