import type { ReactNode } from 'react';

export type EmptyKind =
  | 'people'
  | 'habits'
  | 'responsibilities'
  | 'filter'
  | 'timeline'
  | 'notifications';

interface Props {
  kind: EmptyKind;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/**
 * Friendly empty state used across PLOS modules. Each `kind` gets a small
 * inline SVG so we don't have to ship raster assets. Replace these with
 * Nikita's illustrations later by swapping the SVG body — the layout
 * shell stays.
 */
export function PlosEmptyState({ kind, title, subtitle, action }: Props) {
  return (
    <div
      className="glass"
      style={{
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Illustration kind={kind} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--plos-ink-1)' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--plos-ink-3)', maxWidth: 360, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

function Illustration({ kind }: { kind: EmptyKind }) {
  const common = {
    width: 120,
    height: 88,
    fill: 'none' as const,
    stroke: 'currentColor' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const accent = 'var(--plos-accent, #7c3aed)';
  const soft = 'var(--plos-accent-soft, rgba(124,58,237,0.12))';

  switch (kind) {
    case 'people':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          <circle cx="50" cy="40" r="14" fill={soft} stroke={accent} strokeWidth="1.5" />
          <circle cx="80" cy="32" r="18" fill={soft} stroke={accent} strokeWidth="1.5" />
          <circle cx="112" cy="44" r="13" fill={soft} stroke={accent} strokeWidth="1.5" />
          <path d="M30 80 q15 -18 35 -16" strokeWidth="1.2" />
          <path d="M55 80 q25 -22 50 -16" strokeWidth="1.2" />
          <path d="M82 82 q25 -16 48 -10" strokeWidth="1.2" />
        </svg>
      );

    case 'habits':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const cx = 16 + i * 22;
            const filled = i < 4;
            const today = i === 4;
            return (
              <g key={i}>
                {today && (
                  <circle cx={cx} cy={48} r={11} fill="none" stroke={accent} strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="10;13;10" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={cx}
                  cy={48}
                  r={7}
                  fill={filled || today ? accent : 'transparent'}
                  stroke={accent}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
          <path d="M14 48 q33 18 67 0 t67 0" strokeWidth="1" opacity="0.32" stroke={accent} />
        </svg>
      );

    case 'responsibilities':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          <rect x="36" y="14" width="88" height="68" rx="8" fill={soft} stroke={accent} strokeWidth="1.5" />
          <rect x="60" y="8" width="40" height="14" rx="4" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M48 34 h64" strokeWidth="1.3" />
          <path d="M48 48 h48" strokeWidth="1.3" />
          <path d="M48 62 h54" strokeWidth="1.3" />
          <path d="M44 34 l2 2 l4 -4" strokeWidth="1.6" stroke={accent} />
        </svg>
      );

    case 'filter':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          <circle cx="68" cy="44" r="22" fill={soft} stroke={accent} strokeWidth="1.5" />
          <path d="M86 60 l16 16" strokeWidth="2" stroke={accent} />
          <path d="M58 44 h20" strokeWidth="1.2" />
        </svg>
      );

    case 'timeline':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          <path d="M16 78 q22 -42 56 -42 t72 -34" strokeWidth="1.6" stroke={accent} fill="none" />
          <circle cx="28" cy="68" r="3" fill={accent} />
          <circle cx="60" cy="48" r="3" fill={accent} />
          <circle cx="96" cy="40" r="3" fill={accent} />
          <circle cx="132" cy="30" r="3" fill={accent} />
        </svg>
      );

    case 'notifications':
      return (
        <svg {...common} viewBox="0 0 160 96" style={{ color: 'var(--plos-ink-3)' }}>
          <path d="M58 30 a22 22 0 0 1 44 0 v18 l6 8 h-56 l6 -8z" fill={soft} stroke={accent} strokeWidth="1.5" />
          <path d="M72 60 a8 8 0 0 0 16 0" strokeWidth="1.5" stroke={accent} />
        </svg>
      );
  }
}
