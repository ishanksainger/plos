import { IconCurrencyRupee, IconReceipt, IconTrendingUp, IconWallet } from '@tabler/icons-react';
import CategoryModulePage, { type CategoryStat } from '../components/CategoryModulePage';
import type { Responsibility } from '../types/dashboard';
import { MODULE_ACCENT_HEX } from '../theme/palette';

const formatINR = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}k`
      : `₹${n}`;

const stats: CategoryStat[] = [
  {
    label: 'Monthly Spend',
    Icon: IconCurrencyRupee,
    accent: MODULE_ACCENT_HEX,
    stripColor: MODULE_ACCENT_HEX,
    valueColor: 'var(--accent)',
    compute: (rows) => {
      const start = new Date();
      start.setDate(1);
      const total = rows.reduce<number>((s, r: Responsibility) => {
        const due = new Date(r.dueDate);
        return due >= start && r.amount ? s + Number(r.amount) : s;
      }, 0);
      return formatINR(total);
    },
  },
  {
    label: 'Recurring',
    Icon: IconReceipt,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--secondary)',
    compute: (rows) => rows.filter((r) => r.recurrence && r.recurrence !== 'none').length,
  },
  {
    label: 'Pending',
    Icon: IconTrendingUp,
    accent: MODULE_ACCENT_HEX,
    stripColor: 'var(--warning)',
    compute: (rows) => rows.filter((r) => !r.completedAt).length,
  },
  {
    label: 'Total Outstanding',
    Icon: IconWallet,
    accent: MODULE_ACCENT_HEX,
    stripColor: MODULE_ACCENT_HEX,
    valueColor: 'var(--accent)',
    compute: (rows) => {
      const total = rows.reduce<number>(
        (s, r) => (!r.completedAt && r.amount ? s + Number(r.amount) : s),
        0,
      );
      return formatINR(total);
    },
  },
];

const FinancePage = () => (
  <CategoryModulePage
    category="finance"
    moduleLabel="MODULE · FINANCE"
    title={'Financial\nOverview'}
    subtitle="Bills, EMIs, subscriptions, and all money obligations tracked by amount and urgency."
    accent={MODULE_ACCENT_HEX}
    stats={stats}
  />
);

export default FinancePage;
