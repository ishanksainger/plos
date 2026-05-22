import { useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * 3D mouse-tracking tilt for a card.
 *
 * Key trick: while the cursor is moving across the card we set
 * `transition: none` so the transform updates per-frame without the
 * CSS transition trying to interpolate every step (which is what
 * caused the wobbly "dancing" + blurry feel on glass.bucket cards —
 * backdrop-filter being re-rasterized at every interpolated frame).
 * On mouse-leave we restore a smooth ease to rest.
 */
export function PlosTilt({
  children,
  max = 2,
  className = 'plos-tilt',
  style,
}: {
  children: ReactNode;
  /** Max degrees of tilt at the edge. Default 2 — subtle and stable. */
  max?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    node.style.transition = 'none';
    // No translateY here — the inner `.glass.bucket:hover` already lifts.
    // Adding another translate compounded into double-lift + jitter.
    node.style.transform = `perspective(1400px) rotateX(${y * -max}deg) rotateY(${x * max}deg)`;
  };

  const onLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transition = 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)';
    node.style.transform = 'perspective(1400px) rotateX(0) rotateY(0)';
  };

  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}
