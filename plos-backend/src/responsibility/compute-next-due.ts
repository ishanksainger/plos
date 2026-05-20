/**
 * Returns the next due instant after the current `dueDate` for a recurring rule.
 * Uses calendar arithmetic in the server's local timezone (same as `computeState` day comparison).
 */
export function computeNextDueDate(dueDate: Date, recurrence: string): Date {
  const d = new Date(dueDate.getTime());
  switch (recurrence) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      break;
  }
  return d;
}
