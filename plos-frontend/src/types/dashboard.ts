export type ResponsibilityState = 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED';

export interface Person {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  relation: string;
  dateOfBirth?: string | null;
}

export interface Responsibility {
  id: number;
  title: string;
  category: string;
  module?: string | null;
  dueDate: string;
  completedAt: string | null;
  amount?: number | null;
  recurrence: string;
  notes?: string | null;
  personId?: number | null;
  person?: Person | null;
  state?: ResponsibilityState;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
}

export interface PersonLoad {
  name: string;
  relation: string;
  count: number;
}

export interface FinancialPressure {
  month: string;  // "2026-05"
  total: number;
}

/** One calendar day in the activity sparkline (YYYY-MM-DD, local to server). */
export interface ActivitySeriesPoint {
  date: string;
  count: number;
}

export interface DashboardData {
  summary: {
    total: number;
    completed: number;
    due: number;
    overdue: number;
    upcoming: number;
    completionRate: number;
  };
  overdue: Responsibility[];
  dueToday: Responsibility[];
  upcoming: Responsibility[];
  recentlyCompleted: Responsibility[];
  categoryBreakdown: CategoryBreakdown[];
  personLoad: PersonLoad[];
  financialPressure: FinancialPressure[];
  persons: Person[];
  /** Last 14 days, oldest → newest: completion events + recurring check-ins. */
  activitySeries: ActivitySeriesPoint[];
}
