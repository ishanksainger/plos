/**
 * Qikink has two completely separate environments with separate credentials.
 * Sandbox is safe to call freely — it never ships product or charges anyone.
 * Live must be requested + approved in the dashboard, and Qikink declines the
 * request unless you've already made sandbox calls — so build + smoke-test
 * against sandbox first, then request live.
 */
import type { QikinkMode } from './types';

export const QIKINK_SANDBOX_BASE = 'https://sandbox.qikink.com';
export const QIKINK_LIVE_BASE = 'https://api.qikink.com';

export function modeForBaseUrl(baseUrl: string): QikinkMode {
  return baseUrl.includes('sandbox.qikink.com') ? 'sandbox' : 'live';
}

export function isSandbox(baseUrl: string): boolean {
  return modeForBaseUrl(baseUrl) === 'sandbox';
}

export function isLive(baseUrl: string): boolean {
  return modeForBaseUrl(baseUrl) === 'live';
}
