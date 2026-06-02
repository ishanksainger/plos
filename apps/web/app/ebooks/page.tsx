import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { EbooksPage } from '@/components/nis/pages/EbooksPage';

export const metadata: Metadata = {
  title: 'E-books',
  description:
    'Short, practical e-books for Indian freelancers and dual-income households. Delivered as a PDF to your inbox.',
};

export default function Page() {
  return (
    <NisShell pillar="trackers">
      <EbooksPage />
    </NisShell>
  );
}
