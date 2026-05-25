'use client';

import { useCart, totalCount } from '@/lib/cart-store';

const CartIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h8.2a2 2 0 0 0 2-1.5L21 8H6" />
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
  </svg>
);

export function CartButton() {
  const items = useCart((s) => s.items);
  const openDrawer = useCart((s) => s.openDrawer);
  const count = totalCount(items);

  return (
    <button
      type="button"
      className="nis-cart-btn"
      onClick={openDrawer}
      aria-label={count > 0 ? `Open cart (${count} item${count === 1 ? '' : 's'})` : 'Open cart'}
    >
      {CartIcon}
      {count > 0 && <span className="nis-cart-badge" aria-hidden="true">{count}</span>}
    </button>
  );
}
