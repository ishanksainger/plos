import { useMemo } from 'react';

/**
 * PeopleHero
 * ─────────────────────────────────────────────────────────────
 * A pure-CSS hero for the People page that doesn't depend on
 * having a populated relationship graph. It renders a softly
 * orbiting cluster of avatars on a deep-space gradient — the
 * scene reads beautifully even when the user has only added
 * themselves (which is how every brand-new account starts).
 *
 * Why CSS instead of Three.js?
 *   The previous WebGL graph collapsed to a single dot when
 *   only one node existed, leaving the hero looking empty and
 *   broken. CSS gives us a guaranteed-good visual at every
 *   data size, with zero GL contexts.
 */

export interface PeopleHeroPerson {
  id: number;
  name: string;
  relation: string;
}

interface Props {
  people: PeopleHeroPerson[];
}

const RELATION_COLORS: Record<string, string> = {
  self:    '#4f7cfa',
  father:  '#fb8c00',
  mother:  '#f05252',
  partner: '#ec4899',
  child:   '#10b981',
  sibling: '#8b5cf6',
  other:   '#9aa3b8',
};

/** Simple deterministic hash so each name picks the same orbital slot every render. */
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const Avatar = ({
  name, color, size, x, y, delay, isCenter,
}: {
  name: string; color: string; size: number;
  x: number; y: number; delay: number; isCenter?: boolean;
}) => {
  const initial = name.trim().slice(0, 1).toUpperCase() || '·';
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px)`,
        top:  `calc(50% + ${y}px)`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop:  -size / 2,
        borderRadius: '50%',
        background: `linear-gradient(140deg, ${color} 0%, ${color}99 100%)`,
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isCenter
          ? `0 0 0 4px rgba(255,255,255,0.06), 0 0 60px ${color}aa, 0 14px 40px rgba(0,0,0,0.55)`
          : `0 0 0 2px rgba(255,255,255,0.04), 0 0 22px ${color}80, 0 6px 18px rgba(0,0,0,0.45)`,
        animation: `plos-people-bob ${5.5 + (delay * 1.3)}s ease-in-out ${delay}s infinite alternate`,
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
};

const PeopleHero = ({ people }: Props) => {
  // Always reserve a center node for the user (or a placeholder).
  const center = people.find((p) => p.relation === 'self') ?? people[0];
  const others = people.filter((p) => p !== center);

  const placed = useMemo(() => {
    // Pre-baked orbital slots — gives a balanced distribution even when
    // we have very few people, and the avatars never overlap each other.
    const slots = [
      { angle: -55, r: 130, size: 60 },
      { angle:  35, r: 140, size: 56 },
      { angle: 125, r: 150, size: 62 },
      { angle: 215, r: 135, size: 58 },
      { angle: -130, r: 155, size: 54 },
      { angle:  90, r: 200, size: 50 },
      { angle: -10, r: 200, size: 50 },
      { angle: 170, r: 200, size: 50 },
    ];

    return others.slice(0, slots.length).map((p, i) => {
      const slot = slots[(hash(p.name) + i) % slots.length];
      const rad = (slot.angle * Math.PI) / 180;
      return {
        person: p,
        x: Math.cos(rad) * slot.r,
        y: Math.sin(rad) * slot.r,
        size: slot.size,
        delay: (i % 5) * 0.4,
      };
    });
  }, [others]);

  // When the user has nobody but themselves, render a few "ghost"
  // outlines so the hero still has shape and depth.
  const ghostSlots = useMemo(
    () => [
      { angle: -55, r: 135, size: 56 },
      { angle:  60, r: 140, size: 52 },
      { angle: 175, r: 145, size: 60 },
      { angle: 250, r: 130, size: 50 },
      { angle:  10, r: 210, size: 44 },
      { angle: 200, r: 210, size: 44 },
    ],
    [],
  );

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 70% 50%, #1a1430 0%, #100925 35%, #07051a 75%)',
        overflow: 'hidden',
      }}
    >
      {/* Starfield */}
      <svg
        viewBox="0 0 600 360"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.55 }}
      >
        {Array.from({ length: 80 }).map((_, i) => {
          const cx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
          const cy = (Math.sin(i * 78.233) * 43758.5453) % 1;
          const r = 0.4 + ((Math.sin(i * 3.7) * 1) % 1 + 1) * 0.4;
          return (
            <circle
              key={i}
              cx={(Math.abs(cx) * 600).toFixed(1)}
              cy={(Math.abs(cy) * 360).toFixed(1)}
              r={r.toFixed(2)}
              fill="#dde3f0"
              opacity={0.3 + (i % 5) * 0.1}
            />
          );
        })}
      </svg>

      {/* Color glow */}
      <div
        style={{
          position: 'absolute',
          right: '20%',
          top: '50%',
          transform: 'translate(50%, -50%)',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(79, 124, 250, 0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Orbital rings — anchored to the right side so they sit behind the avatar cluster */}
      <div
        style={{
          position: 'absolute',
          right: '18%',
          top: '50%',
          transform: 'translate(50%, -50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          border: '1px dashed rgba(139, 92, 246, 0.25)',
          animation: 'plos-people-spin 38s linear infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '18%',
          top: '50%',
          transform: 'translate(50%, -50%)',
          width: 460,
          height: 460,
          borderRadius: '50%',
          border: '1px dashed rgba(79, 124, 250, 0.18)',
          animation: 'plos-people-spin 60s linear infinite reverse',
          pointerEvents: 'none',
        }}
      />

      {/* Avatar cluster — anchored relative to a "stage" on the right side */}
      <div
        style={{
          position: 'absolute',
          right: '18%',
          top: '50%',
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Center: the user */}
        <Avatar
          name={center?.name ?? 'You'}
          color={RELATION_COLORS[center?.relation ?? 'self'] ?? '#4f7cfa'}
          size={86}
          x={0}
          y={0}
          delay={0}
          isCenter
        />

        {/* Orbital avatars (real people) */}
        {placed.map((p) => (
          <Avatar
            key={p.person.id}
            name={p.person.name}
            color={RELATION_COLORS[p.person.relation] ?? '#9aa3b8'}
            size={p.size}
            x={p.x}
            y={p.y}
            delay={p.delay}
          />
        ))}

        {/* Ghost slots when there's nobody else yet */}
        {placed.length === 0 &&
          ghostSlots.map((slot, i) => {
            const rad = (slot.angle * Math.PI) / 180;
            const x = Math.cos(rad) * slot.r;
            const y = Math.sin(rad) * slot.r;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: slot.size,
                  height: slot.size,
                  marginLeft: -slot.size / 2,
                  marginTop: -slot.size / 2,
                  borderRadius: '50%',
                  border: '1px dashed rgba(221, 227, 240, 0.18)',
                  background: 'rgba(221, 227, 240, 0.02)',
                  animation: `plos-people-bob ${5 + i * 0.6}s ease-in-out ${i * 0.3}s infinite alternate`,
                }}
              />
            );
          })}
      </div>

      <style>{`
        @keyframes plos-people-bob {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(2px, -6px); }
        }
        @keyframes plos-people-spin {
          from { transform: translate(50%, -50%) rotate(0deg); }
          to   { transform: translate(50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PeopleHero;
