import { useState } from 'react';
import { PlosCategoryModule } from '../components/plos/PlosCategoryModule';
import { FinanceScene } from '../components/plos/ModuleScenes';
import { fmtINR } from '../components/plos/ResponsibilityRow';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';

export default function FinancePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />
      <PlosCategoryModule
        category="finance"
        eyebrow="Module · Finance"
        title="Money, <em>held</em>."
        accent="#fbbf24"
        scene={FinanceScene}
        ctaLabel="Add finance"
        onAddClick={() => setCreateOpen(true)}
        kpis={(rows) => {
          const open = rows.filter((r) => !r.completedAt);
          const openTotal = open.reduce((s, r) => s + (r.amount ? Number(r.amount) : 0), 0);
          const overdue = rows.filter((r) => r.state === 'OVERDUE').length;
          const recurring = rows.filter((r) => r.recurrence && r.recurrence !== 'none').length;
          const dueSoon = open.filter((r) => {
            const due = new Date(r.dueDate);
            const days = (due.getTime() - Date.now()) / 86_400_000;
            return days >= 0 && days <= 7;
          }).length;
          return [
            { label: 'Open · ₹', value: <span className="num">{fmtINR(openTotal)}</span>, delta: `${open.length} item${open.length === 1 ? '' : 's'}` },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? '#ef4444' : undefined, delta: overdue > 0 ? 'Late fees risk' : 'All clear' },
            { label: 'Recurring', value: recurring, delta: 'Auto-rolling' },
            { label: 'Due in 7d', value: dueSoon, delta: 'Watch the week' },
          ];
        }}
      />
    </>
  );
}
