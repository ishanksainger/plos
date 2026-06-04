import type { Metadata } from 'next';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatINR } from '@/lib/tracker-catalog';

// Reads live commerce data via the service-role client — Node runtime, never
// cached. Access is gated by Basic Auth in middleware.ts.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orders · Admin',
  robots: { index: false, follow: false },
};

const ORDER_LIMIT = 100;

type TokenRow = { used_count: number; max_uses: number; expires_at: string };
type ItemRow = {
  id: string;
  product_id: string;
  quantity: number;
  price_paise: number;
  tokens: TokenRow[] | null;
};
type OrderRow = {
  id: string;
  email: string;
  total_paise: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  items: ItemRow[] | null;
};

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fef3c7', fg: '#92400e' },
  paid: { bg: '#dbeafe', fg: '#1e40af' },
  fulfilled: { bg: '#dcfce7', fg: '#166534' },
  failed: { bg: '#fee2e2', fg: '#991b1b' },
  refunded: { bg: '#f3f4f6', fg: '#374151' },
};

function fmtIST(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: '#f3f4f6', fg: '#374151' };
  return (
    <span
      style={{
        background: tone.bg,
        color: tone.fg,
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px 18px',
        background: '#fff',
      }}
    >
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#0a0a0a' }}>{value}</div>
    </div>
  );
}

export default async function AdminOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p style={{ color: '#991b1b' }}>
          Supabase is not configured — set <code>SUPABASE_SERVICE_ROLE_KEY</code> and the URL/anon
          keys to view orders.
        </p>
      </Shell>
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .schema('commerce')
    .from('orders')
    .select(
      `id, email, total_paise, status, razorpay_order_id, razorpay_payment_id,
       created_at, paid_at, fulfilled_at,
       items:order_items (
         id, product_id, quantity, price_paise,
         tokens:download_tokens ( used_count, max_uses, expires_at )
       )`,
    )
    .order('created_at', { ascending: false })
    .limit(ORDER_LIMIT);

  if (error) {
    return (
      <Shell>
        <p style={{ color: '#991b1b' }}>Failed to load orders: {error.message}</p>
      </Shell>
    );
  }

  const orders = (data ?? []) as OrderRow[];

  // Gross is summed from line items (not orders.total_paise, which records the
  // line price rather than the cart total for multi-item carts), across orders
  // that actually got paid.
  const isPaid = (s: string) => s === 'paid' || s === 'fulfilled';
  const grossPaise = orders
    .filter((o) => isPaid(o.status))
    .reduce((sum, o) => sum + (o.items ?? []).reduce((s, it) => s + it.price_paise, 0), 0);

  const since = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = orders.filter((o) => new Date(o.created_at).getTime() >= since).length;

  return (
    <Shell>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <Stat label={`Recent orders (max ${ORDER_LIMIT})`} value={String(orders.length)} />
        <Stat label="Gross (paid + fulfilled)" value={formatINR(grossPaise)} />
        <Stat label="New in last 24h" value={String(last24h)} />
      </div>

      {orders.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No orders yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: '12px' }}>
                <th style={th}>Created (IST)</th>
                <th style={th}>Email</th>
                <th style={th}>Status</th>
                <th style={th}>Items / downloads</th>
                <th style={{ ...th, textAlign: 'right' }}>Total</th>
                <th style={th}>Razorpay payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const lineTotal = (o.items ?? []).reduce((s, it) => s + it.price_paise, 0);
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                    <td style={td}>{fmtIST(o.created_at)}</td>
                    <td style={td}>{o.email}</td>
                    <td style={td}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={td}>
                      {(o.items ?? []).length === 0 ? (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      ) : (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {(o.items ?? []).map((it) => {
                            const tok = (it.tokens ?? [])[0];
                            return (
                              <li key={it.id} style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 500 }}>{it.product_id}</span>
                                {it.quantity > 1 ? ` ×${it.quantity}` : ''}
                                {tok ? (
                                  <span style={{ color: '#6b7280', fontSize: '12px' }}>
                                    {' '}
                                    · {tok.used_count}/{tok.max_uses} downloads · exp{' '}
                                    {fmtIST(tok.expires_at)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                    {' '}
                                    · no token
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatINR(lineTotal)}
                    </td>
                    <td style={{ ...td, color: '#6b7280', fontSize: '12px' }}>
                      {o.razorpay_payment_id ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px' };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 24px 80px',
        fontFamily: '-apple-system, system-ui, sans-serif',
        color: '#0a0a0a',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>Orders</h1>
      <p style={{ color: '#6b7280', margin: '0 0 28px', fontSize: '14px' }}>
        Live from Supabase · newest first · refresh to update.
      </p>
      {children}
    </main>
  );
}
