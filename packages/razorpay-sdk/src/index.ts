/**
 * Shared Razorpay client. Server-side helpers (createOrder, verifySignature)
 * and a tiny browser helper (loadCheckoutScript + openCheckout).
 *
 * Server import path: `@nis/razorpay-sdk/server`
 * Browser import path: `@nis/razorpay-sdk/client`
 *
 * Usage rules (see CLAUDE.md):
 *   - Never instantiate `new Razorpay()` directly outside this package.
 *   - Always go through createOrder / verifySignature.
 *   - Amounts are in paise (₹1 = 100 paise).
 */

export type {
  CreateOrderOptions,
  CreateOrderResult,
  VerifySignatureOptions,
  RazorpayCheckoutOptions,
  RazorpayCheckoutHandlerPayload,
} from './types';

export { isLiveMode, isTestMode } from './mode';
