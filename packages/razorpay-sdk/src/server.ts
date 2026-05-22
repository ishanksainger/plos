/**
 * Server-only Razorpay helpers. Never import this file in a client component.
 */

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import type {
  CreateOrderOptions,
  CreateOrderResult,
  VerifySignatureOptions,
} from './types';

let _client: Razorpay | null = null;

function getClient(keyId: string, keySecret: string): Razorpay {
  if (!_client) {
    _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _client;
}

/**
 * Reads RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET from process.env.
 * Throws if either is missing. Catch this at the API route boundary
 * and return a 503 in dev mode so the UI can show "configure Razorpay".
 */
export function requireServerEnv(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set. ' +
        'Add test keys from https://dashboard.razorpay.com to apps/web/.env.local',
    );
  }
  return { keyId, keySecret };
}

export async function createOrder(opts: CreateOrderOptions): Promise<CreateOrderResult> {
  const { keyId, keySecret } = requireServerEnv();
  const client = getClient(keyId, keySecret);

  const order = await client.orders.create({
    amount: opts.amountPaise,
    currency: opts.currency ?? 'INR',
    receipt: opts.receipt,
    notes: opts.notes,
  });

  return {
    orderId: order.id,
    amountPaise:
      typeof order.amount === 'number' ? order.amount : Number.parseInt(String(order.amount), 10),
    currency: 'INR',
    keyId,
  };
}

/**
 * Verifies a Razorpay payment signature. Returns true only when the HMAC
 * of `orderId|paymentId` (signed with keySecret) matches `signature`.
 */
export function verifySignature(opts: VerifySignatureOptions): boolean {
  const expected = crypto
    .createHmac('sha256', opts.keySecret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(opts.signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay webhook signature (X-Razorpay-Signature header)
 * against the raw request body. Uses RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
