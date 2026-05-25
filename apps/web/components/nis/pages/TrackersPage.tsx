'use client';

import Link from 'next/link';
import { TrackerCard } from '@/components/nis/TrackerCard';
import { NIS_TRACKERS } from '@/lib/nis-data';
import { formatINR, getBundlePricing } from '@/lib/tracker-catalog';

export function TrackersPage() {
  const { bundlePricePaise, savingsPaise, discountPercent } = getBundlePricing();
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">01 · Trackers</div>
          <h1 className="nis-h2">Spreadsheets, well-made.</h1>
        </div>
        <p className="nis-section-body">
          Four templates. Each one is something we used ourselves, then handed to a friend, then put a price on when the third person asked for a copy. We do not produce &ldquo;AI-generated workbooks.&rdquo; We don&apos;t sell to anyone outside India.
        </p>
      </div>

      <Link href="/trackers/bundle" className="nis-bundle-banner">
        <div>
          <div className="nis-section-eyebrow" style={{ marginBottom: 6 }}>
            Bundle · {discountPercent}% off
          </div>
          <div className="nis-bundle-banner-title">
            All four trackers — <span>{formatINR(bundlePricePaise)}</span>
          </div>
          <div className="nis-bundle-banner-sub">
            Save {formatINR(savingsPaise)} · price locked · Freelancer GST ships immediately, the rest as they go live.
          </div>
        </div>
        <span className="nis-bundle-banner-cta">See bundle →</span>
      </Link>

      <div className="nis-tracker-grid">
        {NIS_TRACKERS.map((t) => (
          <TrackerCard key={t.slug} t={t} />
        ))}
      </div>
    </section>
  );
}
