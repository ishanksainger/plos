import { useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Card3D
 * ─────────────────────────────────────────────────────────────
 * A CSS-3D card that tilts toward the cursor on hover and shines
 * a directional gloss across its surface. Cheap (no WebGL) and
 * meant to wrap any existing panel content.
 */

interface Card3DProps {
  children: ReactNode;
  style?: CSSProperties;
  /** Maximum tilt in degrees on each axis. */
  tilt?: number;
  /** Accent color for the gloss highlight. */
  glow?: string;
  /** Click handler — leaves the tilt animation intact. */
  onClick?: () => void;
}

const Card3D = ({ children, style, tilt = 8, glow = '#7aab7e', onClick }: Card3DProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const springConf = { stiffness: 240, damping: 22, mass: 0.6 };
  const sx = useSpring(mx, springConf);
  const sy = useSpring(my, springConf);

  const rotateX = useTransform(sy, [0, 1], [tilt, -tilt]);
  const rotateY = useTransform(sx, [0, 1], [-tilt, tilt]);
  const glossX = useTransform(sx, [0, 1], ['10%', '90%']);
  const glossY = useTransform(sy, [0, 1], ['0%', '80%']);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {children}
        {/* Gloss layer — picks up cursor position */}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: useTransform(
              [glossX, glossY] as any,
              ([x, y]: any) =>
                `radial-gradient(circle at ${x} ${y}, ${glow}26 0%, transparent 55%)`,
            ) as any,
            mixBlendMode: 'screen',
            transform: 'translateZ(1px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default Card3D;
