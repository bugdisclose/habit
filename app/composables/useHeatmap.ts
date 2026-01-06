import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isAfter, startOfDay, isThisYear } from 'date-fns';

export interface DayInfo {
  date: string;
  isPast: boolean;
  isFuture: boolean;
  isToday: boolean;
}

export type WeekInfo = DayInfo[];

// Generate full year from January 1 to December 31
export const generateYearWeeks = (): WeekInfo[] => {
  const today = startOfDay(new Date());
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);

  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const days: DayInfo[] = allDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    return {
      date: dateStr,
      isPast: isBefore(date, today),
      isFuture: isAfter(date, today),
      isToday: dateStr === todayStr,
    };
  });

  // Pad the beginning to align with week start (Sunday = 0)
  const firstDayOfWeek = yearStart.getDay();
  const paddedDays: DayInfo[] = [];

  // Add empty padding days at the start
  for (let i = 0; i < firstDayOfWeek; i++) {
    paddedDays.push({ date: '', isPast: true, isFuture: false, isToday: false });
  }
  paddedDays.push(...days);

  const weeks: WeekInfo[] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return weeks;
};

// Generate complete current month (for compact card view)
// Shows the entire month including past, today, and future days
export const generateCurrentMonthWeeks = (): WeekInfo[] => {
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Get all days in the current month
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const days: DayInfo[] = allDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: dateStr,
      isPast: isBefore(date, today),
      isFuture: isAfter(date, today),
      isToday: dateStr === todayStr,
    };
  });

  // Pad the beginning to align with week start (Sunday = 0)
  const firstDayOfWeek = monthStart.getDay();
  const paddedDays: DayInfo[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    paddedDays.push({ date: '', isPast: false, isFuture: false, isToday: false });
  }
  paddedDays.push(...days);

  // Pad the end to complete the last week
  while (paddedDays.length % 7 !== 0) {
    paddedDays.push({ date: '', isPast: false, isFuture: false, isToday: false });
  }

  // Group into weeks
  const weeks: WeekInfo[] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return weeks;
};

// Legacy function - now uses current month
export const generateRecentWeeks = (numWeeks = 5): WeekInfo[] => {
  return generateCurrentMonthWeeks();
};

// Legacy function for backward compatibility
export const generateWeeks = (daysCount = 49): WeekInfo[] => {
  const numWeeks = Math.ceil(daysCount / 7);
  return generateRecentWeeks(numWeeks);
};

export const formatDate = (date: string): string => {
  if (!date) return '';
  return isThisYear(new Date(date)) ? format(new Date(date), 'MMMM d') : format(new Date(date), 'MMMM d, yyyy');
};

export const isDateFuture = (date: string): boolean => {
  if (!date) return false;
  return isAfter(new Date(date), startOfDay(new Date()));
};
