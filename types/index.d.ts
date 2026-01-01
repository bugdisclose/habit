export interface Habit {
  id: number;
  userId: string;
  title: string;
  description?: string | null;
  completeDays: string[];
  createdAt: Date;
  habitView: boolean;
  journals?: HabitJournal[];
}

export interface HabitJournal {
  id: number;
  habitId: number;
  date: string;
  note: string;
  createdAt: Date;
}

interface Day {
  date: string;
}

type Week = Day[];
