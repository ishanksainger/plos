import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LookbookPage } from '@/components/nis/pages/LookbookPage';

export const metadata: Metadata = {
  title: 'Lookbook',
  description:
    "NIS's flat design work — Instagram carousels, posts and ad creative, and the design quality behind every tracker and template.",
};

export default function Page() {
  return (
    <NisShell pillar="canvas">
      <LookbookPage />
    </NisShell>
  );
}
