'use client';

import type { CSSProperties } from 'react';

/**
 * Stand-in for the prototype's <image-slot> custom element.
 * Just a placeholder block with the brief — Nikita drops in art later.
 */
export function ImageSlot({
  id,
  shape = 'rect',
  radius = 12,
  placeholder = 'Image slot',
  style,
}: {
  id?: string;
  shape?: 'rect' | 'rounded' | 'circle';
  radius?: number;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const borderRadius =
    shape === 'circle' ? '50%' : shape === 'rounded' ? `${radius}px` : '4px';

  return (
    <div
      data-image-slot={id}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius,
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        border: '1px dashed var(--nis-border-default)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink-3, var(--nis-fg-muted))',
        fontFamily: 'var(--nis-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: 12,
        ...style,
      }}
    >
      {placeholder}
    </div>
  );
}
