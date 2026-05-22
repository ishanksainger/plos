import { useState } from 'react';
import { PlosCategoryModule } from '../components/plos/PlosCategoryModule';
import { HealthScene } from '../components/plos/ModuleScenes';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';

export default function HealthPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />
      <PlosCategoryModule
        category="health"
        eyebrow="Module · Health"
        title="Body, <em>tended</em>."
        accent="#fb7185"
        scene={HealthScene}
        ctaLabel="Add health"
        onAddClick={() => setCreateOpen(true)}
        kpis={(rows) => {
          const open = rows.filter((r) => !r.completedAt);
          const overdue = rows.filter((r) => r.state === 'OVERDUE').length;
          const recurring = rows.filter((r) => r.recurrence && r.recurrence !== 'none').length;
          const people = new Set(open.map((r) => r.personId).filter(Boolean)).size;
          const thisWeek = open.filter((r) => {
            const due = new Date(r.dueDate);
            const days = (due.getTime() - Date.now()) / 86_400_000;
            return days >= 0 && days <= 7;
          }).length;
          return [
            { label: 'Open', value: open.length, delta: `${people} ${people === 1 ? 'person' : 'people'}` },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? '#ef4444' : undefined, delta: overdue > 0 ? 'Needs attention' : 'All clear' },
            { label: 'This week', value: thisWeek, delta: 'Appointments + meds' },
            { label: 'Recurring', value: recurring, delta: 'Routines' },
          ];
        }}
      />
    </>
  );
}
