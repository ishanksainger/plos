import type { Responsibility } from './dashboard';

export interface StreakAtRisk {
  id: number;
  title: string;
  streakLength: number;
  lastCompletedAt: string | null;
}

export interface TodayEvent {
  id: number;
  fromState: string;
  toState: string;
  occurredAt: string;
  note?: string | null;
  responsibility: {
    id: number;
    title: string;
    category: string;
    amount: number | null;
    person: { id: number; name: string; relation: string } | null;
  };
}

export interface TodayData {
  timeZone: string;
  todayKey: string;
  overdue: Responsibility[];
  dueToday: Responsibility[];
  upcoming7: Responsibility[];
  completedToday: Responsibility[];
  streaksAtRisk: StreakAtRisk[];
  recentEvents: TodayEvent[];
}
