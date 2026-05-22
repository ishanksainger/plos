import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll-reveal wrapper — matches the prototype's `.plos-reveal` /
 * `.plos-reveal.in` / `.plos-reveal-d1..4` CSS pattern (cinema.css). Uses
 * IntersectionObserver so the fade-up only fires once each card enters
 * the viewport — gives the cinematic staggered cascade.
 */
export function PlosReveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  /** 0..4 — each step adds 80ms of CSS transition-delay. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      // Wide bottom rootMargin so off-screen items reveal as soon as the page
      // renders, not only after the user scrolls them into the viewport.
      { threshold: 0, rootMargin: '0px 0px 200px 0px' },
    );
    obs.observe(node);

    // Fallback: if the observer hasn't fired after one second (rare — slow
    // mobile, screenshot tools, prerendering), force the element visible so
    // nothing stays stuck at opacity 0 forever.
    const fallback = window.setTimeout(() => setShown(true), 1000);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const d = delay ? ` plos-reveal-d${Math.min(4, delay)}` : '';
  return (
    <div ref={ref} className={`plos-reveal${d}${shown ? ' in' : ''}`}>
      {children}
    </div>
  );
}
