import { IconFlame, IconRepeat, IconTargetArrow, IconTrophy } from '@tabler/icons-react';
import CategoryModulePage, { type CategoryStat } from '../components/CategoryModulePage';
import { MODULE_ACCENT_HEX } from '../theme/palette';

const stats: CategoryStat[] = [
  {
    label: 'Active Habits',
    Icon: IconRepeat,
    accent: MODULE_ACCENT_HEX,
    stripColor: MODULE_ACCENT_HEX,
    compute: (rows) => rows.filter((r) => r.recurrence && r.recurrence !== 'none' && !r.completedAt).length,
  },
  {
    label: 'Completed',
    Icon: IconFlame,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--success)',
    compute: (rows) => rows.filter((r) => !!r.completedAt).length,
  },
  {
    label: 'Done Rate',
    Icon: IconTargetArrow,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--secondary)',
    compute: (rows) => {
      if (!rows.length) return '—';
      const done = rows.filter((r) => !!r.completedAt).length;
      return `${Math.round((done / rows.length) * 100)}%`;
    },
  },
  {
    label: 'Total',
    Icon: IconTrophy,
    accent: MODULE_ACCENT_HEX,
    stripColor: MODULE_ACCENT_HEX,
    compute: (rows) => rows.length,
  },
];

const HabitsPage = () => (
  <CategoryModulePage
    category="habit"
    moduleLabel="MODULE · HABITS"
    title={'Habit\nTracker'}
    subtitle="Build daily routines with recurring responsibilities. Streaks use your completion history (including recurring check-ins)."
    accent={MODULE_ACCENT_HEX}
    stats={stats}
  />
);

export default HabitsPage;
