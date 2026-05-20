# @nis/razorpay-sdk

Shared Razorpay client used by:
- `apps/web` — for commerce orders (tracker / canvas / POD purchases)
- `plos-backend` — for PLOS subscription billing (Step M of PLOS roadmap)

## Why a shared package

Two reasons:
1. **One set of credentials handled correctly** — webhook signature verification logic lives once, not copy-pasted.
2. **Single dependency version** — when Razorpay SDK updates, you upgrade once.

## Public API (to be built)

```typescript
// Orders (used by apps/web)
createOrder(amountInPaise: number, currency: string, notes: object): Promise<Order>
verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean

// Subscriptions (used by plos-backend)
createSubscription(planId: string, customerId: string): Promise<Subscription>
cancelSubscription(subscriptionId: string, atPeriodEnd: boolean): Promise<void>

// Webhooks (used by both)
verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean
parseWebhookEvent(rawBody: string): RazorpayWebhookEvent
```

## Environment variables (consumers must provide)

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Status

Stub. First implementation happens alongside Week 1 of NIS (first paid purchase) and Sprint 5 of PLOS (subscriptions). Whoever ships first builds the shared package; the other reuses it.
