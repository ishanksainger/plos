import type { CSSProperties, ReactNode } from 'react';

/**
 * Shared loading + error UX primitives. The animation lives in
 * `styles/plos-prototype/plos.css` under `.plos-skeleton` (a single
 * shimmer keyframe so every consumer pulses in unison).
 */

interface BlockProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function SkeletonBlock({
  width = '100%',
  height = 16,
  radius = 6,
  className,
  style,
}: BlockProps) {
  return (
    <div
      className={`plos-skeleton ${className ?? ''}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 2, lineHeight = 12, gap = 8, lastLineWidth = '60%' }: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: string | number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/** A generic "card" placeholder — used for KPI grids and module pages. */
export function SkeletonCard({
  height = 110,
  padding = 18,
  children,
}: {
  height?: number | string;
  padding?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className="glass"
      style={{
        padding,
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      aria-hidden="true"
    >
      {children ?? (
        <>
          <SkeletonBlock width="40%" height={10} />
          <SkeletonBlock width="70%" height={24} />
          <SkeletonBlock width="50%" height={10} />
        </>
      )}
    </div>
  );
}

/** A grid of `count` skeleton cards. */
export function SkeletonGrid({
  count = 4,
  columns = 'repeat(auto-fit, minmax(180px, 1fr))',
  gap = 16,
  cardHeight = 110,
}: {
  count?: number;
  columns?: string;
  gap?: number;
  cardHeight?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns, gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </div>
  );
}

/** A vertical stack of list rows (avatar + 2 text lines). */
export function SkeletonRowList({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--plos-rule)',
          }}
        >
          <SkeletonBlock width={22} height={22} radius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBlock width="60%" height={12} />
            <SkeletonBlock width="35%" height={10} />
          </div>
          <SkeletonBlock width={60} height={14} />
        </div>
      ))}
    </div>
  );
}
