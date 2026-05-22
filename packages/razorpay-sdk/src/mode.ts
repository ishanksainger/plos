/**
 * Razorpay key IDs are prefixed: `rzp_test_*` (test mode) or `rzp_live_*` (live).
 * These helpers let calling code branch (e.g. show "TEST MODE" badge).
 */

export function isTestMode(keyId: string | undefined): boolean {
  return Boolean(keyId && keyId.startsWith('rzp_test_'));
}

export function isLiveMode(keyId: string | undefined): boolean {
  return Boolean(keyId && keyId.startsWith('rzp_live_'));
}
