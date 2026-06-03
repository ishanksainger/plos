/**
 * Currency helpers. Always go through Intl.NumberFormat (CLAUDE.md §5) so we can
 * change locale/country later without hunting hardcoded `₹`.
 */

/** Format a rupee amount (whole rupees) as INR, no decimals by default. */
export function formatRupees(rupees: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    ...opts,
  }).format(rupees);
}

/** Format a paise amount (₹1 = 100 paise) as INR. Backend pricing is in paise. */
export function formatPaise(paise: number, opts?: Intl.NumberFormatOptions): string {
  return formatRupees(paise / 100, opts);
}
