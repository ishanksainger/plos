import { useEffect } from 'react';

/**
 * Drives the body's gradient-mesh CSS variables off the cursor — gives
 * the lavender background a slow, living drift as the user moves their
 * mouse. Ported from interactions.jsx (usePlosMouseMesh).
 *
 * Updates the `--mesh-x1`, `--mesh-y1`, `--mesh-x2`, `--mesh-y2`,
 * `--mesh-x3`, `--mesh-y3` variables on `<html>` at most once per frame.
 */
export function usePlosMouseMesh(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let raf = 0;
    let tx = 50;
    let ty = 30;
    let cx = 50;
    let cy = 30;

    const tick = () => {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      const r = document.documentElement;
      r.style.setProperty('--mesh-x1', `${cx}%`);
      r.style.setProperty('--mesh-y1', `${cy}%`);
      r.style.setProperty('--mesh-x2', `${100 - cx}%`);
      r.style.setProperty('--mesh-y2', `${cy + 10}%`);
      r.style.setProperty('--mesh-x3', `${cx - 10}%`);
      r.style.setProperty('--mesh-y3', `${100 - cy * 0.4}%`);
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      tx = 30 + (e.clientX / window.innerWidth) * 40;
      ty = 18 + (e.clientY / window.innerHeight) * 30;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
}
