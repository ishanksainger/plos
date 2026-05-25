import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

type WaitlistRequest = {
  email?: string;
  source?: string;
  interestedIn?: string;
};

const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

const sanitiseSource = (s: string | undefined) => {
  if (!s) return 'plos';
  const trimmed = String(s).trim().slice(0, 64);
  return /^[a-z0-9:_\-]+$/i.test(trimmed) ? trimmed : 'plos';
};

export async function POST(req: Request) {
  let body: WaitlistRequest;
  try {
    body = (await req.json()) as WaitlistRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  }

  const source = sanitiseSource(body.source);
  const interestedIn = body.interestedIn?.trim().slice(0, 200) || null;
  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null;

  if (!isSupabaseConfigured()) {
    // Dev / pre-launch: log it server-side so we don't lose the early signal,
    // and tell the user we got it. Once Supabase is wired the upsert below
    // will start persisting.
    console.info('[waitlist] (no supabase, logging only)', { email, source, interestedIn });
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .schema('marketing')
      .from('waitlist')
      .upsert(
        { email, source, interested_in: interestedIn, user_agent: userAgent },
        { onConflict: 'email,source', ignoreDuplicates: true },
      );

    if (error) {
      console.error('[waitlist] supabase upsert failed', error);
      return NextResponse.json({ ok: true, persisted: false });
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[waitlist] unexpected', err);
    // Always return success to the user — losing one row is better than
    // showing an error and risking them not retrying.
    return NextResponse.json({ ok: true, persisted: false });
  }
}
