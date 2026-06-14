'use client';

import { TrackerCard } from '@/components/nis/TrackerCard';
import { NIS_TRACKERS } from '@/lib/nis-data';
import { getPurchasableTracker } from '@/lib/tracker-catalog';

// Only show trackers with a real file behind them (active in the commerce
// catalog). Empty "coming soon" placeholders are hidden until they ship.
const LIVE_TRACKERS = NIS_TRACKERS.filter((t) => getPurchasableTracker(t.slug));

export function TrackersPage() {
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">01 · Trackers</div>
          <h1 className="nis-h2">Spreadsheets, well-made.</h1>
        </div>
        <p className="nis-section-body">
          Each one is something we used ourselves, then handed to a friend, then put a price on when the third person asked for a copy. We do not produce &ldquo;AI-generated workbooks.&rdquo; We don&apos;t sell to anyone outside India.
        </p>
      </div>

      <div className="nis-tracker-grid">
        {LIVE_TRACKERS.map((t) => (
          <TrackerCard key={t.slug} t={t} />
        ))}
      </div>
    </section>
  );
}
