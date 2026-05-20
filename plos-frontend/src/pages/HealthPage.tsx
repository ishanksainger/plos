import { IconActivity, IconApple, IconHeartbeat, IconMoon } from '@tabler/icons-react';
import CategoryModulePage, { type CategoryStat } from '../components/CategoryModulePage';
import { MODULE_ACCENT_HEX } from '../theme/palette';

const stats: CategoryStat[] = [
  {
    label: 'Active Items',
    Icon: IconHeartbeat,
    accent: MODULE_ACCENT_HEX,
    stripColor: MODULE_ACCENT_HEX,
    compute: (rows) => rows.filter((r) => !r.completedAt).length,
  },
  {
    label: 'Completed',
    Icon: IconActivity,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--success)',
    compute: (rows) => rows.filter((r) => !!r.completedAt).length,
  },
  {
    label: 'Recurring',
    Icon: IconMoon,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--secondary)',
    compute: (rows) => rows.filter((r) => r.recurrence && r.recurrence !== 'none').length,
  },
  {
    label: 'Overdue',
    Icon: IconApple,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--danger)',
    compute: (rows) => rows.filter((r) => r.state === 'OVERDUE').length,
  },
];

const HealthPage = () => (
  <CategoryModulePage
    category="health"
    moduleLabel="MODULE · HEALTH"
    title={'Health &\nWellness'}
    subtitle="Medications, appointments, fitness goals, and check-ups — all your health commitments in one view."
    accent={MODULE_ACCENT_HEX}
    stats={stats}
  />
);

export default HealthPage;
