/**
 * Shared Qikink Open API client for NIS print-on-demand (merch) fulfilment.
 *
 * Server import path: `@nis/qikink-sdk/server`
 * Types import path:  `@nis/qikink-sdk/types`
 *
 * There is no browser surface — every Qikink call is server-side because it
 * carries the client secret. This entrypoint re-exports only the isomorphic-safe
 * surface (types + environment constants). See README for the sandbox-first flow.
 */

export type {
  QikinkMode,
  QikinkConfig,
  QikinkTokenResponse,
  QikinkDesign,
  QikinkLineItem,
  QikinkShippingAddress,
  QikinkGateway,
  QikinkCreateOrderInput,
  QikinkCreateOrderResponse,
  QikinkOrder,
  QikinkGetOrderParams,
} from './types';

export { QIKINK_SANDBOX_BASE, QIKINK_LIVE_BASE, modeForBaseUrl, isSandbox, isLive } from './mode';
