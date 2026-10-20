import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, googleConfigured } from '@/lib/google';
import { loginWithGoogle, safeNext } from '@/lib/customer';

export const dynamic = 'force-dynamic';

const fail = (origin: string, code: string) => {
  const res = NextResponse.redirect(new URL(`/account/login?error=${code}`, origin));
  res.cookies.delete({ name: 'st_oauth', path: '/api/auth/google' });
  return res;
};

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleConfigured()) return fail(origin, 'google_off');
  const q = req.nextUrl.searchParams;
  if (q.get('error')) return fail(origin, q.get('error') === 'access_denied' ? 'google_denied' : 'google');
  let saved: { state: string; verifier: string; next: string } | null = null;
  try { saved = JSON.parse(req.cookies.get('st_oauth')?.value || 'null'); } catch {}
  const state = q.get('state') || '';
  const code = q.get('code') || '';
  const a = Buffer.from(state), b = Buffer.from(saved?.state || '');
  if (!saved || !code || a.length === 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return fail(origin, 'google_state');
  try {
    const profile = await exchangeCode(origin, code, saved.verifier);
    await loginWithGoogle(profile);
  } catch (e) {
    console.error('Google உள்நுழைவுப் பிழை', e);
    return fail(origin, 'google');
  }
  const res = NextResponse.redirect(new URL(safeNext(saved.next), origin));
  res.cookies.delete({ name: 'st_oauth', path: '/api/auth/google' });
  return res;
}
