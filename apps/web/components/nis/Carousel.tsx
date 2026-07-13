'use client';

import Image from 'next/image';
import { useCallback, useId, useRef, useState } from 'react';

/**
 * Carousel — shows a set of slides in ONE box, swipeable / arrow-navigable.
 *
 * This is the shared pattern for any multi-image design on the site (the
 * Lookbook carousels today; any future Canva set or screenshot strip later).
 * Slides are 4:5 by default (Instagram portrait) — pass `ratio` to override.
 */
export function Carousel({
  slides,
  alt,
  accent = 'var(--nis-accent-electric)',
  ratio = '4 / 5',
  sizes = '(max-width: 720px) 92vw, 440px',
}: {
  slides: string[];
  /** Base alt text; the slide number is appended per image. */
  alt: string;
  accent?: string;
  ratio?: string;
  sizes?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const labelId = useId();
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex((prev) => (next + total) % total),
    [total],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index + 1);
      }
    },
    [go, index],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  const single = total <= 1;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        borderRadius: 'var(--nis-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--rule)',
        background: `linear-gradient(135deg, ${accent}1f, ${accent}08)`,
        outlineColor: accent,
      }}
    >
      <span id={labelId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {alt}
      </span>

      {/* Slides — only the active one is shown; others stay mounted for instant swap. */}
      {slides.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== index}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: 'opacity 220ms ease',
            pointerEvents: i === index ? 'auto' : 'none',
          }}
        >
          <Image
            src={src}
            alt={`${alt} — slide ${i + 1} of ${total}`}
            fill
            sizes={sizes}
            style={{ objectFit: 'cover' }}
            priority={i === 0}
          />
        </div>
      ))}

      {!single && (
        <>
          {/* Slide counter */}
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 9px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              color: 'rgba(255,255,255,0.92)',
              fontFamily: 'var(--nis-font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              backdropFilter: 'blur(4px)',
            }}
          >
            {index + 1} / {total}
          </div>

          {/* Prev / next */}
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} style={arrowStyle('left')}>
            <Chevron dir="left" />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} style={arrowStyle('right')}>
            <Chevron dir="right" />
          </button>

          {/* Dots */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            {slides.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                style={{
                  width: i === index ? 20 : 7,
                  height: 7,
                  borderRadius: 999,
                  padding: 0,
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                  transition: 'width 200ms ease, background 200ms ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    left: side === 'left' ? 10 : undefined,
    right: side === 'right' ? 10 : undefined,
    transform: 'translateY(-50%)',
    width: 34,
    height: 34,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    backdropFilter: 'blur(4px)',
  };
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
