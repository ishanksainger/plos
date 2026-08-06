'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getPurchasableTracker, type Tracker } from './tracker-catalog';
import type { MadeToOrderDetail } from './fulfillment';

export interface CartLine {
  slug: string;
  qty: number;
  /** Made-to-order personalisation answers, collected when added. */
  details?: MadeToOrderDetail[];
}

interface CartState {
  items: CartLine[];
  drawerOpen: boolean;
  add: (slug: string, qty?: number, details?: MadeToOrderDetail[]) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      add: (slug, qty = 1, details) =>
        set((state) => {
          const tracker = getPurchasableTracker(slug);
          if (!tracker) return state;
          // Made-to-order lines are qty-locked to 1 and carry personalisation
          // details; re-adding refreshes those details rather than incrementing.
          const mto = tracker.madeToOrder === true;
          const existing = state.items.find((l) => l.slug === slug);
          if (existing) {
            return {
              items: state.items.map((l) =>
                l.slug === slug
                  ? mto
                    ? { ...l, qty: 1, details }
                    : { ...l, qty: l.qty + qty }
                  : l,
              ),
              drawerOpen: true,
            };
          }
          return {
            items: [...state.items, { slug, qty: mto ? 1 : qty, details }],
            drawerOpen: true,
          };
        }),
      setQty: (slug, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((l) => l.slug !== slug)
              : state.items.map((l) => (l.slug === slug ? { ...l, qty } : l)),
        })),
      remove: (slug) =>
        set((state) => ({ items: state.items.filter((l) => l.slug !== slug) })),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
    }),
    {
      name: 'nis-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function resolveCart(lines: CartLine[]): Array<{ line: CartLine; tracker: Tracker }> {
  return lines
    .map((line) => {
      const tracker = getPurchasableTracker(line.slug);
      return tracker ? { line, tracker } : null;
    })
    .filter((x): x is { line: CartLine; tracker: Tracker } => x !== null);
}

export function subtotalPaise(lines: CartLine[]): number {
  return resolveCart(lines).reduce(
    (sum, { line, tracker }) => sum + tracker.pricePaise * line.qty,
    0,
  );
}

export function totalCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}
