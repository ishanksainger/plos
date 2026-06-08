/**
 * Qikink sandbox smoke test — proves the credentials in apps/web/.env.local can
 * authenticate against the Qikink sandbox and mint an Accesstoken. This mirrors
 * the token call in src/server.ts (kept dependency-free so it runs with a bare
 * `node scripts/smoke.mjs`). It deliberately does NOT create an order — auth is
 * the contract we need to verify before requesting live API access.
 *
 * Run:  node packages/qikink-sdk/scripts/smoke.mjs
 *   or: npm run smoke --workspace=@nis/qikink-sdk
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(here, '../../../apps/web/.env.local');

function loadEnvFile(path) {
  const out = {};
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return out;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

// process.env wins over the file (so CI / one-off overrides work).
const env = { ...loadEnvFile(ENV_PATH), ...process.env };
const clientId = env.QIKINK_CLIENT_ID;
const clientSecret = env.QIKINK_CLIENT_SECRET;
const baseUrl = (env.QIKINK_API_BASE || 'https://sandbox.qikink.com').replace(/\/+$/, '');

if (!clientId || !clientSecret) {
  console.error('✗ QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET missing (looked in apps/web/.env.local).');
  process.exit(1);
}

const mode = baseUrl.includes('sandbox.qikink.com') ? 'sandbox' : 'LIVE';
console.log(`→ Qikink token smoke test  [${mode}]  ${baseUrl}/api/token`);

const body = new URLSearchParams();
body.set('ClientId', clientId);
body.set('client_secret', clientSecret);

try {
  const res = await fetch(`${baseUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}:`, text.slice(0, 300));
    process.exit(1);
  }
  const token = json && (json.Accesstoken || json.accesstoken || json.access_token);
  if (!token) {
    console.error('✗ 200 OK but no Accesstoken in response:', text.slice(0, 300));
    process.exit(1);
  }
  const t = String(token);
  console.log(`✓ Authenticated. Accesstoken: ${t.slice(0, 8)}…${t.slice(-4)} (len ${t.length})`);
  process.exit(0);
} catch (err) {
  console.error('✗ Request failed:', err?.message || err);
  process.exit(1);
}
