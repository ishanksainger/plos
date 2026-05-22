import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Browser-safe client (anon key, RLS-enforced). */
export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Server-side client with SSR cookie handling (anon key, respects user session). */
export function getServerSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set() {
        // App Router route handlers can write; pages cannot. Leaving as no-op
        // here — orders flow doesn't need to mutate cookies.
      },
      remove() {
        // see set()
      },
    },
  });
}

/**
 * Server-only client using the service role key. Bypasses RLS — only use
 * inside trusted API routes (e.g. webhook handlers, order fulfillment).
 */
export function getServiceSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      'Supabase service role not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
