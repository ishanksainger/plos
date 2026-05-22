import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { PlosPillarPage } from '@/components/nis/pages/PlosPillarPage';

export const metadata: Metadata = {
  title: 'PLOS — Personal Life Operating System',
  description: 'A diary of life, in software. Money, health, habits, family, admin.',
};

export default function Page() {
  return (
    <NisShell pillar="plos">
      <PlosPillarPage />
    </NisShell>
  );
}
