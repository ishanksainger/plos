import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { ShopPage } from '@/components/nis/pages/ShopPage';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'A small store of tees, notebooks, and goods. Printed in Pune.',
};

export default function Page() {
  return (
    <NisShell pillar="shop">
      <ShopPage />
    </NisShell>
  );
}
