import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Box, Text } from '@mantine/core';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const R = 90;
const R_INNER = 56;
const CX = 110;
const CY = 110;
const C_OUT = 2 * Math.PI * R;
const C_IN = 2 * Math.PI * R_INNER;

export interface DashboardDualRingsProps {
  /** Completion percentage (outer ring). */
  completionPct: number;
  /** Inner “score” 0–100 (derived health / momentum). */
  scorePct: number;
  tasks: number;
  done: number;
  upcoming: number;
  ratePct: number;
  /** Dark “now playing” styling for the completion card. */
  darkMode?: boolean;
}

/**
 * Dual rings: outer = completion, inner = score.
 */
const DashboardDualRings = ({
  completionPct,
  scorePct,
  tasks,
  done,
  upcoming,
  ratePct,
  darkMode = false,
}: DashboardDualRingsProps) => {
  const uid = useId().replace(/:/g, '');
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const run = (t: number) => {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / 900);
      setP(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setP(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [completionPct, scorePct]);

  const outerFrac = (Math.min(100, Math.max(0, completionPct)) / 100) * p;
  const innerFrac = (Math.min(100, Math.max(0, scorePct)) / 100) * p;
  const outerDash = `${outerFrac * C_OUT} ${C_OUT}`;
  const innerDash = `${innerFrac * C_IN} ${C_IN}`;

  const trackOuter = darkMode ? 'rgba(255,255,255,0.08)' : 'var(--dual-ring-track-outer)';
  const trackInner = darkMode ? 'rgba(255,255,255,0.08)' : 'var(--dual-ring-track-inner)';
  const strokeOuter = darkMode ? '#EDE7FF' : `url(#${uid}-go)`;
  const strokeInner = darkMode ? '#FFFFFF' : `url(#${uid}-gi)`;

  const pill = (label: string, val: string | number, sub: string, style: CSSProperties) => (
    <Box
      style={{
        position: 'absolute',
        padding: '5px 8px',
        borderRadius: 10,
        background: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
        border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--dual-ring-pill-border)',
        minWidth: 58,
        textAlign: 'center',
        boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: darkMode ? 'rgba(255,255,255,0.35)' : 'var(--text-secondary)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: darkMode ? 15 : 13,
          fontWeight: 700,
          color: darkMode ? '#FFFFFF' : 'var(--text-primary)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {val}
      </Text>
      <Text style={{ fontSize: darkMode ? 9 : 8, color: darkMode ? 'rgba(255,255,255,0.35)' : 'var(--text-muted)', marginTop: 1, textTransform: 'uppercase', fontWeight: 600 }}>{sub}</Text>
    </Box>
  );

  return (
    <Box
      style={{
        position: 'relative',
        width: 240,
        height: 240,
        margin: '0 auto',
      }}
    >
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          {!darkMode && (
            <>
              <linearGradient id={`${uid}-go`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5E35B1" />
                <stop offset="100%" stopColor="#9575CD" />
              </linearGradient>
              <linearGradient id={`${uid}-gi`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#512DA8" />
                <stop offset="100%" stopColor="#B39DDB" />
              </linearGradient>
            </>
          )}
        </defs>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={trackOuter} strokeWidth={6} />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={strokeOuter}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={outerDash}
            strokeDashoffset={0}
            style={darkMode ? { filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.6))' } : undefined}
          />
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke={trackInner} strokeWidth={9} />
          <circle
            cx={CX}
            cy={CY}
            r={R_INNER}
            fill="none"
            stroke={strokeInner}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={innerDash}
            strokeDashoffset={0}
          />
        </g>
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          fill={darkMode ? '#FFFFFF' : 'var(--text-primary)'}
          fontSize={darkMode ? 24 : 26}
          fontWeight={900}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(completionPct * p)}%
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fill={darkMode ? 'rgba(255,255,255,0.45)' : 'var(--text-secondary)'}
          fontSize={darkMode ? 10 : 9}
          fontWeight={darkMode ? 500 : 700}
          letterSpacing={darkMode ? '0.02em' : '0.14em'}
        >
          {darkMode ? 'Complete' : 'COMPLETE'}
        </text>
        {!darkMode && (
          <text x={CX} y={CY + 34} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight={700}>
            Score {Math.round(scorePct * p)}
          </text>
        )}
      </svg>

      {pill('TASKS', tasks, 'total', { top: 4, left: '50%', transform: 'translateX(-50%)' })}
      {pill('DONE', done, 'closed', { top: '50%', right: 0, transform: 'translateY(-50%)' })}
      {pill('UP', upcoming, 'soon', { bottom: 4, left: '50%', transform: 'translateX(-50%)' })}
      {pill('RATE', `${ratePct}%`, 'done', { top: '50%', left: 0, transform: 'translateY(-50%)' })}
    </Box>
  );
};

export default DashboardDualRings;
