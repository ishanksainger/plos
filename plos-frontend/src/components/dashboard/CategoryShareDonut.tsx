/**
 * Category share donut — lavender track · fill arc, flat minimalist (Category pulse tile).
 */
export function CategoryShareDonut({
  totalItems,
  sharePercent,
}: {
  /** Responsibilities counted in breakdown. */
  totalItems: number;
  /** Dominant-module share (0–100). */
  sharePercent: number;
}) {
  const cx = 70;
  const cy = 70;
  const R = 44;
  const STROKE = 13;
  const C = 2 * Math.PI * R;
  const p = Math.min(100, Math.max(0, sharePercent));
  const dash = `${(p / 100) * C} ${C}`;
  const innerHole = R - STROKE / 2;

  return (
    <div style={{ width: '100%', maxWidth: 208, margin: '0 auto', position: 'relative' }}>
      <svg viewBox="0 0 140 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <circle cx={cx} cy={cy} r={innerHole - 2} fill="var(--surface)" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--pl-donut-track)" strokeWidth={STROKE} />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="var(--pl-donut-fill)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={dash}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          paddingTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {totalItems <= 0 ? '—' : `${Math.round(p)}%`}
        </span>
        <span
          style={{
            marginTop: 8,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Top module
        </span>
        {totalItems > 0 && (
          <span style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {totalItems} items
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Dominant category’s share of all responsibilities (by count).
 */
export function topCategorySharePercent(
  breakdown: { category: string; count: number }[],
  total: number,
): { percent: number; category: string | null } {
  if (!breakdown.length || total <= 0) return { percent: 0, category: null };
  const max = breakdown.reduce((a, b) => (b.count > a.count ? b : a));
  return { percent: Math.round((100 * max.count) / total), category: max.category };
}
