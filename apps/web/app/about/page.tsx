import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { AboutPage } from '@/components/nis/pages/AboutPage';

export const metadata: Metadata = {
  title: 'About',
  description: 'A small studio in Pune. Two people, four small things, one nest.',
};

export default function Page() {
  return (
    <NisShell pillar="about">
      <AboutPage />
    </NisShell>
  );
}
