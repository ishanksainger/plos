import { ResponsibilityState } from './responsibility.state';

export function computeState(
  dueDate: Date,
  completedAt: Date | null,
  refrenceDate: Date = new Date(),
): ResponsibilityState {
  if (completedAt) {
    return ResponsibilityState.COMPLETED;
  }

  const ref = new Date(refrenceDate.toDateString());
  const due = new Date(dueDate.toDateString());

  if (ref > due) {
    return ResponsibilityState.OVERDUE;
  }
  if (ref.getTime() === due.getTime()) {
    return ResponsibilityState.DUE;
  }

  return ResponsibilityState.UPCOMING;
}
