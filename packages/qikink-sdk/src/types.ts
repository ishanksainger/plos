/**
 * Qikink Open API types. Field names match the Qikink Open API exactly
 * (POST /api/token, POST /api/order/create, GET /api/order) — do NOT rename
 * them; they go over the wire verbatim.
 *
 * Source of truth: dashboard.qikink.com -> Integrations -> Open API (the
 * published Postman collection). Sandbox base https://sandbox.qikink.com,
 * live base https://api.qikink.com.
 *
 * Money note: Qikink's API is RUPEE-denominated and expects string amounts.
 * Our app stores paise (₹1 = 100 paise). Convert at the boundary with
 * `paiseToRupeeString()` in server.ts — never pass paise to Qikink.
 */

/** Which environment the base URL points at. */
export type QikinkMode = 'sandbox' | 'live';

/** Credentials + endpoint, resolved from env by `requireServerEnv()`. */
export type QikinkConfig = {
  clientId: string;
  clientSecret: string;
  /** Base origin, no trailing slash, e.g. https://sandbox.qikink.com */
  baseUrl: string;
};

/**
 * Response of POST /api/token. Qikink returns the token as `Accesstoken`;
 * we also read lower/snake-case variants defensively in server.ts.
 */
export type QikinkTokenResponse = {
  Accesstoken?: string;
  accesstoken?: string;
  access_token?: string;
};

/**
 * A design to print on a blank — used only when a line item is created on the
 * fly (search_from_my_products = 0). Our storefront pre-creates SKUs in the
 * Qikink dashboard and uses search_from_my_products = 1, so designs are
 * usually omitted, but the type supports both paths.
 */
export type QikinkDesign = {
  design_code: string;
  width_inches: string;
  height_inches: string;
  /** Placement code, e.g. 'fr' (front), 'bk' (back). */
  placement_sku: string;
  design_link: string;
  mockup_link: string;
};

/** One line in a Qikink order. */
export type QikinkLineItem = {
  /** The Qikink product SKU (e.g. 'MRb-Wh-S'). */
  sku: string;
  /** Quantity as a string — Qikink wants strings here. */
  quantity: string;
  /** Per-unit price in RUPEES as a string (not paise). */
  price: string;
  /** 1 = pull a product already saved in the Qikink dashboard; 0 = on-the-fly with `designs`. */
  search_from_my_products: 0 | 1;
  /** Required only when search_from_my_products = 0. */
  designs?: QikinkDesign[];
};

export type QikinkShippingAddress = {
  first_name: string;
  last_name: string;
  address1: string;
  phone: string;
  email: string;
  city: string;
  zip: string;
  province: string;
  /** ISO-2 country code, 'IN' for India. */
  country_code: string;
};

/** Payment mode passed to Qikink. */
export type QikinkGateway = 'COD' | 'Prepaid';

/** Body of POST /api/order/create. */
export type QikinkCreateOrderInput = {
  /** Your own order reference (we use our order uuid / Razorpay order id). */
  order_number: string;
  /** '1' lets Qikink handle shipping (the only mode we use). */
  qikink_shipping: '0' | '1';
  gateway: QikinkGateway;
  /** Total order value in RUPEES as a string. */
  total_order_value: string;
  line_items: QikinkLineItem[];
  shipping_address: QikinkShippingAddress;
};

/**
 * Response of POST /api/order/create. The success shape is only loosely
 * documented, so we type the useful fields and allow passthrough.
 */
export type QikinkCreateOrderResponse = {
  status?: string;
  order_id?: number | string;
  message?: string;
  [key: string]: unknown;
};

/** A Qikink order as returned by GET /api/order. Loosely typed — passthrough. */
export type QikinkOrder = {
  id?: number | string;
  number?: string;
  status?: string;
  [key: string]: unknown;
};

export type QikinkGetOrderParams = {
  /** Qikink order id, for a single order. */
  id?: string | number;
  /** YYYY-MM-DD inclusive range filters (list mode). */
  from_date?: string;
  to_date?: string;
};
