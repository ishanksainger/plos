export interface HabitStreakItem {
  id: number;
  title: string;
  recurrence: string;
  streak: number;
}

export interface HabitStreaksResponse {
  items: HabitStreakItem[];
  maxStreak: number;
  activeRecurring: number;
  completionsLast7Days: number;
}
