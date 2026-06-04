import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

// This page reads a per-purchase token and queries Supabase, so it must run
// dynamically on the Node runtime (the service-role client is server-only).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your download',
  description: 'Download your NIS purchase.',
  // Never index a tokenised URL.
  robots: { index: false, follow: false },
};

type Props = { searchParams: { token?: string } };

type TokenInfo = {
  title: string;
  expiresAt: Date;
  remaining: number;
  state: 'ok' | 'expired' | 'exhausted';
};

/**
 * Read-only token lookup. Crucially this NEVER increments used_count — the
 * count is only spent when the buyer clicks through to /api/download. That is
 * the whole point of this page: email link-scanners prefetch the link in the
 * receipt, and if that link were the API route they would silently burn the
 * buyer's downloads. A scanner loading this page costs nothing.
 */
async function lookupToken(token: string): Promise<TokenInfo | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .schema('commerce')
    .from('download_tokens')
    .select(
      `expires_at, used_count, max_uses,
       order_item:order_items!inner (
         product:products!inner ( title )
       )`,
    )
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;

  // PostgREST returns the joined relation as array-or-object; normalize both.
  const orderItem = Array.isArray(data.order_item) ? data.order_item[0] : data.order_item;
  const product = orderItem?.product
    ? Array.isArray(orderItem.product)
      ? orderItem.product[0]
      : orderItem.product
    : null;

  const expiresAt = new Date(data.expires_at as string);
  const remaining = Math.max(0, (data.max_uses as number) - (data.used_count as number));
  const state: TokenInfo['state'] =
    expiresAt < new Date() ? 'expired' : remaining <= 0 ? 'exhausted' : 'ok';

  return {
    title: (product?.title as string) ?? 'your download',
    expiresAt,
    remaining,
    state,
  };
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="nis-section"
      style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}
    >
      {children}
    </section>
  );
}

function Message({ eyebrow, heading, body }: { eyebrow: string; heading: string; body: string }) {
  return (
    <Panel>
      <div className="nis-section-eyebrow">{eyebrow}</div>
      <h1 className="nis-h2" style={{ margin: '12px 0 16px' }}>
        {heading}
      </h1>
      <p style={{ margin: '0 auto', maxWidth: '46ch', color: 'var(--ink-2)', lineHeight: 1.6 }}>
        {body}{' '}
        <a href="mailto:hello@thenispace.com" style={{ color: 'var(--accent)' }}>
          hello@thenispace.com
        </a>{' '}
        and we&rsquo;ll sort it out.
      </p>
    </Panel>
  );
}

export default async function DownloadPage({ searchParams }: Props) {
  const token = searchParams.token?.trim();

  if (!token) {
    return (
      <NisShell>
        <Message
          eyebrow="Download"
          heading="This link looks incomplete"
          body="The download link is missing its token. Open the link straight from your receipt email, or write to"
        />
      </NisShell>
    );
  }

  const info = await lookupToken(token);

  if (!info) {
    return (
      <NisShell>
        <Message
          eyebrow="Download"
          heading="We couldn&rsquo;t find this download"
          body="This link is invalid or has been revoked. Check you copied the whole link from your receipt, or write to"
        />
      </NisShell>
    );
  }

  if (info.state === 'expired') {
    return (
      <NisShell>
        <Message
          eyebrow="Download"
          heading="This link has expired"
          body="Download links are valid for 7 days after purchase. We&rsquo;re happy to re-issue yours — just reply to your receipt or write to"
        />
      </NisShell>
    );
  }

  if (info.state === 'exhausted') {
    return (
      <NisShell>
        <Message
          eyebrow="Download"
          heading="Download limit reached"
          body="This link has been used the maximum number of times. We can re-issue it for you — just reply to your receipt or write to"
        />
      </NisShell>
    );
  }

  const expiresFmt = info.expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Plain <a> (not next/link) so Next.js never prefetches the actual download —
  // the use is spent only on a real human click.
  return (
    <NisShell>
      <Panel>
        <div className="nis-section-eyebrow">Download ready</div>
        <h1 className="nis-h2" style={{ margin: '12px 0 12px' }}>
          {info.title}
        </h1>
        <p style={{ margin: '0 auto 32px', maxWidth: '44ch', color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Your purchase is ready. Click below to download your file.
        </p>

        <a
          href={`/api/download?token=${encodeURIComponent(token)}`}
          style={{
            display: 'inline-block',
            padding: '15px 28px',
            background: 'var(--accent)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '9999px',
            fontWeight: 600,
          }}
        >
          Download now
        </a>

        <p style={{ margin: '24px 0 0', fontSize: '14px', color: 'var(--ink-2)' }}>
          Link expires <strong>{expiresFmt}</strong> ·{' '}
          {info.remaining} download{info.remaining === 1 ? '' : 's'} remaining.
        </p>
      </Panel>
    </NisShell>
  );
}
