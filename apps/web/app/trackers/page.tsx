import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { TrackersPage } from '@/components/nis/pages/TrackersPage';

export const metadata: Metadata = {
  title: 'Trackers',
  description:
    'Indian-rupee-native spreadsheets — GST, dual-income, weddings, small business. Drop-in formulas, CA-friendly.',
};

export default function Page() {
  return (
    <NisShell pillar="trackers">
      <TrackersPage />
    </NisShell>
  );
}
