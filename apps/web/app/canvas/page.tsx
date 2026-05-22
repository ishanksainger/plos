import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { CanvasPage } from '@/components/nis/pages/CanvasPage';

export const metadata: Metadata = {
  title: 'Canvas',
  description: 'Six original 3D and motion scenes from Nikita\'s room.',
};

export default function Page() {
  return (
    <NisShell pillar="canvas">
      <CanvasPage />
    </NisShell>
  );
}
