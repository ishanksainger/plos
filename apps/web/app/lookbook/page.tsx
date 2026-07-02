import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LookbookPage } from '@/components/nis/pages/LookbookPage';

export const metadata: Metadata = {
  title: 'Lookbook',
  description:
    "A gallery of NIS's own designs — the posts, carousels and canvases we make, and the design quality behind every tracker and template.",
};

export default function Page() {
  return (
    <NisShell pillar="canvas">
      <LookbookPage />
    </NisShell>
  );
}
