import { useSyncExternalStore } from 'react';

/**
 * Tiny global store for the "you've hit a plan limit" modal. Lives outside React
 * so the QueryClient's MutationCache (which runs outside the component tree) can
 * open it on any `PLAN_LIMIT_REACHED` 403. Dormant-safe: while billing is off the
 * backend never throws that code, so this never fires.
 */
export type LimitModalDetail = {
  /** 'people' | 'responsibilities' | 'imports' */
  resource?: string;
  /** The free-tier ceiling that was hit. */
  limit?: number;
  /** Server-provided human message, if any. */
  message?: string;
};

type LimitModalState = { open: boolean } & LimitModalDetail;

const CLOSED: LimitModalState = { open: false };
let state: LimitModalState = CLOSED;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function openLimitModal(detail: LimitModalDetail = {}): void {
  state = { open: true, ...detail };
  emit();
}

export function closeLimitModal(): void {
  if (!state.open) return;
  state = CLOSED;
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): LimitModalState {
  return state;
}

export function useLimitModalState(): LimitModalState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
