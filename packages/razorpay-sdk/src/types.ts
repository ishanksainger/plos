export type CreateOrderOptions = {
  amountPaise: number;
  currency?: 'INR';
  receipt: string;
  notes?: Record<string, string>;
};

export type CreateOrderResult = {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
};

export type VerifySignatureOptions = {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
};

export type FetchOrderResult = {
  orderId: string;
  amountPaise: number;
  status: string;
  /** The server-set notes we attached at order creation (productSlug, etc.). */
  notes: Record<string, string>;
};

export type RazorpayCheckoutHandlerPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency?: 'INR';
  name: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  handler: (payload: RazorpayCheckoutHandlerPayload) => void | Promise<void>;
  onDismiss?: () => void;
};
