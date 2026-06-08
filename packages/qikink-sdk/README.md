# @nis/qikink-sdk

Server-side typed client for the **Qikink Open API** — print-on-demand (POD)
fulfilment for NIS merch. Mirrors the shape of `@nis/razorpay-sdk`: pure
TypeScript source consumed directly by the workspace (no build step), with the
server-only surface behind the `/server` subpath.

Used by:
- `apps/web` — to fulfil merch orders after a Razorpay payment is captured
  (the Phase-2 storefront; see `BACKLOG.md` items #9–#18).

## Why a shared package

Same reasons as the Razorpay SDK: one place that holds the auth/token logic and
the wire types, so the field names (`ClientId`, `Accesstoken`, `line_items`, …)
are defined once instead of copy-pasted across routes.

## Public API

```ts
import {
  createOrder,
  listOrders,
  getOrder,
  getAccessToken,
  requireServerEnv,
  paiseToRupeeString,
  currentMode,
  QikinkError,
} from '@nis/qikink-sdk/server';

import type {
  QikinkCreateOrderInput,
  QikinkLineItem,
  QikinkShippingAddress,
} from '@nis/qikink-sdk/types';
```

| Function | Endpoint | Notes |
|---|---|---|
| `getAccessToken(cfg?, force?)` | `POST /api/token` | Cached (45-min soft TTL) + auto re-auth on 401. |
| `createOrder(input, cfg?)` | `POST /api/order/create` | Submit a POD order. |
| `listOrders(params?, cfg?)` | `GET /api/order` | Optional `id` / `from_date` / `to_date`. |
| `getOrder(id, cfg?)` | `GET /api/order?id=` | Single order or `null`. |

`requireServerEnv()` resolves config from env; `paiseToRupeeString()` converts
our paise to the rupee strings Qikink expects; `QikinkError` carries `status` +
parsed `body` for clean handling at the route boundary.

## Environment variables (consumers must provide)

```
QIKINK_CLIENT_ID=
QIKINK_CLIENT_SECRET=
QIKINK_API_BASE=        # optional; defaults to the sandbox base
```

- Sandbox base: `https://sandbox.qikink.com`
- Live base: `https://api.qikink.com`

For `apps/web` these live (ungitignored-only locally) in `apps/web/.env.local`,
and in prod in `/docker/nis-web/.env`.

## Money

Qikink's API is **rupee-denominated** and wants **string** amounts. Our app
stores **paise**. Always convert at the boundary with `paiseToRupeeString()` —
never pass paise to Qikink.

## What is NOT in the Open API

The published Open API only exposes **token** + **order** endpoints. There is
**no** products-catalog or pincode/shipping-quote endpoint. Consequences:

- **Merch catalog** (BACKLOG #9) is a hardcoded SKU list in
  `apps/web/lib/merch-catalog.ts`, mirroring SKUs created in the Qikink
  dashboard — not fetched at runtime.
- **Shipping** is delegated to Qikink by sending `qikink_shipping: '1'`; there
  is no separate quote call. The BACKLOG `/api/qikink/shipping-quote` item (#13)
  should be re-scoped to a flat/zone rule or Qikink's published rate card.

## Sandbox-first workflow (important)

1. Build + **smoke-test against sandbox** (this package).
2. Only then request **live** access: dashboard.qikink.com → Integrations →
   Open API → "Request Live API Credentials". Qikink **declines** the request if
   you haven't made sandbox calls first.
3. Swap to live keys (`QIKINK_API_BASE=https://api.qikink.com` + live ClientId/secret).

### Smoke test

Authenticates against the sandbox and prints a (masked) token. Reads creds from
`apps/web/.env.local`:

```bash
node packages/qikink-sdk/scripts/smoke.mjs
# or
npm run smoke --workspace=@nis/qikink-sdk
```

It only mints a token — it does not create an order.

## Status

v0.1.0 — auth + order endpoints implemented and **sandbox-auth verified**.
Catalog, checkout, webhook fulfilment, and tracking are the follow-on BACKLOG
items (#9–#18).
